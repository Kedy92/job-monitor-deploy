from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app.ai.keyword_matcher import calculate_match
from app.api.deps import get_current_user


router = APIRouter(prefix="/ai", tags=["AI Tools"])


class MatchRequest(BaseModel):
    job_description: str
    profile_keywords: List[str]


@router.post("/match-score")
def match_score(payload: MatchRequest, current_user=Depends(get_current_user)):
    result = calculate_match(
        job_description=payload.job_description,
        profile_keywords=payload.profile_keywords,
    )
    return result
