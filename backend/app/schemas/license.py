from pydantic import BaseModel, UUID4
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.license import LicenseType, LicenseStatus


class LicenseBase(BaseModel):
    type: LicenseType
    max_assessments: Optional[int] = None
    max_evaluations_per_month: Optional[int] = None
    features: Optional[Dict[str, Any]] = None


class LicenseCreate(LicenseBase):
    expires_at: Optional[datetime] = None


class LicenseActivate(BaseModel):
    license_key: str


class LicenseResponse(LicenseBase):
    id: UUID4
    license_key: str
    user_id: Optional[UUID4]
    status: LicenseStatus
    activated_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class LicenseValidationResponse(BaseModel):
    valid: bool
    license: Optional[LicenseResponse] = None
    message: str
