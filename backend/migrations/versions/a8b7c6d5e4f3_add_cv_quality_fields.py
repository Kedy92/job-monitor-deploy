"""add cv quality fields

Revision ID: a8b7c6d5e4f3
Revises: f4a9b8c7d6e5
Create Date: 2026-08-15 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "a8b7c6d5e4f3"
down_revision = "f4a9b8c7d6e5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("cv_versions", sa.Column("matched_keywords", sa.Text(), nullable=True))
    op.add_column("cv_versions", sa.Column("profile_gaps", sa.Text(), nullable=True))
    op.add_column("cv_versions", sa.Column("honesty_warnings", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("cv_versions", "honesty_warnings")
    op.drop_column("cv_versions", "profile_gaps")
    op.drop_column("cv_versions", "matched_keywords")
