from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import GoogleAuthRequest, Token, RefreshTokenRequest
from app.services.auth_service import auth_service
from app.models.user import User, UserRole
import uuid

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Admin login with email and password
    """
    # Simple hardcoded admin credentials for demo
    # In production, use proper password hashing
    if form_data.username == "admin@checkerq.com" and form_data.password == "admin123":
        # Get or create admin user
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user:
            user = User(
                id=uuid.uuid4(),
                email=form_data.username,
                name="Admin User",
                role=UserRole.ADMIN
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create tokens
        tokens = auth_service.create_tokens(user)
        return tokens
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/google", response_model=Token)
async def google_login(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Google ID token
    """
    # Verify Google token
    google_info = await auth_service.verify_google_token(request.id_token)
    
    if not google_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # Get or create user
    user = auth_service.get_or_create_user(db, google_info, request.device_info)
    
    # Create tokens
    tokens = auth_service.create_tokens(user)
    
    return tokens


@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token
    """
    tokens = auth_service.refresh_access_token(request.refresh_token, db)
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    return tokens


@router.post("/logout")
def logout():
    """
    Logout user (client should delete tokens)
    """
    return {"message": "Logged out successfully"}
