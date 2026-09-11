from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.alerts import router as alerts_router
from app.routers.upload import router as upload_router
from app.routers.auth import router as auth_router
from app.routers.prediction import router as prediction_router
from app.routers.prediction_history import router as history_router
from app.routers.dashboard import router as dashboard_router
from app.routers import pcap
from app.routers import reports
from app.routers import report_export


app = FastAPI(
    title="NetShield AI",
    version="1.0.0"
)


# Allowed frontend origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://netshield-ai-frontend-fpbu.onrender.com",
]


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API routers
app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(upload_router)
app.include_router(history_router)
app.include_router(dashboard_router)
app.include_router(alerts_router)

app.include_router(pcap.router)
app.include_router(reports.router)
app.include_router(report_export.router)


@app.get("/")
def root():
    return {
        "message": "NetShield AI API is running",
        "status": "online"
    }