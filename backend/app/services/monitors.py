from typing import Optional

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.monitor import Monitor
from app.schemas.monitor import MonitorUpdate


def create_monitor(db: Session, user_id: int, **data) -> Monitor:
    # Safety: make sure target_url is always a plain string for DB
    if "target_url" in data and data["target_url"] is not None:
        data["target_url"] = str(data["target_url"])

    monitor = Monitor(user_id=user_id, **data)
    db.add(monitor)
    db.commit()
    db.refresh(monitor)
    return monitor


def list_monitors(db: Session, user_id: int) -> list[Monitor]:
    stmt = select(Monitor).where(Monitor.user_id == user_id).order_by(desc(Monitor.id))
    return list(db.scalars(stmt).all())


def get_monitor(db: Session, user_id: int, monitor_id: int) -> Optional[Monitor]:
    stmt = select(Monitor).where(
        Monitor.user_id == user_id,
        Monitor.id == monitor_id,
    )
    return db.scalar(stmt)


def update_monitor(
    db: Session,
    *,
    monitor_id: int,
    user_id: int,
    payload: MonitorUpdate,
) -> Optional[Monitor]:
    monitor = get_monitor(db, user_id, monitor_id)
    if not monitor:
        return None

    # CRITICAL FIX:
    # mode="json" converts HttpUrl -> str (and other non-primitive types)
    data = payload.model_dump(exclude_unset=True, mode="json")

    for key, value in data.items():
        setattr(monitor, key, value)

    db.commit()
    db.refresh(monitor)
    return monitor


def delete_monitor(db: Session, user_id: int, monitor_id: int) -> bool:
    monitor = get_monitor(db, user_id, monitor_id)
    if not monitor:
        return False

    db.delete(monitor)
    db.commit()
    return True
