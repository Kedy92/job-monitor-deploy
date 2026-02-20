from datetime import datetime
from pydantic import BaseModel, ConfigDict, HttpUrl


class MonitorCreate(BaseModel):
    name: str
    target_url: HttpUrl
    monitor_type: str
    interval_minutes: int = 10
    active: bool = True


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
