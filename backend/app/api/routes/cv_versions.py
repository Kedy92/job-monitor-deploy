import json
import re
from typing import Any

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

DEFAULT_CANDIDATE_PROFILE = (
    "Junior full-stack developer with practical project experience in Python, "
    "FastAPI, React, SQL/PostgreSQL, Docker, REST APIs, authentication, deployment, "
    "and AI-assisted development workflows."
)


CV_PACKAGE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "skills": {"type": "string"},
        "experience": {"type": "string"},
        "cover_letter": {"type": "string"},
        "interview_questions": {"type": "string"},
        "improvement_suggestions": {"type": "string"},
        "matched_keywords": {"type": "string"},
        "profile_gaps": {"type": "string"},
        "honesty_warnings": {"type": "string"},
        "ats_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "missing_keywords": {"type": "string"},
    },
    "required": [
        "summary",
        "skills",
        "experience",
        "cover_letter",
        "interview_questions",
        "improvement_suggestions",
        "matched_keywords",
        "profile_gaps",
        "honesty_warnings",
        "ats_score",
        "missing_keywords",
    ],
}


def _normalize_ai_result(data: dict[str, Any], provider: str) -> dict:
    return {
        "summary": str(data.get("summary", "")).strip(),
        "skills": str(data.get("skills", "")).strip(),
        "experience": str(data.get("experience", "")).strip(),
        "cover_letter": str(data.get("cover_letter", "")).strip(),
        "interview_questions": str(data.get("interview_questions", "")).strip(),
        "improvement_suggestions": str(data.get("improvement_suggestions", "")).strip(),
        "matched_keywords": str(data.get("matched_keywords", "")).strip(),
        "profile_gaps": str(data.get("profile_gaps", "")).strip(),
        "honesty_warnings": str(data.get("honesty_warnings", "")).strip(),
        "ats_score": max(0, min(100, int(data.get("ats_score", 50)))),
        "missing_keywords": str(data.get("missing_keywords", "")).strip(),
        "provider": provider,
    }


def _build_cv_prompt(
    job_ad_text: str,
    job_title: str,
    company: str,
    template_name: str,
    candidate_profile: str,
) -> str:
    return f"""You are an expert CV writer, recruiter, and ATS specialist.

Candidate target role: {job_title}
Company: {company}
Template style: {template_name}

Candidate profile:
---
{candidate_profile}
---

Job advertisement:
---
{job_ad_text}
---

Create a tailored application package. Be specific to the job advertisement and candidate profile.

Rules:
- Do not invent degrees, employers, certifications, dates, or seniority that the candidate profile does not support.
- Make the CV content strong but honest for a junior/early-career developer if the profile indicates that level.
- "skills" must be a comma-separated list of 10-14 relevant skills.
- "experience" must be 3-5 concise CV bullets separated by newlines.
- "cover_letter" must be 2-4 short paragraphs.
- "interview_questions" must be 6 practical questions, one per line.
- "improvement_suggestions" must be 4-6 concrete actions, one per line.
- "matched_keywords" must be a comma-separated list of job-ad keywords clearly supported by the candidate profile.
- "profile_gaps" must be 3-6 missing or weak areas, one per line.
- "honesty_warnings" must flag any place where the CV should avoid overclaiming. If there are no major risks, explain that the content stays within the profile.
- "missing_keywords" must be a comma-separated list of important job-ad keywords not strongly covered by the candidate profile.
- Return only valid JSON matching the requested schema."""


def _parse_json_text(text: str) -> dict | None:
    text = re.sub(r"```(?:json)?", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
    return None


def _call_openai(
    job_ad_text: str,
    job_title: str,
    company: str,
    template_name: str,
    candidate_profile: str,
) -> dict | None:
    if not settings.OPENAI_API_KEY:
        return None

    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = _build_cv_prompt(job_ad_text, job_title, company, template_name, candidate_profile)

    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "You generate honest, ATS-aware job application material. "
                    "Output must be strict JSON only."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "cv_application_package",
                "schema": CV_PACKAGE_SCHEMA,
                "strict": True,
            }
        },
    )

    data = _parse_json_text(response.output_text)
    if data is None:
        return None

    return _normalize_ai_result(data, "openai")


def _call_claude(
    job_ad_text: str,
    job_title: str,
    company: str,
    template_name: str,
    candidate_profile: str,
) -> dict | None:
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "your_anthropic_api_key_here":
        return None

    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    prompt = _build_cv_prompt(job_ad_text, job_title, company, template_name, candidate_profile)

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

    data = _parse_json_text(text)
    if data is None:
        return None

    return _normalize_ai_result(data, "anthropic")


