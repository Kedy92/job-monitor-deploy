from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from pydantic.config import ConfigDict


class CVVersionCreate(BaseModel):
    application_id: int
    job_ad_text: str
    template_name: str = "modern"
    candidate_profile: Optional[str] = None


class CVVersionRead(BaseModel):
    id: int
    application_id: int
    job_ad_text: str
    template_name: str
    cv_summary: Optional[str] = None
    cv_skills: Optional[str] = None
    cv_experience: Optional[str] = None
    cover_letter: Optional[str] = None
    interview_questions: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    matched_keywords: Optional[str] = None
    profile_gaps: Optional[str] = None
    honesty_warnings: Optional[str] = None
    ai_provider: Optional[str] = None
    ats_score: Optional[int] = None
    missing_keywords: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
