from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.license import LicenseCreate, LicenseActivate, LicenseResponse, LicenseValidationResponse
from app.services.license_service import license_service
from app.models.user import User
from app.models.license import License, LicenseStatus
from app.api.deps import get_current_user, get_current_admin_user

router = APIRouter(prefix="/api/licenses", tags=["Licenses"])


@router.post("/generate", response_model=List[LicenseResponse])
def generate_licenses(
    license_data: LicenseCreate,
    quantity: int = Query(1, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Generate license keys
    """
    licenses = license_service.create_license(db, license_data, quantity)
    return licenses


@router.post("/activate", response_model=LicenseResponse)
def activate_license(
    request: LicenseActivate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activate a license for current user
    """
    license = license_service.activate_license(db, request.license_key, str(current_user.id))
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already activated license key"
        )
    
    return license


@router.get("/validate", response_model=LicenseValidationResponse)
def validate_license(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate current user's license
    """
    license = license_service.validate_license(db, str(current_user.id))
    
    if not license:
        return LicenseValidationResponse(
            valid=False,
            message="No active license found"
        )
    
    return LicenseValidationResponse(
        valid=True,
        license=license,
        message="License is valid"
    )


@router.get("", response_model=List[LicenseResponse])
def list_licenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[LicenseStatus] = None,
    db: Session = Depends(get_db)
):
    """
    List all licenses
    """
    query = db.query(License)
    
    if status:
        query = query.filter(License.status == status)
    
    licenses = query.offset((page - 1) * page_size).limit(page_size).all()
    return licenses


@router.put("/{license_id}/revoke")
def revoke_license(
    license_id: str,
    db: Session = Depends(get_db)
):
    """
    Revoke a license
    """
    success = license_service.revoke_license(db, license_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="License not found")
    
    return {"message": "License revoked successfully"}
