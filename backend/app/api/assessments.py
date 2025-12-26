from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.assessment import Assessment, AssessmentStatus
from app.models.user import User
from app.models.evaluation import Evaluation
from app.api.deps import get_current_admin_user
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])


# Schemas
class AssessmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    title: str
    teacher_name: Optional[str]
    subject: Optional[str]
    class_room: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    evaluation_count: int

    class Config:
        from_attributes = True


class AssessmentListResponse(BaseModel):
    assessments: List[AssessmentResponse]
    total: int
    page: int
    page_size: int


class AssessmentDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    title: str
    teacher_name: Optional[str]
    subject: Optional[str]
    class_room: Optional[str]
    paper_images: Optional[dict]
    questions: Optional[dict]
    status: str
    created_at: datetime
    updated_at: datetime
    evaluations: List[dict]

    class Config:
        from_attributes = True


class UpdateStatusRequest(BaseModel):
    status: AssessmentStatus


class AssessmentStatsResponse(BaseModel):
    total: int
    active: int
    draft: int
    archived: int
    by_subject: dict
    recent_count: int


@router.get("", response_model=AssessmentListResponse)
def list_assessments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[AssessmentStatus] = None,
    user_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all assessments with filters (admin only)
    """
    query = db.query(Assessment, User).join(User, Assessment.user_id == User.id)

    # Apply filters
    if search:
        query = query.filter(
            (Assessment.title.ilike(f"%{search}%")) |
            (Assessment.subject.ilike(f"%{search}%")) |
            (Assessment.teacher_name.ilike(f"%{search}%"))
        )
    
    if status:
        query = query.filter(Assessment.status == status)
    
    if user_id:
        query = query.filter(Assessment.user_id == user_id)

    # Get total count
    total = query.count()

    # Apply pagination
    assessments_data = query.order_by(desc(Assessment.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    # Build response
    assessments = []
    for assessment, user in assessments_data:
        # Get evaluation count for this assessment
        eval_count = db.query(Evaluation).filter(Evaluation.assessment_id == assessment.id).count()
        
        assessments.append(AssessmentResponse(
            id=assessment.id,
            user_id=assessment.user_id,
            user_name=user.name,
            user_email=user.email,
            title=assessment.title,
            teacher_name=assessment.teacher_name,
            subject=assessment.subject,
            class_room=assessment.class_room,
            status=assessment.status.value,
            created_at=assessment.created_at,
            updated_at=assessment.updated_at,
            evaluation_count=eval_count
        ))

    return AssessmentListResponse(
        assessments=assessments,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/stats", response_model=AssessmentStatsResponse)
def get_assessment_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get assessment statistics (admin only)
    """
    total = db.query(Assessment).count()
    active = db.query(Assessment).filter(Assessment.status == AssessmentStatus.ACTIVE).count()
    draft = db.query(Assessment).filter(Assessment.status == AssessmentStatus.DRAFT).count()
    archived = db.query(Assessment).filter(Assessment.status == AssessmentStatus.ARCHIVED).count()

    # Get count by subject
    subject_counts = db.query(
        Assessment.subject,
        func.count(Assessment.id)
    ).filter(
        Assessment.subject.isnot(None)
    ).group_by(Assessment.subject).all()

    by_subject = {subject: count for subject, count in subject_counts}

    # Get recent count (last 7 days)
    from datetime import timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_count = db.query(Assessment).filter(Assessment.created_at >= seven_days_ago).count()

    return AssessmentStatsResponse(
        total=total,
        active=active,
        draft=draft,
        archived=archived,
        by_subject=by_subject,
        recent_count=recent_count
    )


@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
def get_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get assessment details (admin only)
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    user = db.query(User).filter(User.id == assessment.user_id).first()

    # Get evaluations for this assessment
    evaluations = db.query(Evaluation).filter(Evaluation.assessment_id == assessment_id).all()
    evaluations_data = [
        {
            "id": str(eval.id),
            "student_name": eval.student_name,
            "total_marks": eval.total_marks,
            "obtained_marks": eval.obtained_marks,
            "created_at": eval.created_at.isoformat()
        }
        for eval in evaluations
    ]

    return AssessmentDetailResponse(
        id=assessment.id,
        user_id=assessment.user_id,
        user_name=user.name if user else "Unknown",
        user_email=user.email if user else "Unknown",
        title=assessment.title,
        teacher_name=assessment.teacher_name,
        subject=assessment.subject,
        class_room=assessment.class_room,
        paper_images=assessment.paper_images,
        questions=assessment.questions,
        status=assessment.status.value,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
        evaluations=evaluations_data
    )


@router.put("/{assessment_id}/status")
def update_assessment_status(
    assessment_id: UUID,
    request: UpdateStatusRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update assessment status (admin only)
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment.status = request.status
    assessment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(assessment)

    return {"message": f"Assessment status updated to {request.status.value}", "assessment_id": str(assessment.id)}


@router.delete("/{assessment_id}")
def delete_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete assessment and all related evaluations (admin only)
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Delete all related evaluations first
    db.query(Evaluation).filter(Evaluation.assessment_id == assessment_id).delete()
    
    # Delete the assessment
    db.delete(assessment)
    db.commit()

    return {"message": "Assessment and related evaluations deleted successfully", "assessment_id": str(assessment_id)}
