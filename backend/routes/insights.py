from fastapi import APIRouter, Depends 
from sqlalchemy.orm import Session 
from backend.database import get_db 
from backend.models.transaction import Insight 
from backend.services.analyzer import InsightAnalyzer 
from datetime import datetime, timedelta

router = APIRouter() 

@router.get("") 
def get_insights(db: Session = Depends(get_db)): 
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    cached = db.query(Insight).filter(
        Insight.generated_at > one_hour_ago
    ).order_by(Insight.generated_at.desc()).all()

    if cached:
        return {
            "insights": [
                {
                    "id": i.id,
                    "insight_type": i.insight_type,
                    "headline": i.headline,
                    "body_text": i.body_text,
                    "action_text": i.action_text,
                    "generated_at": str(i.generated_at),
                    "period": i.period
                } for i in cached
            ],
            "cached": True,
            "count": len(cached)
        }

    insights = db.query(Insight).order_by( 
        Insight.generated_at.desc() 
    ).all() 

    return {
        "insights": [
            {
                "id": i.id,
                "insight_type": i.insight_type,
                "headline": i.headline,
                "body_text": i.body_text,
                "action_text": i.action_text,
                "generated_at": str(i.generated_at),
                "period": i.period
            } for i in insights
        ],
        "cached": False,
        "count": len(insights)
    } 

@router.post("/generate") 
def generate_insights(db: Session = Depends(get_db)): 
    analyzer = InsightAnalyzer() 
    results = analyzer.generate(db) 

    return { 
        "insights": results, 
        "count": len(results) 
    }
