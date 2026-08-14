from app.ai.keyword_matcher import calculate_match


def test_keyword_matcher_handles_words_and_phrases():
    result = calculate_match(
        "We build REST APIs with FastAPI and use machine learning workflows.",
        ["FastAPI", "REST API", "machine learning", "React Native"],
    )

    assert result["score"] == 75
    assert "fastapi" in result["matched_keywords"]
    assert "rest api" in result["matched_keywords"]
    assert "machine learning" in result["matched_keywords"]
    assert "react native" in result["missing_keywords"]


def test_keyword_matcher_returns_zero_for_empty_profile():
    result = calculate_match("Python React SQL", [])

    assert result == {
        "score": 0,
        "matched_keywords": [],
        "missing_keywords": [],
    }
