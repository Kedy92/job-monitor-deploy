from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    job_url = Column(String(500), nullable=True)

    match_score = Column(Integer, nullable=True)

    status = Column(String(50), default="APPLIED")
    # APPLIED / INTERVIEW / REJECTED / OFFER

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
