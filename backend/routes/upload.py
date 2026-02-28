from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.transaction import Document, Transaction, Insight
from backend.services.processor import process_document
from backend.services.extractor import DocumentExtractor
from backend.services.parser import TransactionParser

import shutil
import os
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "backend/uploads/statements"


# ==============================
# Upload Document
# ==============================
@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_document = Document(
        filename=filename,
        original_filename=file.filename,
        file_path=file_path,
        document_type=document_type,
        status="uploaded"
    )

    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    background_tasks.add_task(
        process_document,
        db_document.id,
        file_path,
        document_type,
        next(get_db())
    )

    return {
        "document_id": db_document.id,
        "filename": db_document.filename,
        "status": "uploaded",
        "message": "Processing started"
    }


# ==============================
# Delete Document
# ==============================
@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    # 1. Find document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2. Delete transactions
    db.query(Transaction).filter(Transaction.document_id == document_id).delete()
    
    # 3. Delete insights (since data changed)
    db.query(Insight).delete()

    # 4. Delete file from disk
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            print(f"Error deleting file {document.file_path}: {e}")

    # 5. Delete document record
    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully", "document_id": document_id}


# ==============================
# Get All Documents
# ==============================
@router.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()


# ==============================
# Get Single Document
# ==============================
@router.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):

    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


# ==============================
# Debug Extraction
# ==============================
@router.get("/debug/{document_id}")
def debug_document_extraction(document_id: int, db: Session = Depends(get_db)):

    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File not found at {document.file_path}"
        )

    extractor = DocumentExtractor()

    try:
        result = extractor.extract(document.file_path)
        text = result.get("text", "")

        return {
            "document_id": document_id,
            "filename": document.filename,
            "extraction_method": result.get("method"),
            "text_preview": text[:2000] + "..." if len(text) > 2000 else text
        }

    except Exception as e:
        return {"error": str(e)}


# ==============================
# GEMINI CONNECTION TEST
# ==============================
@router.get("/test-parse/{document_id}")
def test_parse(document_id: int, db: Session = Depends(get_db)):

    import traceback
    from dotenv import load_dotenv
    from google import genai

    load_dotenv()

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {"error": "GEMINI_API_KEY not found in .env"}

    try:

        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Return this exact text: GEMINI_WORKING"
        )

        return {
            "api_key_loaded": True,
            "gemini_response": response.text,
            "status": "Gemini working"
        }

    except Exception as e:

        return {
            "api_key_loaded": bool(api_key),
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }