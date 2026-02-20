# app/api/routes/monitors.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.schemas.monitor import MonitorCreate, MonitorRead
from app.services.monitors import create_monitor, delete_monitor, list_monitors

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post("", response_model=MonitorRead, status_code=status.HTTP_201_CREATED)
def create_monitor_endpoint(
    payload: MonitorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_monitor(
        db,
        current_user.id,
        name=payload.name,
        target_url=str(payload.target_url),
        monitor_type=payload.monitor_type,
        interval_minutes=payload.interval_minutes,
        active=payload.active,
    )


@router.get("", response_model=list[MonitorRead])
def list_monitors_endpoint(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return list_monitors(db, current_user.id)


@router.delete("/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitor_endpoint(
    monitor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ok = delete_monitor(db, current_user.id, monitor_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return None
