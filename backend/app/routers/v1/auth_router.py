from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.schemas.user_schemas import UserLogin, UserSignup, UserResponse
from app.services.auth_services import signup_service, login_services
from app.config.database import get_db
from app.schemas.user_schemas import TokenResponse 
from fastapi.security import OAuth2PasswordRequestForm

auth_router = APIRouter(prefix="/auth", tags=["Authentications"])

@auth_router.post("/signup", response_model=UserResponse)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    try:
        return signup_service(db, data.name, data.email, data.password)
    except ValueError as e:
        # Agar user already registered hai
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@auth_router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint using JSON body.
    Expected JSON:
    {
        "email": "admin@example.com",
        "password": "123456"
    }
    """
    email = data.email
    password = data.password
    try:
        return login_services(db, email, password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )