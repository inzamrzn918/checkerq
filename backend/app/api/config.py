from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.config import SystemConfig
from app.models.user import User
from app.api.deps import get_current_user, get_current_admin_user

router = APIRouter(prefix="/api/config", tags=["Configuration"])


# Request/Response Models
class GoogleOAuthRequest(BaseModel):
    android_client_id: str
    web_client_id: str


class AIKeysRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    mistral_api_key: Optional[str] = None


class FeatureFlagsRequest(BaseModel):
    google_signin_enabled: bool = True
    offline_mode_enabled: bool = True
    backup_restore_enabled: bool = True
    auto_save_enabled: bool = True


class AppSettingsRequest(BaseModel):
    auto_save_interval: int = 60  # seconds
    max_assessments_per_user: int = 100
    session_timeout: int = 3600  # seconds
    default_language: str = "en"


class EvaluationSettingsRequest(BaseModel):
    default_ai_model: str = "gemini"  # gemini or mistral
    max_retry_attempts: int = 3
    evaluation_timeout: int = 300  # seconds
    confidence_threshold: float = 0.7


class UploadLimitsRequest(BaseModel):
    max_file_size: int = 10485760  # bytes (10MB)
    allowed_file_types: List[str] = ["pdf", "jpg", "jpeg", "png"]
    max_files_per_assessment: int = 10


@router.get("/app")
def get_app_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get app configuration for mobile app
    """
    config = {}
    
    # Get Google OAuth config
    google_config = db.query(SystemConfig).filter(SystemConfig.key == "google_oauth").first()
    if google_config:
        config["google_oauth"] = google_config.value
    
    # Get feature flags
    feature_flags = db.query(SystemConfig).filter(SystemConfig.key == "feature_flags").first()
    if feature_flags:
        config["feature_flags"] = feature_flags.value
    
    # Get app settings
    app_settings = db.query(SystemConfig).filter(SystemConfig.key == "app_settings").first()
    if app_settings:
        config["app_settings"] = app_settings.value
    
    # Get evaluation settings
    evaluation_settings = db.query(SystemConfig).filter(SystemConfig.key == "evaluation_settings").first()
    if evaluation_settings:
        config["evaluation_settings"] = evaluation_settings.value
    
    # Get upload limits
    upload_limits = db.query(SystemConfig).filter(SystemConfig.key == "upload_limits").first()
    if upload_limits:
        config["upload_limits"] = upload_limits.value
    
    return config


@router.get("/admin")
def get_admin_config(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all configuration (admin only)
    """
    configs = db.query(SystemConfig).all()
    return {config.key: config.value for config in configs}


