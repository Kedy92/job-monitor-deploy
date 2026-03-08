"""add keywords and match_threshold to monitors

Revision ID: a1b2c3d4e5f6
Revises: 930e098ec341
Create Date: 2026-03-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '930e098ec341'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('monitors', sa.Column('keywords', sa.String(length=500), nullable=True, server_default=''))
    op.add_column('monitors', sa.Column('match_threshold', sa.Integer(), nullable=False, server_default='60'))


def downgrade() -> None:
    op.drop_column('monitors', 'match_threshold')
    op.drop_column('monitors', 'keywords')
