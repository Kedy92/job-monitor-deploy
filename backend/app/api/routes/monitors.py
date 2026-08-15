from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.monitor import Monitor
from app.models.monitor_run import MonitorRun
from app.notifications.service import NotificationService
from app.schemas.monitor import (
    MonitorCreate,
    MonitorRead,
    MonitorRunRead,
    MonitorUpdate,
    TestNotificationRead,
)
from app.schemas.user import UserRead
from app.services.monitors import (
    create_monitor,
    delete_monitor,
    list_monitors,
    update_monitor,
)
from app.services.worker import run_single_monitor_check

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
        keywords=payload.keywords,
        match_threshold=payload.match_threshold,
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


@router.get("/{monitor_id}/runs", response_model=list[MonitorRunRead])
def get_monitor_runs(
    monitor_id: int,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    # Verify ownership
    monitor = db.query(Monitor).filter(
        Monitor.id == monitor_id, Monitor.user_id == current_user.id
    ).first()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    runs = (
        db.query(MonitorRun)
        .filter(MonitorRun.monitor_id == monitor_id)
        .order_by(MonitorRun.checked_at.desc())
        .limit(10)
        .all()
    )
    return runs


@router.post("/{monitor_id}/run", response_model=MonitorRunRead)
def run_monitor_now(
    monitor_id: int,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    monitor = db.query(Monitor).filter(
        Monitor.id == monitor_id, Monitor.user_id == current_user.id
    ).first()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    last_run = (
        db.query(MonitorRun)
        .filter(MonitorRun.monitor_id == monitor_id)
        .order_by(MonitorRun.checked_at.desc())
        .first()
    )
    run = run_single_monitor_check(db, monitor, last_run=last_run)
    db.commit()
    db.refresh(run)
    return run


@router.post("/{monitor_id}/send-test-notification", response_model=TestNotificationRead)
def send_test_notification(
    monitor_id: int,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    monitor = db.query(Monitor).filter(
        Monitor.id == monitor_id, Monitor.user_id == current_user.id
    ).first()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    keywords = [k.strip() for k in (monitor.keywords or "").split(",") if k.strip()]
    summary = (
        "Demo notification | "
        f"Score: {max(monitor.match_threshold, 80)}% | "
        f"Matched: {', '.join(keywords[:6]) or 'demo keyword'} | "
        "Triggered manually for presentation"
    )

    try:
        result = NotificationService().send_match_email_direct(
            to_email=current_user.email,
            monitor_name=f"{monitor.name} (test)",
            target_url=monitor.target_url,
            match_summary=summary,
        )
    except RuntimeError as exc:
        return TestNotificationRead(
            ok=False,
            message=f"Email provider is not configured: {exc}",
        )
    except Exception as exc:
        return TestNotificationRead(
            ok=False,
            message=f"Failed to send test email: {exc}",
        )

    if result and result.ok:
        return TestNotificationRead(
            ok=True,
            message=f"Test email sent to {current_user.email}",
            provider_message_id=result.provider_message_id,
        )

    return TestNotificationRead(
        ok=False,
        message=f"Email provider returned an error: {result.error if result else 'unknown error'}",
        provider_message_id=result.provider_message_id if result else None,
    )


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