def _generate_cv_package(
    job_ad_text: str,
    job_title: str,
    company: str,
    template_name: str,
    candidate_profile: str,
) -> dict:
    provider = settings.AI_PROVIDER.lower().strip()

    providers = {
        "openai": _call_openai,
        "anthropic": _call_claude,
    }
    ordered = [provider] if provider in providers else []
    ordered += [name for name in providers if name not in ordered]

    for name in ordered:
        try:
            result = providers[name](
                job_ad_text,
                job_title,
                company,
                template_name,
                candidate_profile,
            )
            if result:
                return result
        except Exception:
            continue

    return _fallback_generate(job_ad_text, job_title, company, candidate_profile)


def _fallback_generate(job_ad_text: str, job_title: str, company: str, candidate_profile: str) -> dict:
    """Simple keyword-based fallback when no AI provider is configured."""
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
    profile_lower = candidate_profile.lower()
    candidate_matches = [kw for kw in matched if kw in profile_lower]
    ats_score = int((len(candidate_matches) / max(len(matched), 1)) * 100) if matched else 50

    featured = ", ".join(matched[:4]) if matched else "software development"
    summary = (
        f"Tailored CV for {job_title} at {company}. "
        f"Focused on relevant strengths including {featured}, "
        f"with practical experience in backend development, APIs, and modern web technologies."
    )
    skills = ", ".join([kw.title() for kw in matched[:8]] + ["Python", "FastAPI", "React", "Docker"])
    experience = "\n".join(
        [
            f"Built full-stack web features aligned with {job_title} responsibilities, including {featured}.",
            "Implemented FastAPI endpoints, SQL persistence, authentication, and React interfaces.",
            "Used Docker and cloud deployment workflows to run production-style services.",
        ]
    )
    cover_letter = (
        f"Dear {company} team,\n\n"
        f"I am interested in the {job_title} role because it matches my practical experience "
        f"with {featured}. I have worked on full-stack projects using FastAPI, React, SQL, "
        "Docker, and deployment workflows, and I enjoy building useful products that solve "
        "real user problems.\n\n"
        "I would be glad to discuss how my project experience and willingness to learn can "
        "support your team."
    )
    questions = "\n".join(
        [
            f"Which parts of the {job_title} role are most important during the first months?",
            "How does the team structure backend and frontend collaboration?",
            "What deployment and monitoring practices are used in production?",
            "Which technical skills should a new developer strengthen first?",
            "How is code quality reviewed in the team?",
            "What would make a junior developer successful in this role?",
        ]
    )
    suggestions = "\n".join(
        [
            "Add concrete project metrics where possible.",
            "Prepare a short explanation of the FastAPI and React architecture.",
            "Map each required keyword to a real project example.",
            "Strengthen any missing database, cloud, or testing keywords before applying.",
        ]
    )
    profile_gaps = "\n".join(
        [
            f"Show a concrete example for {kw}." for kw in missing[:5]
        ]
    ) or "No major gaps detected from the configured keyword set."
    honesty_warnings = (
        "Keep the wording at junior/full-stack project level unless you can show "
        "professional production experience for every claimed skill."
    )

    return {
        "summary": summary,
        "skills": skills,
        "experience": experience,
        "cover_letter": cover_letter,
        "interview_questions": questions,
        "improvement_suggestions": suggestions,
        "matched_keywords": ", ".join(candidate_matches[:12]),
        "profile_gaps": profile_gaps,
        "honesty_warnings": honesty_warnings,
        "ats_score": ats_score,
        "missing_keywords": ", ".join(missing[:10]),
        "provider": "fallback",
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

    candidate_profile = payload.candidate_profile or DEFAULT_CANDIDATE_PROFILE
    result = _generate_cv_package(
        job_ad_text=payload.job_ad_text,
        job_title=job_title,
        company=company,
        template_name=payload.template_name or "Modern",
        candidate_profile=candidate_profile,
    )

    cv_row = CVVersion(
        user_id=current_user.id,
        application_id=payload.application_id,
        job_ad_text=payload.job_ad_text,
        template_name=payload.template_name,
        cv_summary=result["summary"],
        cv_skills=result["skills"],
        cv_experience=result["experience"],
        cover_letter=result["cover_letter"],
        interview_questions=result["interview_questions"],
        improvement_suggestions=result["improvement_suggestions"],
        matched_keywords=result["matched_keywords"],
        profile_gaps=result["profile_gaps"],
        honesty_warnings=result["honesty_warnings"],
        ai_provider=result["provider"],
        ats_score=result["ats_score"],
        missing_keywords=result["missing_keywords"],
    )

    db.add(cv_row)
    db.commit()
    db.refresh(cv_row)
    return cv_row


@router.get("/application/{application_id}")
def list_cv_versions_for_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(CVVersion)
        .filter(
            CVVersion.application_id == application_id,
            CVVersion.user_id == current_user.id,
        )
        .order_by(CVVersion.id.desc())
        .limit(5)
        .all()
    )


@router.get("/{cv_id}/download")
def download_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cv = (
        db.query(CVVersion)
        .filter(CVVersion.id == cv_id, CVVersion.user_id == current_user.id)
        .first()
    )

    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    pdf_buffer = generate_cv_pdf(cv)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cv_{cv_id}.pdf"},
    )
