# NetShield AI: Deployment & Documentation Guide

This document outlines the steps to deploy the NetShield AI platform using Docker and cloud environments (such as AWS or Azure) to fulfill Milestone 4 requirements.

## 1. Prerequisites (Local Environment)
Before you can run the Docker containers locally or deploy them to the cloud, you need Docker installed on your machine.

### Installing Docker on Windows
Since Docker is not currently installed or added to the PATH in your environment, please follow these steps:
1. Download **Docker Desktop for Windows** from the official site: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Run the installer and accept the terms. Ensure WSL 2 (Windows Subsystem for Linux) backend is enabled during installation.
3. Restart your computer if prompted.
4. Open the Docker Desktop application and let the engine start.
5. Verify installation by running `docker compose version` in your terminal.

## 2. Local Production Deployment

We have configured a production-ready environment using multi-stage builds.

1. Ensure the Docker engine is running.
2. In your terminal, navigate to the `netshield-ai-updated` folder.
3. Build and run the containers using the production Docker compose file:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. Access the frontend application at `http://localhost`. The backend API will be available at `http://localhost:8000`.
5. To view logs and monitor containers, use:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

## 3. Cloud Deployment (AWS / Azure)

### Option A: AWS Elastic Container Service (ECS)
AWS ECS is a robust container orchestration service that allows you to easily run and scale containerized applications.

1. **Push Images to Amazon ECR (Elastic Container Registry):**
   - Create two repositories in ECR: `netshield-backend` and `netshield-frontend`.
   - Build your images:
     ```bash
     docker build -t netshield-backend ./backend
     docker build -t netshield-frontend -f ./frontend/Dockerfile.prod ./frontend
     ```
   - Tag and push the images to your ECR repositories.

2. **Deploy with ECS (Fargate):**
   - Create an ECS Cluster using the AWS Management Console.
   - Create a Task Definition for the Backend:
     - Use the `netshield-backend` image.
     - Add environment variables (e.g., `DATABASE_URL`, `SECRET_KEY`).
   - Create a Task Definition for the Frontend:
     - Use the `netshield-frontend` image.
     - Map port 80 to your load balancer.
   - Set up an RDS PostgreSQL instance to act as your production database.

### Option B: Azure App Service (Web App for Containers)
Azure Web App for Containers is the easiest way to deploy dockerized web applications in Azure.

1. **Push Images to Azure Container Registry (ACR):**
   - Create an ACR instance.
   - Tag and push your backend and frontend images to the registry.

2. **Deploy the Services:**
   - Create an **Azure Database for PostgreSQL** server.
   - Create a new **Web App for Containers** for the Backend and point it to your backend image in ACR. Set the required environment variables (e.g., `DATABASE_URL`) in the Application Settings.
   - Create a second **Web App for Containers** for the Frontend and point it to the frontend image in ACR. Map port 80.

## 4. Documentation

The project includes the following markdown files for documentation:
- `README_COMPLETE.md`: High-level overview of the NetShield AI project.
- `SETUP_GUIDE.md`: Local development setup instructions.
- `IMPLEMENTATION_CHECKLIST.md`: A detailed list of what has been implemented across the project.
- `DEPLOYMENT.md` (This file): Production and cloud deployment steps.

These files satisfy the documentation requirements for the final presentation.
