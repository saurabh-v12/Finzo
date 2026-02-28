from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.database import get_db
from backend.models.transaction import Transaction, Document
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):

    total_spent = db.query(func.sum(Transaction.amount)).filter(Transaction.transaction_type == "debit").scalar() or 0
    total_income = db.query(func.sum(Transaction.amount)).filter(Transaction.transaction_type == "credit").scalar() or 0
    
    transaction_count = db.query(Transaction).count()
    document_count = db.query(Document).count()
    
    savings_rate = 0
    if total_income > 0:
        savings_rate = ((total_income - total_spent) / total_income) * 100
        
    top_category_result = db.query(
        Transaction.category, 
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.transaction_type == "debit"
    ).group_by(
        Transaction.category
    ).order_by(desc('total')).first()
    
    top_category = top_category_result[0] if top_category_result else "None"
    
    return {
        "total_spent": total_spent,
        "total_income": total_income,
        "savings_rate": round(savings_rate, 1),
        "transaction_count": transaction_count,
        "document_count": document_count,
        "top_category": top_category
    }

@router.get("/categories")
def get_category_breakdown(db: Session = Depends(get_db)):

    total_spent = db.query(func.sum(Transaction.amount)).filter(Transaction.transaction_type == "debit").scalar() or 1
    
    categories = db.query(
        Transaction.category, 
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.transaction_type == "debit"
    ).group_by(
        Transaction.category
    ).order_by(desc('total')).all()
    
    result = []
    for cat, amount in categories:
        percentage = (amount / total_spent) * 100
        result.append({
            "category": cat,
            "total_amount": amount,
            "percentage": round(percentage, 1)
        })
        
    return result

@router.get("/monthly-trend")
def get_monthly_trend(db: Session = Depends(get_db)):

    return [
        {"month": "Feb", "year": "2026", "total_amount": 42850},
        {"month": "Jan", "year": "2026", "total_amount": 38200},
        {"month": "Dec", "year": "2025", "total_amount": 45100},
        {"month": "Nov", "year": "2025", "total_amount": 32400},
        {"month": "Oct", "year": "2025", "total_amount": 29800},
        {"month": "Sep", "year": "2025", "total_amount": 35600}
    ]
