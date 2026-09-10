# NetShield AI - Setup & Deployment Guide

## Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose installed
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+ (or use Docker)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
cd netshield-ai-main

# Build and start all services
docker-compose up --build

# Services available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start backend server
python -m app.main
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend available at: http://localhost:5173
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│          (React.js/Next.js Frontend)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                  HTTP/WebSocket
                       │
┌──────────────────────┴──────────────────────────────────┐
│                 API Gateway Layer                        │
│           (FastAPI v1 - Port 8000)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Authentication │ RBAC │ Rate Limiting │ Logging │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │ Traffic │   │ Detection│   │ Alert   │
   │ Service │   │ Service  │   │ Service │
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
   ┌────▼──────────────┴──────────────▼────┐
   │    ML/Detection & Inference Engine     │
   │  ┌──────────────────────────────────┐ │
   │  │ Anomaly Detector   │ Classifier │ │
   │  │ Risk Scorer        │ Predictor  │ │
   │  └──────────────────────────────────┘ │
   └────┬──────────────────────────────────┘
        │
   ┌────▼──────────────────────────────────┐
   │     Database & Data Storage Layer      │
   │  ┌──────────────────────────────────┐ │
   │  │ PostgreSQL/MongoDB (Primary)     │ │
   │  │ ML Artifacts Storage (joblib)    │ │
   │  │ Dataset Cache                    │ │
   │  └──────────────────────────────────┘ │
   └────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables (.env)

```bash
# Backend
APP_NAME=NetShield AI
APP_ENV=production
APP_VERSION=1.0.0
DEBUG=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/netshield_db
MONGODB_URL=mongodb://localhost:27017/netshield

# JWT & Security
JWT_SECRET_KEY=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# API
API_V1_STR=/api/v1
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
VITE_API_BASE_URL=http://localhost:8000
VITE_API_V1_STR=/api/v1
```

### Docker Compose Services

```yaml
services:
  backend:      # FastAPI server
  frontend:     # React frontend
  postgres:     # Primary database
  mongodb:      # Document database (optional)
```

---

## Default Credentials

### Initial Admin User
```
Email: admin@netshield.ai
Password: AdminPassword123!
Role: ADMIN
```

### Test Users
```
Email: manager@netshield.ai
Password: ManagerPassword123!
Role: SOC_MANAGER

Email: analyst@netshield.ai
Password: AnalystPassword123!
Role: SECURITY_ANALYST

Email: viewer@netshield.ai
Password: ViewerPassword123!
Role: VIEWER
```

---

## Database Setup

### Create Database
```bash
# PostgreSQL
createdb netshield_db
psql netshield_db < schema.sql

# Run migrations
alembic upgrade head
```

### Load Sample Data
```bash
python scripts/load_sample_data.py
python scripts/train_models.py
```

### Dataset Preparation
```bash
# Extract and prepare datasets
python scripts/extract_datasets.py
python scripts/inspect_datasets.py
```

---

## ML Model Training

### Train Anomaly Detection Model
```python
from app.ml.training.anomaly_training import train_anomaly_detector

detector = train_anomaly_detector(dataset_name="cicids2017")
print(f"Model accuracy: {detector.evaluate()}")
```

### Train Attack Classifier
```python
from app.ml.training.classifier_training import train_attack_classifier

classifier = train_attack_classifier(dataset_name="cicids2017")
print(f"Classification accuracy: {classifier.evaluate()}")
```

### Model Artifacts
- Location: `ml_artifacts/{dataset_name}/`
- Files:
  - `isolation_forest.joblib` - Anomaly detector
  - `attack_classifier.joblib` - Attack classifier
  - `preprocessor_pipeline.joblib` - Feature preprocessor
  - `label_encoder.joblib` - Label encoding
  - `metadata.json` - Model metadata

---

## API Testing

### Using Swagger UI
1. Navigate to `http://localhost:8000/docs`
2. Click "Authorize" and login with test credentials
3. Test endpoints interactively

