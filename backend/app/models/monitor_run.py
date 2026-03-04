from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class MonitorRun(Base):
    __tablename__ = "monitor_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    monitor_id: Mapped[int] = mapped_column(
        ForeignKey("monitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ok")
    message: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Optional: store a “state fingerprint” later (hash of parsed results)
    result_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # relationship (optional but nice)
    monitor = relationship("Monitor", back_populates="runs")
