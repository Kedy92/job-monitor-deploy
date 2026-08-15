from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class CVVersion(Base):
    __tablename__ = "cv_versions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)

    job_ad_text = Column(Text, nullable=False)
    template_name = Column(String(100), nullable=False, default="modern")

    cv_summary = Column(Text, nullable=True)
    cv_skills = Column(Text, nullable=True)
    cv_experience = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    interview_questions = Column(Text, nullable=True)
    improvement_suggestions = Column(Text, nullable=True)
    matched_keywords = Column(Text, nullable=True)
    profile_gaps = Column(Text, nullable=True)
    honesty_warnings = Column(Text, nullable=True)
    ai_provider = Column(String(50), nullable=True)

    ats_score = Column(Integer, nullable=True)
    missing_keywords = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    application = relationship("Application")
