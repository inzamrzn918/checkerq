from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    id_token: str
    device_info: Optional[dict] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
