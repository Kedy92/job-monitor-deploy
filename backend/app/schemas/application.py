from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from pydantic.config import ConfigDict


class ApplicationCreate(BaseModel):
    job_title: str
    company: str
    job_url: Optional[str] = None
    match_score: Optional[int] = None
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_url: Optional[str] = None
    match_score: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ApplicationRead(BaseModel):
    id: int
    job_title: str
    company: str
    job_url: Optional[str] = None
    match_score: Optional[int] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
