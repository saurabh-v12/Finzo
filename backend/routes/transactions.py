from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models.transaction import Transaction
from typing import Optional

router = APIRouter()

@router.get("/transactions")
def get_transactions(
    category: Optional[str] = None,
    type: Optional[str] = None,
    document_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    
    if category and category != "All":
        query = query.filter(Transaction.category == category)
    
    if type and type != "All":
        query = query.filter(Transaction.transaction_type == type.lower())
        
    if document_id:
        query = query.filter(Transaction.document_id == document_id)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Transaction.merchant.ilike(search_term)) | 
            (Transaction.description.ilike(search_term))
        )
        
    transactions = query.limit(limit).offset(offset).all()
    return transactions

@router.get("/transactions/summary")
def get_transactions_summary(db: Session = Depends(get_db)):
    total_debit = db.query(func.sum(Transaction.amount)).filter(Transaction.transaction_type == "debit").scalar() or 0
    total_credit = db.query(func.sum(Transaction.amount)).filter(Transaction.transaction_type == "credit").scalar() or 0
    transaction_count = db.query(Transaction).count()
    
    net_balance = total_credit - total_debit
    
    return {
        "total_debit": total_debit,
        "total_credit": total_credit,
        "net_balance": net_balance,
        "transaction_count": transaction_count
    }
