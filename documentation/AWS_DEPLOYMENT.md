# AWS Cloud Deployment Guide — NetShield AI Threat Monitoring System

This document outlines the step-by-step procedure for deploying the Dockerized **NetShield AI Threat Monitoring System** to Amazon Web Services (AWS).

---

## 1. Executive Deployment Summary & Architecture

The NetShield AI architecture consists of 3 containerized services orchestrated via Docker Compose:

```
                  +-------------------------------------------------+
                  |                   AWS EC2                       |
                  |                                                 |
                  |   +-----------------------------------------+   |
                  |   |            Frontend Container           |   |
                  |   |       (React 19 + Nginx Alpine)         |   |
                  |   |              Port: 80 / 3000            |   |
                  |   +--------------------+--------------------+   |
                  |                        |                        |
                  |                        v                        |
                  |   +--------------------+--------------------+   |
                  |   |            Backend Container            |   |
                  |   |   (Flask + Random Forest ML Engine)     |   |
                  |   |               Port: 5000                |   |
                  |   +--------------------+--------------------+   |
                  |                        |                        |
                  |                        v                        |
                  |   +--------------------+--------------------+   |
                  |   |           PostgreSQL Container          |   |
                  |   |         (PostgreSQL 15 Alpine)          |   |
                  |   |               Port: 5432                |   |
                  |   +-----------------------------------------+   |
                  |                                                 |
                  +-------------------------------------------------+
```

### Recommended AWS Service: **AWS EC2 (Elastic Compute Cloud)**
- **Recommended Instance Type**: `t3.medium` (2 vCPU, 4GB RAM) or `t3.large` (2 vCPU, 8GB RAM).
- **Reasoning**: The Random Forest model (`netshield_model.pkl`) is ~683 MB on disk and consumes ~1.2 GB RAM in memory. Running Docker Compose on a single EC2 instance is the simplest, most cost-effective, and reliable deployment strategy for this multi-container application.

---

## 2. Prerequisites

1. An active AWS Account.
2. An SSH Key Pair created in AWS Console (e.g. `netshield-key.pem`).
3. Git and Docker installed on your local development machine.
4. Terminal/PowerShell access with `ssh`.

---

## 3. AWS Infrastructure Provisioning

### Step 3.1: Launch EC2 Instance
1. Log into **AWS Management Console** and navigate to **EC2 Dashboard**.
2. Click **Launch Instance**.
3. **Name**: `netshield-ai-production`
4. **AMI**: Ubuntu Server 22.04 LTS (64-bit x86).
5. **Instance Type**: `t3.medium` (or `t3.large`).
6. **Key Pair**: Select your `.pem` key pair.
7. **Network Settings (Security Group)**:
   - Create Security Group `netshield-sg` with the following inbound rules:
     | Type | Protocol | Port Range | Source | Purpose |
     | :--- | :--- | :--- | :--- | :--- |
     | SSH | TCP | 22 | My IP (or 0.0.0.0/0) | Remote Access |
     | Custom TCP | TCP | 3000 | 0.0.0.0/0 | Frontend UI |
     | HTTP | TCP | 80 | 0.0.0.0/0 | Web Access |
     | Custom TCP | TCP | 5000 | 0.0.0.0/0 | Backend Flask API |
8. **Storage**: 30 GB GP3 EBS SSD.
9. Click **Launch Instance**.

---

## 4. EC2 Server Environment Setup

Connect to your EC2 instance via SSH:

```bash
chmod 400 netshield-key.pem
ssh -i "netshield-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Execute the server initialization script to install Docker and Docker Compose:

```bash
# Update package index
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# Add Docker Official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose Plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
newgrp docker
```

Verify Docker installation:
```bash
docker --version
docker compose version
```

---

## 5. Application Code & Environment Deployment

### Step 5.1: Clone Project Repository
```bash
cd /home/ubuntu
git clone <YOUR_GIT_REPOSITORY_URL> Springboard
cd Springboard
```

### Step 5.2: Configure Environment Variables
Create the production `.env` file on the server using placeholder defaults from `.env.example`:

```bash
cp .env.example .env
nano .env
```

Set production values in `.env`:
```env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=netshield_ai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=netshield_secure_prod_pwd_2026

FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=False

VITE_API_BASE_URL=http://<YOUR_EC2_PUBLIC_IP>:5000
```

---

## 6. Build and Launch Containers

Build and run all services in detached mode:

```bash
# Build production Docker images
docker compose build

# Start production containers
docker compose up -d
```

Check container status:
```bash
docker compose ps
```

Expected output:
```
NAME                 STATUS                   PORTS
netshield-postgres   Up (healthy)             0.0.0.0:5432->5432/tcp
netshield-backend    Up                       0.0.0.0:5000->5000/tcp
netshield-frontend   Up                       0.0.0.0:3000->80/tcp
```

---

## 7. Verification & Operational Testing

1. **Frontend Access**: Open `http://<YOUR_EC2_PUBLIC_IP>:3000` in your web browser.
2. **Backend API Health**: Open `http://<YOUR_EC2_PUBLIC_IP>:5000/` (Should return `{"status": "Running Successfully"}`).
3. **Database Tables**: Verify tables in PostgreSQL container:
   ```bash
   docker exec -it netshield-postgres psql -U postgres -d netshield_ai -c "\dt"
   ```
4. **API Endpoint Test**:
   ```bash
   curl -X GET http://<YOUR_EC2_PUBLIC_IP>:5000/model-info
   ```

---

## 8. Maintenance & Operational Commands

### View Container Logs
```bash
# View all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View postgres logs only
docker compose logs -f postgres
```

### Stop Application
```bash
docker compose stop
```

### Restart Application
```bash
docker compose restart
```

### Complete Shutdown (Preserving Data Volume)
```bash
docker compose down
```

### Rebuild After Code Update
```bash
git pull
docker compose build --no-cache
docker compose up -d
```

---

## 9. Troubleshooting Guide

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Backend crash on startup** | Insufficient RAM for 683MB Random Forest model | Upgrade EC2 instance from `t3.micro` to `t3.medium` or `t3.large`. |
| **Backend DB connection error** | PostgreSQL container still initializing | Backend `db.py` contains 5-retries logic; ensure `postgres` container is healthy (`docker compose ps`). |
| **Frontend cannot connect to backend** | Port 5000 blocked by Security Group | Add Inbound Rule in AWS EC2 Security Group for Port `5000` from `0.0.0.0/0`. |
| **Database lost after restart** | Missing volume mapping | Ensure `postgres_data` volume is declared in `docker-compose.yml`. |
