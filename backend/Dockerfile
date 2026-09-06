# NetShield AI — Backend Dockerfile (FastAPI + Uvicorn)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for libpq, scapy packet capture, and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpcap-dev \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose FastAPI REST Port
EXPOSE 5000

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV APP_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start FastAPI API via Uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
