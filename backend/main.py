from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import schemas
from api.prediction import router as prediction_router
from fastapi.middleware.cors import CORSMiddleware
from api.dashboard import router as dashboard_router
from api.traffic import router as traffic_router
from api.report import router as report_router
from api.model_testing import router as model_testing_router
from api.incidents import router as incidents_router
from api.alerts import router as alerts_router
from api.security_report import router as security_report_router
from api.analytics import router as analytics_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    prediction_router
)

app.include_router(
    traffic_router
)

app.include_router(report_router)

app.include_router(
    model_testing_router
)

app.include_router(dashboard_router)

app.include_router(incidents_router)

app.include_router(alerts_router)

app.include_router(
    security_report_router
)

app.include_router(
    analytics_router
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"message": "Database Connected Successfully"}

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        password=user.password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully"
    }

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()


    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    if existing_user.password != user.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )


    return {
    "message": "Login Successful",
    "id": existing_user.id,
    "full_name": existing_user.full_name,
    "email": existing_user.email,
    "role": existing_user.role
}

@app.get("/users")
def get_users():

    db = SessionLocal()

    users = db.query(models.User).all()


    result=[]


    for user in users:

        result.append({

            "id":user.id,
            "full_name":user.full_name,
            "email":user.email,
            "role":user.role

        })


    db.close()


    return result

@app.put("/users/{user_id}/role")
def update_role(
    user_id:int,
    role:str
):

    db=SessionLocal()

    user=db.query(models.User).filter(
        models.User.id==user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    user.role=role


    db.commit()

    db.refresh(user)


    db.close()


    return {

        "message":"Role updated successfully"

    }

@app.delete("/users/{user_id}")
def delete_user(user_id:int):

    db=SessionLocal()


    user=db.query(models.User).filter(
        models.User.id==user_id
    ).first()


    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)

    db.commit()

    db.close()

    return {

        "message":"User deleted successfully"

    }