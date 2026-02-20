# app/services/monitors.py

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.models.monitor import Monitor


def create_monitor(db: Session, user_id: int, **data) -> Monitor:
    monitor = Monitor(user_id=user_id, **data)
    db.add(monitor)
    db.commit()
    db.refresh(monitor)
    return monitor


def list_monitors(db: Session, user_id: int) -> list[Monitor]:
    stmt = select(Monitor).where(Monitor.user_id == user_id).order_by(desc(Monitor.id))
    return list(db.scalars(stmt).all())


def get_monitor(db: Session, user_id: int, monitor_id: int) -> Monitor | None:
    stmt = select(Monitor).where(
        Monitor.user_id == user_id,
        Monitor.id == monitor_id,
    )
    return db.scalar(stmt)


def delete_monitor(db: Session, user_id: int, monitor_id: int) -> bool:
    monitor = get_monitor(db, user_id, monitor_id)
    if not monitor:
        return False
    db.delete(monitor)
    db.commit()
    return True
