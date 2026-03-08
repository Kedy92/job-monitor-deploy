from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel
from pydantic.config import ConfigDict


class ApplicationCreate(BaseModel):
    job_title: str
    company: str
    job_url: Optional[str] = None
    match_score: Optional[int] = None
    notes: Optional[str] = None
    applied_at: Optional[date] = None


class ApplicationUpdate(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_url: Optional[str] = None
    match_score: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    applied_at: Optional[date] = None


class ApplicationRead(BaseModel):
    id: int
    job_title: str
    company: str
    job_url: Optional[str] = None
    match_score: Optional[int] = None
    status: str
    notes: Optional[str] = None
    applied_at: Optional[date] = None
    status_changed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationStats(BaseModel):
    total: int
    APPLIED: int
    INTERVIEW: int
    OFFER: int
    REJECTED: int
