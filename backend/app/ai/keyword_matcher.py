import re
from collections import Counter


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


def clean_text(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    words = text.split()
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]


def calculate_match(job_description: str, profile_keywords: list[str]):
    job_words = clean_text(job_description)
    job_counter = Counter(job_words)

    profile_keywords = [k.lower() for k in profile_keywords]

    matched = []
    missing = []

    for keyword in profile_keywords:
        if keyword in job_counter:
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
