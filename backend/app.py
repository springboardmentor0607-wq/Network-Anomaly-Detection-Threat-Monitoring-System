import os
import logging
from contextlib import asynccontextmanager
import joblib
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from config import Config
from database import init_db_pool, close_db_pool
from mongo_db import init_mongo

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global ML Model variables
ml_model = None
label_encoder = None
model_feature_names = None
xgboost_model = None

def load_ml_model():
    global ml_model, label_encoder, model_feature_names, xgboost_model
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Check standard model paths first, then milestone2 aliases
    model_paths = [
        os.path.join(base_dir, 'models', 'network_model.pkl'),
        os.path.join(base_dir, 'models', 'network_model_milestone2.pkl')
    ]
    xgb_paths = [
        os.path.join(base_dir, 'models', 'xgboost_model.pkl')
    ]
    le_paths = [
        os.path.join(base_dir, 'models', 'label_encoder.pkl'),
        os.path.join(base_dir, 'models', 'label_encoder_milestone2.pkl')
    ]
    feat_paths = [
        os.path.join(base_dir, 'models', 'feature_names.pkl'),
        os.path.join(base_dir, 'models', 'feature_names_milestone2.pkl')
    ]
    
    model_path = next((p for p in model_paths if os.path.exists(p)), None)
    xgb_path = next((p for p in xgb_paths if os.path.exists(p)), None)
    le_path = next((p for p in le_paths if os.path.exists(p)), None)
    feat_path = next((p for p in feat_paths if os.path.exists(p)), None)
    
    if model_path and le_path and feat_path:
        try:
            ml_model = joblib.load(model_path)
            label_encoder = joblib.load(le_path)
            model_feature_names = joblib.load(feat_path)
            if xgb_path:
                try:
                    xgboost_model = joblib.load(xgb_path)
                    logger.info("Loaded XGBoost auxiliary model.")
                except Exception as ex:
                    logger.warning(f"XGBoost load note: {ex}")
            logger.info(f"MODEL ACTIVE: Successfully loaded ML model from {os.path.basename(model_path)} with {len(model_feature_names)} features.")
            return True
        except Exception as e:
            logger.error(f"MODEL OFFLINE: Error loading ML model artifacts: {str(e)}")
            ml_model, label_encoder, model_feature_names = None, None, None
            return False
    else:
        logger.warning("MODEL OFFLINE: ML Model artifacts not found in models/ directory. Run train_model.py first.")
        ml_model, label_encoder, model_feature_names = None, None, None
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing NetShield AI Backend Services...")
    init_db_pool()
    init_mongo()
    load_ml_model()
    yield
    # Shutdown
    logger.info("Shutting down NetShield AI Backend Services...")
    close_db_pool()

app = FastAPI(
    title="NetShield AI API",
    description="AI Powered Network Anomaly Detection & Threat Monitoring System (FastAPI + PostgreSQL + MongoDB + Scikit-Learn / XGBoost / TensorFlow)",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from routes.auth_routes import auth_router
from routes.dashboard_routes import dashboard_router
from routes.upload_routes import upload_router
from routes.network_routes import network_router
from routes.threat_routes import threat_router
from routes.alert_routes import alert_router
from routes.incident_routes import incident_router
from routes.notification_routes import notification_router
from routes.report_routes import report_router
from routes.analytics_routes import analytics_router
from routes.visualization_routes import visualization_router
from routes.system_routes import system_router
from routes.user_routes import user_router
from routes.audit_routes import audit_router

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(upload_router, prefix="/api", tags=["Upload & PCAP & Zeek"])
app.include_router(network_router, prefix="/api", tags=["Network"])
app.include_router(threat_router, prefix="/api", tags=["Threats"])
app.include_router(alert_router, prefix="/api", tags=["Alerts"])
app.include_router(incident_router, prefix="/api", tags=["Incidents"])
app.include_router(notification_router, prefix="/api", tags=["Notifications"])
app.include_router(report_router, prefix="/api", tags=["Reports"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
app.include_router(visualization_router, prefix="/api", tags=["Visualization"])
app.include_router(system_router, prefix="/api", tags=["System"])
app.include_router(user_router, prefix="/api", tags=["Users"])
app.include_router(audit_router, prefix="/api", tags=["Audit"])

# Also include root-level paths for backwards compatibility
app.include_router(auth_router, prefix="/auth", include_in_schema=False)
app.include_router(dashboard_router, prefix="", include_in_schema=False)
app.include_router(upload_router, prefix="", include_in_schema=False)
app.include_router(network_router, prefix="", include_in_schema=False)
app.include_router(threat_router, prefix="", include_in_schema=False)
app.include_router(alert_router, prefix="", include_in_schema=False)
app.include_router(incident_router, prefix="", include_in_schema=False)
app.include_router(notification_router, prefix="", include_in_schema=False)
app.include_router(report_router, prefix="", include_in_schema=False)
app.include_router(analytics_router, prefix="", include_in_schema=False)
app.include_router(visualization_router, prefix="", include_in_schema=False)
app.include_router(system_router, prefix="", include_in_schema=False)
app.include_router(user_router, prefix="", include_in_schema=False)
app.include_router(audit_router, prefix="", include_in_schema=False)

@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    return Response(status_code=204)

if __name__ == '__main__':
    import uvicorn
    logger.info(f"Starting NetShield AI FastAPI REST API on port {Config.PORT}...")
    uvicorn.run("app:app", host="0.0.0.0", port=Config.PORT, reload=True)
