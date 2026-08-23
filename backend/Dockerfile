# Backend Dockerfile with Node.js and Python for Preprocessing Pipeline
FROM node:20-slim

# Install Python & build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install npm dependencies
COPY package*.json ./
RUN npm install --only=production

# Install Python requirements for dataset preprocessing
# RUN pip3 install --no-cache-dir pandas numpy scikit-learn joblib python-dotenv --break-system-packages

# Copy source code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
