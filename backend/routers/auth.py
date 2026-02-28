from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.user import GoogleAuthRequest 
from utils.oauth import verify_google_token
from utils.security import create_access_token
from database import get_db
from crud import user as crud_user 

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login/google")
async def google_login(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    
    google_data = verify_google_token(request.credential)
    
    if not google_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google inválido o expirado"
        )
    
    email = google_data.get("email")
    
    user = crud_user.get_user_by_email(db, email=email)
    
    if not user:
        user = crud_user.create_user(db, email=email) 
        
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "email": user.email
    }