from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

app = FastAPI(
    title="SignalSense Research API",
    description="Backend API for Lightweight and Fast Time-Series Anomaly Detection (LFTSAD) on SWAN-SF",
    version="1.0.0",
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "Welcome to SignalSense Research API",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }
