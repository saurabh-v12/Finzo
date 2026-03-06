from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import engine, Base
from backend.routes import upload, transactions, insights, dashboard
import os

# Create Database Tables
Base.metadata.create_all(bind=engine)

# Create Uploads Directory
os.makedirs("backend/uploads/statements", exist_ok=True)

app = FastAPI(title="Finzo API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(upload.router, prefix="/api/upload")
app.include_router(transactions.router, prefix="/api")
app.include_router(insights.router, prefix="/api/insights")
app.include_router(dashboard.router, prefix="/api/dashboard")

@app.get("/api/health")
def read_root():
    return {"message": "Finzo API running", "version": "1.0"}

@app.delete("/api/admin/reset-db")
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"message": "Database reset successfully"}

# Mount frontend
frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend')
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")