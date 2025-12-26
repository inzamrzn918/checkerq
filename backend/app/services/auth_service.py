from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User, UserStatus
from app.schemas.auth import Token
import uuid


class AuthService:
    @staticmethod
    async def verify_google_token(token: str) -> Optional[dict]:
        """Verify Google ID token and return user info"""
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return None
            
            return {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'photo_url': idinfo.get('picture', '')
            }
        except ValueError:
            return None
    
    @staticmethod
    def get_or_create_user(db: Session, google_info: dict, device_info: dict = None) -> User:
        """Get existing user or create new one from Google info"""
        user = db.query(User).filter(User.google_id == google_info['google_id']).first()
        
        if not user:
            user = db.query(User).filter(User.email == google_info['email']).first()
        
        if not user:
            user = User(
                id=uuid.uuid4(),
                google_id=google_info['google_id'],
                email=google_info['email'],
                name=google_info['name'],
                photo_url=google_info.get('photo_url'),
                device_info=device_info
            )
            db.add(user)
        else:
            # Update user info
            user.google_id = google_info['google_id']
            user.name = google_info['name']
            user.photo_url = google_info.get('photo_url')
            if device_info:
                user.device_info = device_info
        
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def create_tokens(user: User) -> Token:
        """Create access and refresh tokens for user"""
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    @staticmethod
    def refresh_access_token(refresh_token: str, db: Session) -> Optional[Token]:
        """Create new access token from refresh token"""
        payload = decode_token(refresh_token)
        
        if not payload or payload.get('type') != 'refresh':
            return None
        
        user_id = payload.get('sub')
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or user.status != UserStatus.ACTIVE:
            return None
        
        return AuthService.create_tokens(user)


auth_service = AuthService()
