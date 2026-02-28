from sqlalchemy.orm import Session
from backend.models.transaction import Document, Transaction
from backend.services.extractor import DocumentExtractor
from backend.services.parser import TransactionParser
from backend.services.categorizer import validate_category, detect_recurring
import traceback

def process_document(document_id: int, file_path: str, doc_type: str, db: Session):

    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            print(f"Document {document_id} not found")
            return
            
        document.status = "processing"
        db.commit()
        
        extractor = DocumentExtractor()
        extraction_result = extractor.extract(file_path)
        raw_text = extraction_result.get("text", "")
        
        print("=== EXTRACTED TEXT LENGTH ===") 
        print(len(raw_text)) 
        print("=== FIRST 500 CHARS ===") 
        print(raw_text[:500])
        
        if len(raw_text.strip()) < 100:
            document.status = "failed"
            db.commit()
            return {"error": "extraction failed or text too short"}
            
        parser = TransactionParser()
        transactions_data = parser.parse_in_chunks(raw_text, doc_type)
        
        print("=== TRANSACTIONS FOUND ===") 
        print(len(transactions_data)) 
        print("=== FIRST TRANSACTION ===") 
        if transactions_data: 
            print(transactions_data[0])
        
        new_transactions = []
        for tx_data in transactions_data:
            
            category = validate_category(
                tx_data.get("merchant"), 
                tx_data.get("description"), 
                tx_data.get("category")
            )
            
            new_tx = Transaction(
                document_id=document_id,
                date=tx_data.get("date"),
                description=tx_data.get("description"),
                merchant=tx_data.get("merchant"),
                amount=float(tx_data.get("amount", 0)),
                transaction_type=tx_data.get("type", "debit").lower(),
                category=category,
                raw_text=tx_data.get("description")
            )
            db.add(new_tx)
            new_transactions.append(new_tx)
            
        db.commit()
        
        all_transactions = db.query(Transaction).all()
        
        detect_recurring(all_transactions)
        
        db.commit()
        
        document.status = "done"
        document.transaction_count = len(new_transactions)
        db.commit()
        
        return {
            "document_id": document_id,
            "transactions_found": len(new_transactions),
            "status": "done"
        }
        
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        traceback.print_exc()
        
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.status = "failed"
                db.commit()
        except:
            pass
            
        return {"error": str(e)}
