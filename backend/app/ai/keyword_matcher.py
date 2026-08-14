import re


STOP_WORDS = {
    "the",
    "and",
    "or",
    "a",
    "an",
    "to",
    "of",
    "in",
    "for",
    "with",
    "on",
    "at",
    "is",
    "are",
    "as",
    "this",
    "that",
    "be",
    "by",
    "from",
    "we",
    "you",
}


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9+#.\s-]", " ", text)
    return " ".join(text.split())


def clean_text(text: str) -> list[str]:
    text = normalize_text(text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    words = text.split()
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]


def calculate_match(job_description: str, profile_keywords: list[str]):
    normalized_description = normalize_text(job_description)
    job_words = set(clean_text(job_description))
    profile_keywords = [normalize_text(k) for k in profile_keywords if normalize_text(k)]

    matched = []
    missing = []

    for keyword in profile_keywords:
        if " " in keyword:
            found = keyword in normalized_description
        else:
            found = keyword in job_words or re.search(
                rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])",
                normalized_description,
            )

        if found:
            matched.append(keyword)
        else:
            missing.append(keyword)

    if not profile_keywords:
        score = 0
    else:
        score = int((len(matched) / len(profile_keywords)) * 100)

    return {
        "score": score,
        "matched_keywords": matched,
        "missing_keywords": missing,
    }
