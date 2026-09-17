import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.market import router as market_router
from routers.yield_router import router as yield_router
from routers.climate import router as climate_router
from routers.insight import router as insight_router
from routers.chat import router as chat_router
from routers.subsidies import router as subsidies_router
from routers.insurance import router as insurance_router
from routers.farmer import router as farmer_router
from routers.mandi import router as mandi_router
from routers.crop_doctor import router as crop_doctor_router
from database import init_db

# ------------------------------------------------------------------
# ------------------------------------------------------------------
load_dotenv()

# ==================================================================
# AGRISENSE API - FASTAPI ENTRY POINT
# ==================================================================

app = FastAPI(
    title="AgriSense API",
    description="The unified backend driving the AgriSense Agricultural Machine Learning Platform.",
    version="1.0.0"
)

# ------------------------------------------------------------------
# 1. CORS Middleware (Cross-Origin Resource Sharing)
# ------------------------------------------------------------------
# Why CORS?
# Browsers enforce a security policy called Same-Origin Policy.
# If our React frontend runs on 'http://localhost:3000' and tries 
# to call our backend on 'http://localhost:8000', the browser will 
# block it unless the backend explicitly allows that origin!

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://agrisensehub.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # Allowed Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],     # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],     # Allows all headers (Authorization, Content-Type, etc.)
)

# ------------------------------------------------------------------
# 2. Startup Events
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    """
    Runs before the server starts receiving requests.
    We can use this to preload ML models into memory 
    so the very first API request doesn't experience a lag spike.
    """
    init_db()
    print("===============================================")
    print("🌾 AgriSense Backend started successfully!")
    print("🚀 Models are loaded and ready for inference.")
    print("🗄️ Relational Database initialized & verified.")
    print("===============================================")

# ------------------------------------------------------------------
# 3. Register Routers
# ------------------------------------------------------------------
app.include_router(market_router)
app.include_router(yield_router)
app.include_router(climate_router)
app.include_router(insight_router)
app.include_router(chat_router)
app.include_router(subsidies_router)
app.include_router(insurance_router)
app.include_router(farmer_router)
app.include_router(mandi_router)
app.include_router(crop_doctor_router)

# ------------------------------------------------------------------
# 4. System Endpoints
# ------------------------------------------------------------------
@app.get("/", tags=["System"])
def root():
    """Simple root endpoint returning a welcome message."""
    return {
        "message": "Welcome to the AgriSense API. Navigate to /docs for the interactive API documentation."
    }

@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to ping for container orchestration or downtime monitoring."""
    return {
        "status": "online",
        "service": "AgriSense Backend API"
    }
