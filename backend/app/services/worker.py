from datetime import datetime

from sqlalchemy.orm import Session

from app.models.monitor import Monitor
from app.models.monitor_run import MonitorRun


def run_monitor_checks(db: Session) -> int:
    """
    Runs a lightweight 'check' for active monitors.
    For now: just create a MonitorRun row per monitor.
    Returns number of monitors processed.
    """
    monitors = db.query(Monitor).filter(Monitor.active == True).all()  # noqa: E712

    for m in monitors:
        db.add(
            MonitorRun(
                monitor_id=m.id,
                checked_at=datetime.utcnow(),
                status="ok",
                message="scheduled check (no scraping yet)",
            )
        )

    db.commit()
    return len(monitors)
