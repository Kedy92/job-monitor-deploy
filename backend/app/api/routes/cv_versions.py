import json
import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.cv_version import CVVersion
from app.models.application import Application
from app.schemas.cv_version import CVVersionCreate, CVVersionRead
from app.services.pdf_generator import generate_cv_pdf

router = APIRouter(prefix="/cv-versions", tags=["cv-versions"])


def _call_claude(job_ad_text: str, job_title: str, company: str, template_name: str) -> dict:
    """
    Call Claude API to generate tailored CV content and ATS analysis.
    Returns a dict with: summary, skills, experience, ats_score, missing_keywords.
    Falls back to simple heuristics if the API key is not configured.
    """
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "your_anthropic_api_key_here":
        return _fallback_generate(job_ad_text, job_title, company)

    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""You are an expert CV writer and ATS (Applicant Tracking System) specialist.

A candidate is applying for: **{job_title}** at **{company}**.
CV template style requested: **{template_name}**

Here is the full job advertisement:
---
{job_ad_text}
---

Your task is to generate tailored CV content for this specific job. The candidate has a background in Python/FastAPI backend development, React frontend, SQL databases, Docker, and REST APIs.

Respond ONLY with a valid JSON object (no markdown, no extra text) with exactly these keys:

{{
  "summary": "<2-3 sentence professional summary tailored to this role and company. Mention the role and company by name. Highlight the most relevant skills from the job ad.>",
  "skills": "<comma-separated list of 8-12 technical skills most relevant to this job ad, ordered by relevance>",
  "experience": "<2-3 sentences describing experience highlights most relevant to this job ad. Focus on what the employer is looking for.>",
  "ats_score": <integer 0-100 representing how well the candidate profile matches the job ad keywords>,
  "missing_keywords": "<comma-separated list of up to 10 important keywords/skills from the job ad that the candidate should address or learn>"
}}

Be specific, professional, and tailor every word to the actual job advertisement content. Do not use generic filler text."""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract text from response
    text = ""
    for block in response.content:
        if block.type == "text":
            text = block.text
            break

    # Parse JSON from the response
    # Strip any accidental markdown code fences
    text = re.sub(r"```(?:json)?", "", text).strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON object from the text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            return _fallback_generate(job_ad_text, job_title, company)

    return {
        "summary": str(data.get("summary", "")),
        "skills": str(data.get("skills", "")),
        "experience": str(data.get("experience", "")),
        "ats_score": int(data.get("ats_score", 50)),
        "missing_keywords": str(data.get("missing_keywords", "")),
    }


def _fallback_generate(job_ad_text: str, job_title: str, company: str) -> dict:
    """Simple keyword-based fallback when Claude API is not configured."""
    keyword_pool = [
        "python", "fastapi", "django", "flask", "react", "javascript",
        "typescript", "sql", "postgresql", "mysql", "docker", "aws",
        "api", "rest", "jwt", "tailwind", "git", "html", "css",
        "pandas", "numpy", "machine learning", "ai", "llm", "agile",
        "scrum", "testing", "pytest",
    ]

    text_lower = job_ad_text.lower()
    matched = [kw for kw in keyword_pool if kw in text_lower]
    missing = [kw for kw in keyword_pool if kw not in text_lower]
    ats_score = int(len(matched) / len(keyword_pool) * 100)

    featured = ", ".join(matched[:4]) if matched else "software development"
    summary = (
        f"Tailored CV for {job_title} at {company}. "
        f"Focused on relevant strengths including {featured}, "
        f"with practical experience in backend development, APIs, and modern web technologies."
    )
    skills = ", ".join([kw.title() for kw in matched[:8]] + ["Python", "FastAPI", "React", "Docker"])
    experience = (
        f"Experience aligned with {job_title} responsibilities, "
        f"including {featured}. Strong background in building REST APIs, "
        f"working with databases, and delivering production-ready software."
    )

    return {
        "summary": summary,
        "skills": skills,
        "experience": experience,
        "ats_score": ats_score,
        "missing_keywords": ", ".join(missing[:10]),
    }


@router.post("/", response_model=CVVersionRead)
def create_cv_version(
    payload: CVVersionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == payload.application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job_title = application.job_title or "the role"
    company = application.company or "the company"

    try:
        result = _call_claude(
            job_ad_text=payload.job_ad_text,
            job_title=job_title,
            company=company,
            template_name=payload.template_name or "Modern",
        )
    except Exception:
        result = _fallback_generate(payload.job_ad_text, job_title, company)

    cv_row = CVVersion(
        user_id=current_user.id,
        application_id=payload.application_id,
        job_ad_text=payload.job_ad_text,
        template_name=payload.template_name,
        cv_summary=result["summary"],
        cv_skills=result["skills"],
        cv_experience=result["experience"],
        ats_score=result["ats_score"],
        missing_keywords=result["missing_keywords"],
    )

    db.add(cv_row)
    db.commit()
    db.refresh(cv_row)
    return cv_row


@router.get("/application/{application_id}")
def list_cv_versions_for_application(
    application_id: int, db: Session = Depends(get_db)
):
    return (
        db.query(CVVersion)
        .filter(CVVersion.application_id == application_id)
        .order_by(CVVersion.id.desc())
        .limit(5)
        .all()
    )


@router.get("/{cv_id}/download")
def download_cv(cv_id: int, db: Session = Depends(get_db)):
    cv = db.query(CVVersion).filter(CVVersion.id == cv_id).first()

    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    pdf_buffer = generate_cv_pdf(cv)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cv_{cv_id}.pdf"},
    )