@router.put("/admin/{key}")
def update_config(
    key: str,
    value: Dict[str, Any],
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update configuration (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    
    if not config:
        config = SystemConfig(key=key, value=value)
        db.add(config)
    else:
        config.value = value
    
    db.commit()
    db.refresh(config)
    
    return {"message": f"Configuration '{key}' updated successfully", "config": config.value}


@router.post("/admin/google-oauth")
def update_google_oauth(
    request: GoogleOAuthRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update Google OAuth credentials (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "google_oauth").first()
    
    oauth_config = {
        "android_client_id": request.android_client_id,
        "web_client_id": request.web_client_id,
    }
    
    if not config:
        config = SystemConfig(
            key="google_oauth",
            value=oauth_config,
            description="Google OAuth client IDs for mobile app"
        )
        db.add(config)
    else:
        config.value = oauth_config
    
    db.commit()
    db.refresh(config)
    
    return {"message": "Google OAuth credentials updated successfully"}


@router.post("/admin/ai-keys")
def update_ai_keys(
    request: AIKeysRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update AI API keys (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "ai_keys").first()
    
    # Get existing config or create new
    ai_keys = config.value if config else {}
    
    # Update only provided keys
    if request.gemini_api_key is not None:
        ai_keys["gemini_api_key"] = request.gemini_api_key
    if request.mistral_api_key is not None:
        ai_keys["mistral_api_key"] = request.mistral_api_key
    
    if not config:
        config = SystemConfig(
            key="ai_keys",
            value=ai_keys,
            description="AI service API keys"
        )
        db.add(config)
    else:
        config.value = ai_keys
    
    db.commit()
    db.refresh(config)
    
    return {"message": "AI API keys updated successfully"}


@router.get("/admin/ai-keys")
def get_ai_keys(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get AI API keys (masked, admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "ai_keys").first()
    
    if not config:
        return {
            "gemini_api_key": "",
            "mistral_api_key": ""
        }
    
    ai_keys = config.value
    
    # Mask the keys (show only first 10 and last 4 characters)
    def mask_key(key: str) -> str:
        if not key or len(key) < 14:
            return "****" if key else ""
        return f"{key[:10]}...{key[-4:]}"
    
    return {
        "gemini_api_key": mask_key(ai_keys.get("gemini_api_key", "")),
        "mistral_api_key": mask_key(ai_keys.get("mistral_api_key", ""))
    }


# Feature Flags Endpoints
@router.get("/admin/feature-flags")
def get_feature_flags(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get feature flags configuration (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "feature_flags").first()
    
    if not config:
        # Return default values
        return {
            "google_signin_enabled": True,
            "offline_mode_enabled": True,
            "backup_restore_enabled": True,
            "auto_save_enabled": True
        }
    
    return config.value


@router.post("/admin/feature-flags")
def update_feature_flags(
    request: FeatureFlagsRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update feature flags (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "feature_flags").first()
    
    flags = request.dict()
    
    if not config:
        config = SystemConfig(
            key="feature_flags",
            value=flags,
            description="Feature flags for mobile app"
        )
        db.add(config)
    else:
        config.value = flags
    
    db.commit()
    db.refresh(config)
    
    return {"message": "Feature flags updated successfully", "flags": config.value}


# App Settings Endpoints
@router.get("/admin/app-settings")
def get_app_settings(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get app behavior settings (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "app_settings").first()
    
    if not config:
        # Return default values
        return {
            "auto_save_interval": 60,
            "max_assessments_per_user": 100,
            "session_timeout": 3600,
            "default_language": "en"
        }
    
    return config.value


@router.post("/admin/app-settings")
def update_app_settings(
    request: AppSettingsRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update app behavior settings (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "app_settings").first()
    
    settings = request.dict()
    
    if not config:
        config = SystemConfig(
            key="app_settings",
            value=settings,
            description="App behavior settings"
        )
        db.add(config)
    else:
        config.value = settings
    
    db.commit()
    db.refresh(config)
    
    return {"message": "App settings updated successfully", "settings": config.value}


# Evaluation Settings Endpoints
@router.get("/admin/evaluation-settings")
def get_evaluation_settings(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get evaluation configuration (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "evaluation_settings").first()
    
    if not config:
        # Return default values
        return {
            "default_ai_model": "gemini",
            "max_retry_attempts": 3,
            "evaluation_timeout": 300,
            "confidence_threshold": 0.7
        }
    
    return config.value


@router.post("/admin/evaluation-settings")
def update_evaluation_settings(
    request: EvaluationSettingsRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update evaluation configuration (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "evaluation_settings").first()
    
    settings = request.dict()
    
    # Validate AI model
    if settings["default_ai_model"] not in ["gemini", "mistral"]:
        raise HTTPException(status_code=400, detail="Invalid AI model. Must be 'gemini' or 'mistral'")
    
    # Validate confidence threshold
    if not 0 <= settings["confidence_threshold"] <= 1:
        raise HTTPException(status_code=400, detail="Confidence threshold must be between 0 and 1")
    
    if not config:
        config = SystemConfig(
            key="evaluation_settings",
            value=settings,
            description="AI evaluation configuration"
        )
        db.add(config)
    else:
        config.value = settings
    
    db.commit()
    db.refresh(config)
    
    return {"message": "Evaluation settings updated successfully", "settings": config.value}


# Upload Limits Endpoints
@router.get("/admin/upload-limits")
def get_upload_limits(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get file upload limits (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "upload_limits").first()
    
    if not config:
        # Return default values
        return {
            "max_file_size": 10485760,
            "allowed_file_types": ["pdf", "jpg", "jpeg", "png"],
            "max_files_per_assessment": 10
        }
    
    return config.value


@router.post("/admin/upload-limits")
def update_upload_limits(
    request: UploadLimitsRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update file upload limits (admin only)
    """
    config = db.query(SystemConfig).filter(SystemConfig.key == "upload_limits").first()
    
    limits = request.dict()
    
    # Validate max file size (must be positive and reasonable)
    if limits["max_file_size"] <= 0 or limits["max_file_size"] > 104857600:  # 100MB max
        raise HTTPException(status_code=400, detail="Max file size must be between 1 byte and 100MB")
    
    if not config:
        config = SystemConfig(
            key="upload_limits",
            value=limits,
            description="File upload limits"
        )
        db.add(config)
    else:
        config.value = limits
    
    db.commit()
    db.refresh(config)
    
    return {"message": "Upload limits updated successfully", "limits": config.value}

