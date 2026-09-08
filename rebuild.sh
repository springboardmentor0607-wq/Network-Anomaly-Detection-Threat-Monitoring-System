#!/bin/bash

echo "====================================================="
echo "   NetShield AWS Rebuild Script"
echo "====================================================="
echo ""
echo "[1] Cleaning up old Docker cache and unused images..."
sudo docker system prune -f

echo ""
echo "[2] Rebuilding and starting Docker containers..."
sudo docker-compose up --build -d

echo ""
echo "====================================================="
echo "   Rebuild Complete!"
echo "====================================================="