### Using cURL
```bash
# Login and get token
TOKEN=$(curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@netshield.ai","password":"AdminPassword123!"}' \
  | jq -r '.access_token')

# Get alerts
curl -X GET "http://localhost:8000/api/v1/alerts" \
  -H "Authorization: Bearer $TOKEN"

# Get anomalies
curl -X GET "http://localhost:8000/api/v1/anomalies" \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman
1. Import API collection from `/docs/postman_collection.json`
2. Set environment variables
3. Run requests with authentication

---

## Monitoring & Logs

### Backend Logs
```bash
# Docker
docker logs -f netshield-ai-backend

# Local
tail -f logs/app.log
```

### Frontend Logs
```bash
# Browser console (F12)
# Check Network tab for API requests
```

### Database Queries
```bash
# Enable query logging in PostgreSQL
psql netshield_db
ALTER DATABASE netshield_db SET log_statement = 'all';
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# API v1 health
curl http://localhost:8000/api/v1/health
```

---

## Troubleshooting

### Issue: Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# Verify database URL
echo $DATABASE_URL

# Recreate database
docker-compose down -v
docker-compose up postgres
```

### Issue: Port Already in Use
```bash
# Change port in docker-compose.yml or use:
docker-compose up -p 8001:8000 backend
```

### Issue: API Endpoints Return 401/403
```bash
# Check token expiration
# Ensure user has correct role for endpoint
# Verify CORS configuration
```

### Issue: ML Models Not Loading
```bash
# Check model files exist
ls -la ml_artifacts/cicids2017/

# Rebuild from Docker to reset
docker-compose build --no-cache backend
```

---

## Performance Tuning

### Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_traffic_timestamp ON traffic(timestamp DESC);
CREATE INDEX idx_predictions_confidence ON predictions(confidence DESC);

-- Analyze table statistics
ANALYZE;
```

### API Optimization
```python
# Enable caching
from fastapi_cache2 import FastAPICache2

@app.get("/api/v1/analytics/dashboard")
@cached(namespace="dashboard", expire=300)  # 5 minute cache
def get_dashboard():
    pass
```

### Frontend Optimization
```bash
# Build production bundle
npm run build

# Test production build
npm run preview
```

---

## Deployment

### AWS Deployment
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin {account-id}.dkr.ecr.us-east-1.amazonaws.com

docker tag netshield-backend:latest {account-id}.dkr.ecr.us-east-1.amazonaws.com/netshield-backend:latest

docker push {account-id}.dkr.ecr.us-east-1.amazonaws.com/netshield-backend:latest

# Deploy to ECS/Fargate or EC2
```

### Azure Deployment
```bash
# Push to ACR
az acr login --name netshieldacr

docker tag netshield-backend:latest netshieldacr.azurecr.io/netshield-backend:latest

docker push netshieldacr.azurecr.io/netshield-backend:latest

# Deploy to App Service or Container Instances
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Update JWT_SECRET_KEY in production
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS origins for production URLs only
- [ ] Set DEBUG=false in production
- [ ] Enable database encryption
- [ ] Set up log aggregation
- [ ] Configure backup schedule
- [ ] Enable firewall rules
- [ ] Set up SSL certificates
- [ ] Enable rate limiting
- [ ] Configure WAF rules
- [ ] Enable MFA for admin accounts

---

## Maintenance

### Regular Tasks
- Monitor system logs daily
- Review alert trends weekly
- Update ML models monthly
- Backup database daily
- Rotate access keys quarterly
- Security patches as released

### Cleanup
```bash
# Remove old logs
find logs/ -mtime +30 -delete

# Clear cache
redis-cli FLUSHALL

# Database maintenance
VACUUM ANALYZE;
```

---

## Support & Documentation

- API Docs: http://localhost:8000/docs
- Architecture: `/docs/architecture.md`
- Database Schema: `/docs/database.md`
- PRD: `/docs/prd.md`
- SRS: `/docs/srs.md`

---

## Version Information

- **Project Version**: 1.0.0
- **FastAPI**: 0.109.0+
- **React**: 18.2.0+
- **Python**: 3.8+
- **Node.js**: 16+
- **PostgreSQL**: 12+

---

For more help, check the documentation or contact the development team.
