import os
import json
import re
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.transaction import Transaction, Insight
from dotenv import load_dotenv
from google import genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class InsightAnalyzer:
    def build_insight_prompt(self, stats):
        return f"""You are a personal finance advisor 
for Indian users. 

Based on this spending data, generate 
exactly 6 behavioral insights as JSON array. 

Each insight object must have: 
- insight_type: one of OVERSPENDING, 
  HIDDEN_COST, PATTERN, OPPORTUNITY, 
  RISK, POSITIVE 
- headline: max 8 words, punchy title 
- body: 2-3 sentences with specific 
  numbers from the data 
- action: one line tip starting with 
  rupee saving amount 

Return ONLY valid JSON array. 
No markdown. No explanation. 

Financial data: 
{json.dumps(stats, indent=2)}"""

    def get_transaction_stats(self, db: Session):

        total_spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == 'debit'
        ).scalar() or 0
        
        total_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == 'credit'
        ).scalar() or 0
        
        savings_rate = 0
        if total_income > 0:
            savings_rate = ((total_income - total_spent) / total_income) * 100
            
        categories = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.transaction_type == 'debit'
        ).group_by(
            Transaction.category
        ).all()
        
        category_breakdown = {cat: float(amt) for cat, amt in categories}
        
        top_merchant_res = db.query(
            Transaction.merchant,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.transaction_type == 'debit'
        ).group_by(
            Transaction.merchant
        ).order_by(
            func.sum(Transaction.amount).desc()
        ).first()
        
        top_merchant = top_merchant_res[0] if top_merchant_res else "None"
        
        transaction_count = db.query(Transaction).count()
        
        recurring_total = db.query(func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == 'debit',
            Transaction.is_recurring == True
        ).scalar() or 0
        
        return {
            "total_spent": float(total_spent),
            "total_income": float(total_income),
            "savings_rate": round(savings_rate, 2),
            "category_breakdown": category_breakdown,
            "top_merchant": top_merchant,
            "transaction_count": transaction_count,
            "recurring_total": float(recurring_total),
            "month": datetime.now().strftime("%B %Y")
        }

    def generate(self, db: Session):
        try:
            stats = self.get_transaction_stats(db)
            
            if stats["transaction_count"] == 0:
                return []
            
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = self.build_insight_prompt(stats)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            result_text = response.text.strip()
            result_text = result_text.replace("```json", "").replace("```", "").strip()
            
            insights_data = json.loads(result_text)
            
            generated_insights = []
            current_period = datetime.now().strftime("%b %Y")
            
            for item in insights_data:
                insight = Insight(
                    insight_type=item.get("insight_type"),
                    headline=item.get("headline"),
                    body_text=item.get("body"),
                    action_text=item.get("action"),
                    period=current_period
                )
                db.add(insight)

                generated_insights.append({
                    "insight_type": insight.insight_type,
                    "headline": insight.headline,
                    "body": insight.body_text,
                    "action": insight.action_text
                })
                
            db.commit()
            return generated_insights
            
        except Exception as e:
            print(f"Error generating insights: {e}")
            import traceback
            traceback.print_exc()
            return []
            
