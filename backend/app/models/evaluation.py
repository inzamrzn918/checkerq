from sqlalchemy import Column, String, DateTime, JSON, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    student_name = Column(String, nullable=True)
    student_image = Column(String, nullable=True)
    total_marks = Column(Integer, nullable=False)
    obtained_marks = Column(Integer, nullable=False)
    results = Column(JSON, nullable=True)
    overall_feedback = Column(String, nullable=True)
    ai_model = Column(String, nullable=True)
    processing_time = Column(Integer, nullable=True)  # in milliseconds
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
