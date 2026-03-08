import hashlib
from datetime import datetime

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


def run_monitor_checks(db: Session) -> int:
    """
    For each active monitor:
      1. Fetch the target URL
      2. Extract text
      3. Run keyword match
      4. If score >= threshold AND content changed → send email
      5. Log a MonitorRun row
    Returns number of monitors processed.
    """
    monitors = db.query(Monitor).filter(Monitor.active == True).all()  # noqa: E712

    notification_service = None  # lazy-init so missing SendGrid key doesn't crash on startup

    for m in monitors:
        status = "ok"
        message = "checked"
        result_hash = None

        try:
            # 1. Parse keywords from the monitor
            raw_keywords = m.keywords or ""
            keywords = [k.strip() for k in raw_keywords.split(",") if k.strip()]

            if not keywords:
                # No keywords configured — just mark as checked
                message = "no keywords configured"
                _log_run(db, m.id, status, message, result_hash)
                continue

            # 2. Scrape the page
            page_text = _fetch_page_text(m.target_url)
            result_hash = _content_hash(page_text)

            # 3. Run keyword match
            match = calculate_match(page_text, keywords)
            score = match["score"]
            matched = match["matched_keywords"]
            missing = match["missing_keywords"]

            message = f"score={score}% matched={matched} missing={missing}"

            # 4. Check if this is a new match worth notifying about
            last_run = (
                db.query(MonitorRun)
                .filter(MonitorRun.monitor_id == m.id)
                .order_by(MonitorRun.checked_at.desc())
                .first()
            )
            already_notified = last_run and last_run.result_hash == result_hash

            if score >= m.match_threshold and not already_notified:
                status = "match"
                # 5. Send email — look up user email
                user = db.query(User).filter(User.id == m.user_id).first()
                if user:
                    try:
                        if notification_service is None:
                            notification_service = NotificationService()

                        summary = (
                            f"Score: {score}% | "
                            f"Matched: {', '.join(matched) or 'none'} | "
                            f"Missing: {', '.join(missing) or 'none'}"
                        )
                        result = notification_service.send_match_email_direct(
                            to_email=user.email,
                            monitor_name=m.name,
                            target_url=m.target_url,
                            match_summary=summary,
                        )
                        if result and result.ok:
                            print(f"[worker] Email sent to {user.email} for monitor '{m.name}'")
                        else:
                            print(f"[worker] Email failed for monitor '{m.name}': {result}")
                    except Exception as e:
                        print(f"[worker] Notification error for monitor {m.id}: {e}")
            elif score >= m.match_threshold and already_notified:
                status = "match"
                message += " (already notified, no new email)"
            else:
                status = "no_match"

        except requests.exceptions.RequestException as e:
            status = "error"
            message = f"fetch error: {e}"
            print(f"[worker] Fetch error for monitor {m.id} ({m.target_url}): {e}")
        except Exception as e:
            status = "error"
            message = f"error: {e}"
            print(f"[worker] Error for monitor {m.id}: {e}")

        _log_run(db, m.id, status, message[:255], result_hash)

    db.commit()
    return len(monitors)


def _log_run(db: Session, monitor_id: int, status: str, message: str, result_hash: str | None):
    db.add(MonitorRun(
        monitor_id=monitor_id,
        checked_at=datetime.now(),
        status=status,
        message=message,
        result_hash=result_hash,
    ))
