from sqlalchemy.orm import Session
from backend.models.transaction import Document, Transaction
from backend.services.extractor import DocumentExtractor
from backend.services.parser import TransactionParser
from backend.services.categorizer import validate_category, detect_recurring
import traceback

def process_document(document_id: int, file_path: str, doc_type: str, db: Session):
    """
    Background task to extract, parse, and save transactions from a document.
    """
    try:
        # Step 1: Update status to processing
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            print(f"Document {document_id} not found")
            return
            
        document.status = "processing"
        db.commit()
        
        # Step 2: Extract text
        extractor = DocumentExtractor()
        extraction_result = extractor.extract(file_path)
        raw_text = extraction_result.get("text", "")
        
        print("=== EXTRACTED TEXT LENGTH ===") 
        print(len(raw_text)) 
        print("=== FIRST 500 CHARS ===") 
        print(raw_text[:500])
        
        # Step 3: Check extraction quality
        if len(raw_text.strip()) < 100:
            document.status = "failed"
            db.commit()
            return {"error": "extraction failed or text too short"}
            
        # Step 4: Parse transactions
        parser = TransactionParser()
        transactions_data = parser.parse_in_chunks(raw_text, doc_type)
        
        print("=== TRANSACTIONS FOUND ===") 
        print(len(transactions_data)) 
        print("=== FIRST TRANSACTION ===") 
        if transactions_data: 
            print(transactions_data[0])
        
        # Step 5: Save transactions
        new_transactions = []
        for tx_data in transactions_data:
            # Apply category rules
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
                raw_text=tx_data.get("description") # Storing desc as raw text for now
            )
            db.add(new_tx)
            new_transactions.append(new_tx)
            
        db.commit() # Commit to get IDs if needed, though we act on list
        
        # Step 6: Detect recurring (using ALL transactions to check history)
        # We need to fetch all transactions to detect patterns properly
        all_transactions = db.query(Transaction).all()
        
        # This function updates the objects in memory/session
        detect_recurring(all_transactions)
        
        # Commit the is_recurring updates
        db.commit()
        
        # Step 7: Update document completion status
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
        
        # Fail safe update
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.status = "failed"
                db.commit()
        except:
            pass
            
        return {"error": str(e)}
