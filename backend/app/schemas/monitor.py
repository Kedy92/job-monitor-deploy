from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class MonitorCreate(BaseModel):
    name: str
    target_url: HttpUrl
    monitor_type: str
    interval_minutes: int = Field(default=10, ge=1)
    active: bool = True
    keywords: Optional[str] = ""
    match_threshold: int = Field(default=60, ge=1, le=100)


class MonitorUpdate(BaseModel):
    name: Optional[str] = None
    target_url: Optional[HttpUrl] = None
    monitor_type: Optional[str] = None
    interval_minutes: Optional[int] = Field(default=None, ge=1)
    active: Optional[bool] = None
    keywords: Optional[str] = None
    match_threshold: Optional[int] = Field(default=None, ge=1, le=100)


class MonitorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    target_url: str
    monitor_type: str
    interval_minutes: int
    active: bool
    created_at: datetime
    keywords: Optional[str] = ""
    match_threshold: int = 60
