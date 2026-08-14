import hashlib
from datetime import datetime, timedelta, timezone

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.ai.keyword_matcher import calculate_match
from app.models.monitor import Monitor
from app.models.monitor_run import MonitorRun
from app.models.user import User
from app.notifications.service import NotificationService

SCRAPE_TIMEOUT = 10  # seconds


def _fetch_page_text(url: str) -> str:
    """Fetch a URL and return visible text content."""
    resp = requests.get(url, timeout=SCRAPE_TIMEOUT, headers={"User-Agent": "JobMonitorBot/1.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # Remove script/style tags before extracting text
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def _get_last_run(db: Session, monitor_id: int) -> MonitorRun | None:
    return (
        db.query(MonitorRun)
        .filter(MonitorRun.monitor_id == monitor_id)
        .order_by(MonitorRun.checked_at.desc())
        .first()
    )


def _is_due(last_run: MonitorRun | None, interval_minutes: int, now: datetime) -> bool:
    if last_run is None:
        return True

    checked_at = last_run.checked_at
    if checked_at.tzinfo is None:
        checked_at = checked_at.replace(tzinfo=timezone.utc)

    return now >= checked_at + timedelta(minutes=interval_minutes)


def run_monitor_checks(db: Session) -> int:
    """
    For each due active monitor:
      1. Fetch the target URL
      2. Extract text
      3. Run keyword match
      4. If score >= threshold AND content changed → send email
      5. Log a MonitorRun row
    Returns number of monitors processed in this scheduler pass.
    """
    monitors = db.query(Monitor).filter(Monitor.active == True).all()  # noqa: E712
    now = datetime.now(timezone.utc)

    processed_count = 0

    for m in monitors:
        last_run = _get_last_run(db, m.id)
        if not _is_due(last_run, m.interval_minutes, now):
            continue

        processed_count += 1
        run_single_monitor_check(db, m, last_run=last_run)

    db.commit()
    return processed_count


def run_single_monitor_check(
    db: Session,
    monitor: Monitor,
    *,
    last_run: MonitorRun | None = None,
) -> MonitorRun:
    status = "ok"
    message = "checked"
    result_hash = None

    try:
        raw_keywords = monitor.keywords or ""
        keywords = [k.strip() for k in raw_keywords.split(",") if k.strip()]

        if not keywords:
            return _log_run(db, monitor.id, status, "no keywords configured", result_hash)

        page_text = _fetch_page_text(monitor.target_url)
        result_hash = _content_hash(page_text)

        match = calculate_match(page_text, keywords)
        score = match["score"]
        matched = match["matched_keywords"]
        missing = match["missing_keywords"]

        message = (
            f"score={score}% "
            f"matched={', '.join(matched) or 'none'} "
            f"missing={', '.join(missing) or 'none'}"
        )

        already_notified = last_run and last_run.result_hash == result_hash

        if score >= monitor.match_threshold and not already_notified:
            status = "match"
            user = db.query(User).filter(User.id == monitor.user_id).first()
            if user:
                _send_match_notification(user, monitor, score, matched, missing)
        elif score >= monitor.match_threshold and already_notified:
            status = "match"
            message += " (already notified, no new email)"
        else:
            status = "no_match"

    except requests.exceptions.RequestException as e:
        status = "error"
        message = f"fetch error: {e}"
        print(f"[worker] Fetch error for monitor {monitor.id} ({monitor.target_url}): {e}")
    except Exception as e:
        status = "error"
        message = f"error: {e}"
        print(f"[worker] Error for monitor {monitor.id}: {e}")

    return _log_run(db, monitor.id, status, message[:255], result_hash)


def _send_match_notification(
    user: User,
    monitor: Monitor,
    score: int,
    matched: list[str],
    missing: list[str],
) -> None:
    try:
        summary = (
            f"Score: {score}% | "
            f"Matched: {', '.join(matched) or 'none'} | "
            f"Missing: {', '.join(missing) or 'none'}"
        )
        result = NotificationService().send_match_email_direct(
            to_email=user.email,
            monitor_name=monitor.name,
            target_url=monitor.target_url,
            match_summary=summary,
        )
        if result and result.ok:
            print(f"[worker] Email sent to {user.email} for monitor '{monitor.name}'")
        else:
            print(f"[worker] Email failed for monitor '{monitor.name}': {result}")
    except Exception as e:
        print(f"[worker] Notification error for monitor {monitor.id}: {e}")


def _log_run(
    db: Session,
    monitor_id: int,
    status: str,
    message: str,
    result_hash: str | None,
) -> MonitorRun:
    run = MonitorRun(
        monitor_id=monitor_id,
        checked_at=datetime.now(timezone.utc),
        status=status,
        message=message,
        result_hash=result_hash,
    )
    db.add(run)
    db.flush()
    db.refresh(run)
    return run
