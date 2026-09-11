from flask import Flask
from flask_cors import CORS
from routes.predict import predict_bp
from routes.register import register_bp
from routes.login import login_bp
from routes.upload import upload_bp
from routes.analyze import analyze_bp
from routes.reports import reports_bp
from routes.model_info import model_info_bp
from routes.test_samples import test_samples_bp
from routes.incidents import incidents_bp
from routes.notifications import notifications_bp
from db import init_db_tables

app = Flask(__name__)
CORS(app)

# Initialize database tables
try:
    init_db_tables()
except Exception as e:
    print("DB init error on startup:", e)

app.register_blueprint(register_bp)
app.register_blueprint(login_bp)
app.register_blueprint(predict_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(analyze_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(model_info_bp)
app.register_blueprint(test_samples_bp)
app.register_blueprint(incidents_bp)
app.register_blueprint(notifications_bp)

@app.route("/")
def home():
    return {
        "message": "Welcome to NetShield AI Backend",
        "status": "Running Successfully",
        "model": "Random Forest Classifier",
        "dataset": "UNSW-NB15 & CICIDS2017"
    }

if __name__ == "__main__":
    import os
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    app.run(host=host, port=port, debug=debug)