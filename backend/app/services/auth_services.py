from sqlalchemy.orm import Session
from app.models.user import User
from app.cors.security import hash_password, verify_password
from app.crud.user_crud import get_user_by_email, create_user
from app.cors.jwt_handler import create_access_token 

def signup_service(db: Session, name: str, email: str, password: str):
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise ValueError("User with this email already exists.")

    hashed_pw = hash_password(password)

    new_user = User(
        name=name,
        email=email,
        hashed_password=hashed_pw   
    )
    return create_user(db, new_user)

def login_services(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    
    if not user:
        raise ValueError("User not registered.")   

    if not verify_password(password, user.hashed_password):
        raise ValueError("Invalid password.")      

    # JWT token generate karo
    token = create_access_token({"sub": user.email, "user_id": user.id })

    # Frontend ko user details + token return karo
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "access_token": token,
        "token_type": "bearer"
    }

