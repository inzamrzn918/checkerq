from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.user import User, UserStatus
from app.models.license import License, LicenseStatus, LicenseType
from app.models.assessment import Assessment
from app.models.evaluation import Evaluation
from app.models.analytics import AnalyticsEvent
from app.api.deps import get_current_admin_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db)
):
    """
    Get overall system statistics
    """
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.status == UserStatus.ACTIVE).count()
    
    # New users today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = db.query(User).filter(User.created_at >= today_start).count()
    
    # License statistics
    total_licenses = db.query(License).count()
    active_licenses = db.query(License).filter(License.status == LicenseStatus.ACTIVE).count()
    
    # Assessment statistics
    total_assessments = db.query(Assessment).count()
    
    # Evaluation statistics
    total_evaluations = db.query(Evaluation).count()
    evaluations_today = db.query(Evaluation).filter(Evaluation.created_at >= today_start).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "new_users_today": new_users_today,
        "total_licenses": total_licenses,
        "active_licenses": active_licenses,
        "total_assessments": total_assessments,
        "total_evaluations": total_evaluations,
        "evaluations_today": evaluations_today,
    }


@router.get("/user-growth")
def get_user_growth(
    months: int = 6,
    db: Session = Depends(get_db)
):
    """
    Get user growth data over the last N months
    """
    # Calculate start date
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=months * 30)
    
    # Get monthly user counts
    monthly_data = db.query(
        extract('year', User.created_at).label('year'),
        extract('month', User.created_at).label('month'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= start_date
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    # Format data
    result = []
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    # Create cumulative count
    cumulative = 0
    for year, month, count in monthly_data:
        cumulative += count
        result.append({
            "month": month_names[int(month) - 1],
            "users": cumulative
        })
    
    # If no data, return empty array
    if not result:
        # Generate last 6 months with 0 users
        for i in range(months):
            date = end_date - timedelta(days=(months - i - 1) * 30)
            result.append({
                "month": month_names[date.month - 1],
                "users": 0
            })
    
    return result


@router.get("/evaluations-trend")
def get_evaluations_trend(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get evaluation trends over the last N days
    """
    # Calculate start date
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get daily evaluation counts
    daily_data = db.query(
        func.date(Evaluation.created_at).label('date'),
        func.count(Evaluation.id).label('count')
    ).filter(
        Evaluation.created_at >= start_date
    ).group_by('date').order_by('date').all()
    
    # Create a map of dates to counts
    data_map = {str(date): count for date, count in daily_data}
    
    # Generate data for all days
    result = []
    day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_str = str(date.date())
        day_name = day_names[date.weekday()]
        
        result.append({
            "day": day_name,
            "count": data_map.get(date_str, 0)
        })
    
    return result


@router.get("/license-distribution")
def get_license_distribution(
    db: Session = Depends(get_db)
):
    """
    Get license distribution by type
    """
    # Count licenses by type
    distribution = db.query(
        License.type,
        func.count(License.id).label('count')
    ).filter(
        License.status == LicenseStatus.ACTIVE
    ).group_by(License.type).all()
    
    # Define colors for each type
    colors = {
        LicenseType.FREE: '#64748b',
        LicenseType.PRO: '#0ea5e9',
        LicenseType.ENTERPRISE: '#8b5cf6'
    }
    
    result = []
    for license_type, count in distribution:
        result.append({
            "name": license_type.value.capitalize(),
            "value": count,
            "color": colors.get(license_type, '#64748b')
        })
    
    # If no data, return default structure
    if not result:
        result = [
            {"name": "Free", "value": 0, "color": "#64748b"},
            {"name": "Pro", "value": 0, "color": "#0ea5e9"},
            {"name": "Enterprise", "value": 0, "color": "#8b5cf6"}
        ]
    
    return result


@router.get("/recent-activity")
def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recent activity across the system
    """
    activities = []
    
    # Recent user registrations
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(3).all()
    for user in recent_users:
        time_diff = datetime.utcnow() - user.created_at
        activities.append({
            "user": user.name,
            "action": "registered new account",
            "time": format_time_ago(time_diff),
            "timestamp": user.created_at
        })
    
    # Recent license activations
    recent_licenses = db.query(License, User).join(
        User, License.user_id == User.id
    ).filter(
        License.activated_at.isnot(None)
    ).order_by(License.activated_at.desc()).limit(3).all()
    
    for license, user in recent_licenses:
        time_diff = datetime.utcnow() - license.activated_at
        activities.append({
            "user": user.name,
            "action": f"activated {license.type.value.capitalize()} license",
            "time": format_time_ago(time_diff),
            "timestamp": license.activated_at
        })
    
    # Recent assessments
    recent_assessments = db.query(Assessment, User).join(
        User, Assessment.user_id == User.id
    ).order_by(Assessment.created_at.desc()).limit(2).all()
    
    for assessment, user in recent_assessments:
        time_diff = datetime.utcnow() - assessment.created_at
        activities.append({
            "user": user.name,
            "action": "created new assessment",
            "time": format_time_ago(time_diff),
            "timestamp": assessment.created_at
        })
    
    # Recent evaluations
    recent_evaluations = db.query(Evaluation, User).join(
        User, Evaluation.user_id == User.id
    ).order_by(Evaluation.created_at.desc()).limit(2).all()
    
    for evaluation, user in recent_evaluations:
        time_diff = datetime.utcnow() - evaluation.created_at
        activities.append({
            "user": user.name,
            "action": "completed evaluation",
            "time": format_time_ago(time_diff),
            "timestamp": evaluation.created_at
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    activities = activities[:limit]
    
    # Remove timestamp from response
    for activity in activities:
        del activity['timestamp']
    
    return activities


def format_time_ago(delta: timedelta) -> str:
    """Format timedelta as human-readable string"""
    seconds = int(delta.total_seconds())
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    else:
        days = seconds // 86400
        return f"{days} day{'s' if days != 1 else ''} ago"
