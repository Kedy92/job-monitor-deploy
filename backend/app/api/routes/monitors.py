from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.monitor import MonitorCreate, MonitorRead, MonitorUpdate
from app.schemas.user import UserRead
from app.services.monitors import (
    create_monitor,
    delete_monitor,
    list_monitors,
    update_monitor,
)

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post("", response_model=MonitorRead, status_code=status.HTTP_201_CREATED)
def create_monitor_endpoint(
    payload: MonitorCreate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    return create_monitor(
        db,
        current_user.id,
        name=payload.name,
        target_url=str(payload.target_url),  # boundary conversion
        monitor_type=payload.monitor_type,
        interval_minutes=payload.interval_minutes,
        active=payload.active,
    )


@router.get("", response_model=list[MonitorRead])
def list_monitors_endpoint(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    return list_monitors(db, current_user.id)


@router.put("/{monitor_id}", response_model=MonitorRead)
def update_monitor_endpoint(
    monitor_id: int,
    payload: MonitorUpdate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    updated = update_monitor(
        db,
        monitor_id=monitor_id,
        user_id=current_user.id,
        payload=payload,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return updated


@router.delete("/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitor_endpoint(
    monitor_id: int,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    ok = delete_monitor(db, current_user.id, monitor_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return None
