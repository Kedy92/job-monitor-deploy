from collections import Counter
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.cv_version import CVVersion
from app.models.application import Application
from app.schemas.cv_version import CVVersionCreate, CVVersionRead

from fastapi.responses import StreamingResponse
from app.services.pdf_generator import generate_cv_pdf

router = APIRouter(prefix="/cv-versions", tags=["cv-versions"])


KEYWORD_POOL = [
    "python",
    "fastapi",
    "django",
    "flask",
    "react",
    "javascript",
    "typescript",
    "sql",
    "postgresql",
    "mysql",
    "docker",
    "aws",
    "api",
    "rest",
    "jwt",
    "tailwind",
    "git",
    "github",
    "html",
    "css",
    "pandas",
    "numpy",
    "machine learning",
    "ai",
    "llm",
    "data analysis",
    "agile",
    "scrum",
    "testing",
    "pytest",
]


CANDIDATE_SKILLS = [
    "Python",
    "FastAPI",
    "React",
    "SQL",
    "PostgreSQL",
    "Docker",
    "Git",
    "GitHub",
    "HTML",
    "CSS",
    "JavaScript",
    "Tailwind",
    "Pandas",
    "REST API",
]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def extract_keywords(job_ad_text: str):
    text = normalize_text(job_ad_text)

    matched = []
    missing = []

    for kw in KEYWORD_POOL:
        if kw in text:
            matched.append(kw)
        else:
            missing.append(kw)

    return matched, missing


def score_from_keywords(matched, checked_total):
    if checked_total == 0:
        return 0
    return int((len(matched) / checked_total) * 100)


def extract_top_terms(job_ad_text: str, limit: int = 8):
    text = normalize_text(job_ad_text)

    words = re.findall(r"[a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\-\+\.#]*", text)

    stopwords = {
        "and",
        "or",
        "the",
        "a",
        "an",
        "to",
        "of",
        "in",
        "for",
        "with",
        "on",
        "is",
        "are",
        "be",
        "as",
        "you",
        "we",
        "our",
        "your",
        "this",
        "that",
        "will",
        "from",
        "by",
        "at",
        "it",
        "about",
        "have",
        "has",
        "they",
        "their",
        "them",
        "can",
        "who",
        "looking",
        "experience",
        "work",
        "working",
        "skills",
        "knowledge",
        "team",
        "role",
        "using",
        "used",
        "want",
        "must",
        "required",
        "plus",
        "good",
        "strong",
        "ability",
        "är",
        "och",
        "att",
        "som",
        "med",
        "för",
        "du",
        "vi",
        "har",
        "ett",
        "en",
        "på",
        "av",
        "det",
        "den",
        "till",
        "erfarenhet",
        "kunskap",
        "arbetsuppgifter",
        "rollen",
    }

    cleaned = [w for w in words if len(w) > 2 and w.lower() not in stopwords]

    counts = Counter(cleaned)
    return [word for word, _ in counts.most_common(limit)]


def build_summary(application: Application, matched_keywords):
    role = application.job_title or "the role"
    company = application.company or "the company"

    if matched_keywords:
        featured = ", ".join(matched_keywords[:4])
        return (
            f"Tailored CV for {role} at {company}. "
            f"Focused on relevant strengths such as {featured}, "
            f"with emphasis on practical development, problem-solving, "
            f"and delivering value in a professional software environment."
        )

    return (
        f"Tailored CV for {role} at {company}. "
        f"Focused on transferable technical strengths, adaptability, "
        f"and the ability to learn quickly and contribute in a structured team environment."
    )


def build_skills(matched_keywords):
    matched_title = [kw.title() for kw in matched_keywords[:8]]

    fallback = ["Python", "FastAPI", "React", "SQL", "PostgreSQL", "Docker"]

    final_skills = []
    for skill in matched_title + fallback:
        if skill not in final_skills:
            final_skills.append(skill)

    return ", ".join(final_skills[:10])


def build_experience(application: Application, matched_keywords, top_terms):
    role = application.job_title or "the target role"

    emphasis_parts = []

    if matched_keywords:
        emphasis_parts.append(
            "relevant technologies such as " + ", ".join(matched_keywords[:5])
        )

    if top_terms:
        emphasis_parts.append(
            "important themes from the advertisement such as "
            + ", ".join(top_terms[:4])
        )

    emphasis = (
        "; ".join(emphasis_parts)
        if emphasis_parts
        else "backend, frontend, and practical software delivery"
    )

    return (
        f"Experience tailored toward {role}, with focus on {emphasis}. "
        f"Highlights practical development, APIs, databases, structured collaboration, "
        f"and the ability to learn fast and contribute under real project conditions."
    )


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

    matched_keywords, missing_keywords = extract_keywords(payload.job_ad_text)
    ats_score = score_from_keywords(matched_keywords, len(KEYWORD_POOL))
    top_terms = extract_top_terms(payload.job_ad_text)

    cv_summary = build_summary(application, matched_keywords)
    cv_skills = build_skills(matched_keywords)
    cv_experience = build_experience(application, matched_keywords, top_terms)

    cv_row = CVVersion(
        user_id=current_user.id,
        application_id=payload.application_id,
        job_ad_text=payload.job_ad_text,
        template_name=payload.template_name,
        cv_summary=cv_summary,
        cv_skills=cv_skills,
        cv_experience=cv_experience,
        ats_score=ats_score,
        missing_keywords=", ".join(missing_keywords[:12]),
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
