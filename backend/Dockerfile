# ─────────────────────────────────────────────
#  NetShield Backend — FastAPI Dockerfile
# ─────────────────────────────────────────────

# Stage 1: Base image
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    tshark \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /netshield

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Application
FROM base AS app

WORKDIR /netshield

# Copy application code
COPY app/ ./app/

# Copy trained ML models (relative paths — no more hardcoded Windows paths)
COPY app/models/ ./app/models/

# Copy report files
COPY reports/ ./reports/

# Copy scripts
COPY scripts/ ./scripts/

# Set Python path
ENV PYTHONPATH=/netshield

# Expose FastAPI port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
