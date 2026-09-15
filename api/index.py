import sys
import os

# Add backend directory to Python sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

# Export ASGI handler for Vercel Serverless Functions
handler = app
