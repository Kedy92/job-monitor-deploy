from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.application import Application
from app.models.cv_version import CVVersion
from app.models.monitor import Monitor
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationStats,
    ApplicationUpdate,
)

router = APIRouter(prefix="/applications", tags=["applications"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_404(db: Session, application_id: int, user_id: int) -> Application:
    row = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    return row


def _auto_match_score(db: Session, user_id: int, job_url: str) -> int | None:
    """
    Scrape job_url and calculate a match score against all keywords
    from the user's active monitors. Returns None on any error.
    """
    # Collect all keywords from user's monitors
    monitors = db.query(Monitor).filter(
        Monitor.user_id == user_id,
        Monitor.active == True,  # noqa: E712
    ).all()

    all_keywords = []
    for m in monitors:
        kws = [k.strip() for k in (m.keywords or "").split(",") if k.strip()]
        all_keywords.extend(kws)

    if not all_keywords:
        return None

    try:
        import requests
        from bs4 import BeautifulSoup
        from app.ai.keyword_matcher import calculate_match

        resp = requests.get(job_url, timeout=8, headers={"User-Agent": "JobMonitorBot/1.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        page_text = " ".join(soup.get_text(separator=" ").split())

        result = calculate_match(page_text, list(set(all_keywords)))
        return result["score"]
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=ApplicationStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return counts per status for the current user."""
    rows = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.user_id == current_user.id)
        .group_by(Application.status)
        .all()
    )

    counts = {"APPLIED": 0, "INTERVIEW": 0, "OFFER": 0, "REJECTED": 0}
    total = 0
    for status, count in rows:
        total += count
        key = str(status or "APPLIED").upper()
        if key in counts:
            counts[key] = count

    return ApplicationStats(total=total, **counts)


@router.get("/", response_model=list[ApplicationRead])
def list_applications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return _get_or_404(db, application_id, current_user.id)


@router.post("/", response_model=ApplicationRead)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    data = payload.model_dump(exclude_none=True)

    # Auto-calculate match_score from job_url if not provided
    if "match_score" not in data and data.get("job_url"):
        score = _auto_match_score(db, current_user.id, data["job_url"])
        if score is not None:
            data["match_score"] = score

    app_row = Application(**data, user_id=current_user.id)
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    return app_row


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    row = _get_or_404(db, application_id, current_user.id)

    data = payload.model_dump(exclude_unset=True, exclude_none=True)

    # Track when status changes
    if "status" in data and data["status"] != row.status:
        data["status_changed_at"] = datetime.now(timezone.utc)

    for k, v in data.items():
        setattr(row, k, v)

    db.commit()
    db.refresh(row)
    return row


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    row = _get_or_404(db, application_id, current_user.id)
    db.query(CVVersion).filter(
        CVVersion.application_id == application_id,
        CVVersion.user_id == current_user.id,
    ).delete(synchronize_session=False)
    db.delete(row)
    db.commit()
    return {"ok": True}
