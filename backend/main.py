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
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include Routers
app.include_router(upload.router, prefix="/api/upload")
app.include_router(transactions.router, prefix="/api")
app.include_router(insights.router, prefix="/api/insights")
app.include_router(dashboard.router, prefix="/api/dashboard")

@app.get("/api/health")
def read_root():
    return {"message": "Finzo API running", "version": "1.0"}


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")


# Additional frontend mount for explicit /app path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

frontend_path = os.path.join(
    os.path.dirname(__file__), '..', 'frontend'
)

if os.path.exists(frontend_path):
    app.mount(
        "/app",
        StaticFiles(directory=frontend_path, html=True),
        name="frontend_app"
    )
