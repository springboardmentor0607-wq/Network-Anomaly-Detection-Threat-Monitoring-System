import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml.train_model import train_network_anomaly_model

if __name__ == '__main__':
    train_network_anomaly_model()
