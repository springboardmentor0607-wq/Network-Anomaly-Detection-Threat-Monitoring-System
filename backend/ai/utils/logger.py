import logging
import sys
from pathlib import Path
from backend.ai.config.config import LOGS_DIR

log_file = LOGS_DIR / "ai_engine.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

def get_logger(name="NetShieldAI"):
    return logging.getLogger(name)
