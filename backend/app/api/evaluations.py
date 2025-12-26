from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.evaluation import Evaluation
from app.models.assessment import Assessment
from app.models.user import User
from app.api.deps import get_current_admin_user
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(prefix="/api/evaluations", tags=["Evaluations"])


# Schemas
class EvaluationResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    assessment_id: UUID
    assessment_title: str
    student_name: Optional[str]
    total_marks: int
    obtained_marks: int
    percentage: float
    ai_model: Optional[str]
    processing_time: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationListResponse(BaseModel):
    evaluations: List[EvaluationResponse]
    total: int
    page: int
    page_size: int


class EvaluationDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    assessment_id: UUID
    assessment_title: str
    student_name: Optional[str]
    student_image: Optional[str]
    total_marks: int
    obtained_marks: int
    percentage: float
    results: Optional[dict]
    overall_feedback: Optional[str]
    ai_model: Optional[str]
    processing_time: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationStatsResponse(BaseModel):
    total: int
    total_today: int
    average_marks: float
    average_percentage: float
    by_assessment: dict
    recent_count: int


@router.get("", response_model=EvaluationListResponse)
def list_evaluations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    assessment_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all evaluations with filters (admin only)
    """
    query = db.query(Evaluation, User, Assessment).join(
        User, Evaluation.user_id == User.id
    ).join(
        Assessment, Evaluation.assessment_id == Assessment.id
    )

    # Apply filters
    if search:
        query = query.filter(
            (Evaluation.student_name.ilike(f"%{search}%")) |
            (Assessment.title.ilike(f"%{search}%")) |
            (User.name.ilike(f"%{search}%"))
        )
    
    if assessment_id:
        query = query.filter(Evaluation.assessment_id == assessment_id)
    
    if user_id:
        query = query.filter(Evaluation.user_id == user_id)

    # Get total count
    total = query.count()

    # Apply pagination
    evaluations_data = query.order_by(desc(Evaluation.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    # Build response
    evaluations = []
    for evaluation, user, assessment in evaluations_data:
        percentage = (evaluation.obtained_marks / evaluation.total_marks * 100) if evaluation.total_marks > 0 else 0
        
        evaluations.append(EvaluationResponse(
            id=evaluation.id,
            user_id=evaluation.user_id,
            user_name=user.name,
            user_email=user.email,
            assessment_id=evaluation.assessment_id,
            assessment_title=assessment.title,
            student_name=evaluation.student_name,
            total_marks=evaluation.total_marks,
            obtained_marks=evaluation.obtained_marks,
            percentage=round(percentage, 2),
            ai_model=evaluation.ai_model,
            processing_time=evaluation.processing_time,
            created_at=evaluation.created_at
        ))

    return EvaluationListResponse(
        evaluations=evaluations,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/stats", response_model=EvaluationStatsResponse)
def get_evaluation_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get evaluation statistics (admin only)
    """
    total = db.query(Evaluation).count()
    
    # Get today's count
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_today = db.query(Evaluation).filter(Evaluation.created_at >= today_start).count()

    # Calculate average marks and percentage
    avg_data = db.query(
        func.avg(Evaluation.obtained_marks).label('avg_marks'),
        func.avg(Evaluation.total_marks).label('avg_total')
    ).first()

    average_marks = float(avg_data.avg_marks) if avg_data.avg_marks else 0
    average_total = float(avg_data.avg_total) if avg_data.avg_total else 0
    average_percentage = (average_marks / average_total * 100) if average_total > 0 else 0

    # Get count by assessment
    assessment_counts = db.query(
        Assessment.title,
        func.count(Evaluation.id)
    ).join(
        Evaluation, Assessment.id == Evaluation.assessment_id
    ).group_by(Assessment.title).all()

    by_assessment = {title: count for title, count in assessment_counts}

    # Get recent count (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_count = db.query(Evaluation).filter(Evaluation.created_at >= seven_days_ago).count()

    return EvaluationStatsResponse(
        total=total,
        total_today=total_today,
        average_marks=round(average_marks, 2),
        average_percentage=round(average_percentage, 2),
        by_assessment=by_assessment,
        recent_count=recent_count
    )


@router.get("/{evaluation_id}", response_model=EvaluationDetailResponse)
def get_evaluation(
    evaluation_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get evaluation details (admin only)
    """
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    user = db.query(User).filter(User.id == evaluation.user_id).first()
    assessment = db.query(Assessment).filter(Assessment.id == evaluation.assessment_id).first()

    percentage = (evaluation.obtained_marks / evaluation.total_marks * 100) if evaluation.total_marks > 0 else 0

    return EvaluationDetailResponse(
        id=evaluation.id,
        user_id=evaluation.user_id,
        user_name=user.name if user else "Unknown",
        user_email=user.email if user else "Unknown",
        assessment_id=evaluation.assessment_id,
        assessment_title=assessment.title if assessment else "Unknown",
        student_name=evaluation.student_name,
        student_image=evaluation.student_image,
        total_marks=evaluation.total_marks,
        obtained_marks=evaluation.obtained_marks,
        percentage=round(percentage, 2),
        results=evaluation.results,
        overall_feedback=evaluation.overall_feedback,
        ai_model=evaluation.ai_model,
        processing_time=evaluation.processing_time,
        created_at=evaluation.created_at
    )


@router.delete("/{evaluation_id}")
def delete_evaluation(
    evaluation_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete evaluation (admin only)
    """
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    db.delete(evaluation)
    db.commit()

    return {"message": "Evaluation deleted successfully", "evaluation_id": str(evaluation_id)}
