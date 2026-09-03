# NetShield — Deployment Guide

> **Step-by-Step Deployment Instructions**  
> Covers: Local Development · Docker Compose · AWS / Azure

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.11+ | `python --version` |
| Node.js | 20+ | `node --version` |
| MongoDB | 7.0+ | `mongod --version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |

---

## Option 1: Local Development

### Step 1 — Clone & Configure
```bash
git clone https://github.com/your-username/NetShield.git
cd NetShield
cp .env.example .env
# Edit .env and set your SECRET_KEY
```

### Step 2 — Start MongoDB
```bash
# If MongoDB is installed locally:
mongod --dbpath /data/db

# Or use Docker just for MongoDB:
docker run -d -p 27017:27017 --name mongo mongo:7.0
```

### Step 3 — Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn app.main:app --reload --port 8000
```

**Verify backend:** Open `http://localhost:8000/docs`

### Step 4 — Load Training Data into MongoDB (first time only)
```bash
# From backend/ directory (venv active)
python scripts/load_all_datasets.py

# Score data with ML models
python scripts/score_database.py
python scripts/score_database_unsw.py
```

> ⚠️ This may take 15–30 minutes depending on your hardware.

### Step 5 — Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**Access the dashboard:** `http://localhost:3001`

---

## Option 2: Docker Compose (Recommended for Submission/Demo)

This is the fastest way to run the full platform.

### Step 1 — Ensure Docker is Running
```bash
docker --version
docker compose version
```

### Step 2 — Configure Environment
```bash
cd NetShield
cp .env.example .env
# Edit SECRET_KEY in .env
```

### Step 3 — Build and Launch
```bash
# From the project root (where docker-compose.yml is)
docker compose up --build
```

This will:
1. Build the FastAPI backend image
2. Build the Next.js frontend image
3. Pull the MongoDB 7.0 image
4. Start all 3 services with health checks

**First build time:** ~3–5 minutes

### Step 4 — Verify Services
```bash
# Check all containers are running
docker compose ps

# View logs
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3001 |
| API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| MongoDB | mongodb://localhost:27017 |

### Step 5 — Load Data (first time)
```bash
# Enter the backend container
docker compose exec backend python scripts/load_all_datasets.py

# Score the data
docker compose exec backend python scripts/score_database.py
```

### Useful Docker Commands
```bash
# Stop all services
docker compose down

# Stop and remove volumes (resets database)
docker compose down -v

# Rebuild a single service
docker compose up --build backend

# Run tests inside container
docker compose exec backend python -m pytest tests/ -v
```

---

## Option 3: Cloud Deployment (AWS / Azure)

### AWS EC2 Deployment

**Step 1 — Launch EC2 Instance**
- Instance type: `t3.large` (recommended) or `t3.medium`
- AMI: Ubuntu 22.04 LTS
- Security group: Open ports 22 (SSH), 3001 (Frontend), 8000 (Backend)

**Step 2 — Install Docker**
```bash
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
sudo usermod -aG docker $USER
newgrp docker
```

**Step 3 — Transfer Project Files**
```bash
# From your local machine
scp -r NetShield/ ubuntu@<EC2_PUBLIC_IP>:~/
```

**Step 4 — Deploy**
```bash
ssh ubuntu@<EC2_PUBLIC_IP>
cd ~/NetShield
cp .env.example .env
# Edit .env
docker compose up -d --build
```

**Step 5 — Access**
- Dashboard: `http://<EC2_PUBLIC_IP>:3001`
- API: `http://<EC2_PUBLIC_IP>:8000/docs`

---

### Azure Container Instances

```bash
# Login to Azure
az login

# Create resource group
az group create --name netshield-rg --location eastus

# Deploy with Docker Compose
az container create \
  --resource-group netshield-rg \
  --name netshield \
  --image your-registry/netshield-backend:latest \
  --ports 8000 \
  --environment-variables MONGODB_URL=<your_atlas_url>
```

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing secret | `changeme` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB` | MongoDB database name | `netshield_logs` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `60` |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | `http://localhost:8000` |

---

## Health Check Endpoints

```bash
# Backend health
curl http://localhost:8000/
# Expected: {"message": "Welcome to NetShield API"}

# ML model status
curl http://localhost:8000/api/ml/reports/metrics?dataset=CICIDS2017
# Expected: {...accuracy, precision, recall...}

# Database connectivity
curl http://localhost:8000/api/network/summary
# Expected: {"total_packets": N, "total_alerts": N, "status": "Active"}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend can't connect to MongoDB | Check `MONGODB_URL` in `.env` |
| ML models not loading | Verify `backend/app/models/cicids/` exists |
| Frontend shows blank page | Run `npm run build` inside frontend/ |
| Docker build fails (memory) | Increase Docker memory to 4GB+ |
| Port already in use | `netstat -ano \| findstr :8000` then kill the process |
| `ModuleNotFoundError` | Activate venv: `venv\Scripts\activate` |
