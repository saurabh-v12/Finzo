from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_filename = Column(String)
    file_path = Column(String)
    document_type = Column(String)
    upload_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="uploaded")
    transaction_count = Column(Integer, default=0)

    transactions = relationship("Transaction", back_populates="document")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    date = Column(String)
    description = Column(String)
    merchant = Column(String)
    amount = Column(Float)
    transaction_type = Column(String)
    category = Column(String)
    is_recurring = Column(Boolean, default=False)
    raw_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="transactions")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    insight_type = Column(String)
    headline = Column(String)
    body_text = Column(String)
    action_text = Column(String)
    generated_at = Column(DateTime, default=datetime.utcnow)
    period = Column(String)
