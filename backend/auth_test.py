import os
import sys
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from pymongo import MongoClient
from app.auth.handler import get_password_hash
from app.models.user import build_user_document

client = TestClient(app)

mongo = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
db = mongo[settings.DATABASE_NAME]
user = db['users'].find_one({'email': '24ad035@kpriet.ac.in'})
if not user:
    user_doc = build_user_document('Test User', '24ad035@kpriet.ac.in', get_password_hash('password123'), 'Security Administrator')
    res = db['users'].insert_one(user_doc)
    user = db['users'].find_one({'_id': res.inserted_id})
    print('created user', user['_id'])

login = client.post('/api/v1/auth/login', json={'email': '24ad035@kpriet.ac.in', 'password': 'password123'})
print('login', login.status_code, login.text)
if login.status_code != 200:
    sys.exit(1)
token = login.json()['access_token']
print('token len', len(token))
paths = ['/api/v1/network/traffic', '/api/v1/network/analytics', '/api/v1/network/statistics', '/api/v1/admin/users', '/api/v1/admin/reports']
for path in paths:
    r = client.get(path, headers={'Authorization': f'Bearer {token}'})
    print(path, r.status_code, r.text[:200])
