from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import hashlib
from app.models.license import License, LicenseType, LicenseStatus
from app.schemas.license import LicenseCreate


class LicenseService:
    @staticmethod
    def generate_license_key(license_type: LicenseType) -> str:
        """Generate a unique license key"""
        # Format: CKERQ-XXXXX-XXXXX-XXXXX-XXXXX
        prefix = "CKERQ"
        parts = []
        
        for _ in range(4):
            random_part = secrets.token_hex(3).upper()[:5]
            parts.append(random_part)
        
        return f"{prefix}-{'-'.join(parts)}"
    
    @staticmethod
    def create_license(db: Session, license_data: LicenseCreate, quantity: int = 1) -> List[License]:
        """Generate one or more licenses"""
        licenses = []
        
        # Set default limits based on license type
        limits = {
            LicenseType.FREE: {
                'max_assessments': 5,
                'max_evaluations_per_month': 50,
                'features': {'export_pdf': False, 'export_excel': False, 'analytics': False}
            },
            LicenseType.PRO: {
                'max_assessments': 100,
                'max_evaluations_per_month': 1000,
                'features': {'export_pdf': True, 'export_excel': True, 'analytics': True, 'bulk_operations': True}
            },
            LicenseType.ENTERPRISE: {
                'max_assessments': None,  # Unlimited
                'max_evaluations_per_month': None,  # Unlimited
                'features': {'export_pdf': True, 'export_excel': True, 'analytics': True, 'bulk_operations': True, 'api_access': True, 'priority_support': True}
            }
        }
        
        default_limits = limits.get(license_data.type, limits[LicenseType.FREE])
        
        for _ in range(quantity):
            license_key = LicenseService.generate_license_key(license_data.type)
            
            license = License(
                license_key=license_key,
                type=license_data.type,
                status=LicenseStatus.ACTIVE,
                max_assessments=license_data.max_assessments or default_limits['max_assessments'],
                max_evaluations_per_month=license_data.max_evaluations_per_month or default_limits['max_evaluations_per_month'],
                features=license_data.features or default_limits['features'],
                expires_at=license_data.expires_at
            )
            
            db.add(license)
            licenses.append(license)
        
        db.commit()
        return licenses
    
    @staticmethod
    def activate_license(db: Session, license_key: str, user_id: str) -> Optional[License]:
        """Activate a license for a user"""
        license = db.query(License).filter(License.license_key == license_key).first()
        
        if not license:
            return None
        
        if license.status != LicenseStatus.ACTIVE:
            return None
        
        if license.user_id and license.user_id != user_id:
            return None  # Already activated by another user
        
        license.user_id = user_id
        license.activated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(license)
        
        return license
    
    @staticmethod
    def validate_license(db: Session, user_id: str) -> Optional[License]:
        """Validate user's active license"""
        license = db.query(License).filter(
            License.user_id == user_id,
            License.status == LicenseStatus.ACTIVE
        ).first()
        
        if not license:
            return None
        
        # Check expiration
        if license.expires_at and license.expires_at < datetime.utcnow():
            license.status = LicenseStatus.EXPIRED
            db.commit()
            return None
        
        return license
    
    @staticmethod
    def revoke_license(db: Session, license_id: str) -> bool:
        """Revoke a license"""
        license = db.query(License).filter(License.id == license_id).first()
        
        if not license:
            return False
        
        license.status = LicenseStatus.REVOKED
        db.commit()
        
        return True


license_service = LicenseService()
