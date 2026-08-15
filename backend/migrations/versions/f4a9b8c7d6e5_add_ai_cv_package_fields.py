"""add ai cv package fields

Revision ID: f4a9b8c7d6e5
Revises: c1d2e3f4a5b6
Create Date: 2026-08-15 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "f4a9b8c7d6e5"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("cv_versions", sa.Column("cover_letter", sa.Text(), nullable=True))
    op.add_column("cv_versions", sa.Column("interview_questions", sa.Text(), nullable=True))
    op.add_column("cv_versions", sa.Column("improvement_suggestions", sa.Text(), nullable=True))
    op.add_column("cv_versions", sa.Column("ai_provider", sa.String(length=50), nullable=True))


def downgrade():
    op.drop_column("cv_versions", "ai_provider")
    op.drop_column("cv_versions", "improvement_suggestions")
    op.drop_column("cv_versions", "interview_questions")
    op.drop_column("cv_versions", "cover_letter")
