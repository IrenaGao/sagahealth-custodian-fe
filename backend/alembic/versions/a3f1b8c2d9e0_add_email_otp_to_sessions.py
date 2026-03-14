"""add email otp to sessions

Revision ID: a3f1b8c2d9e0
Revises: 4d8755cfe27b
Create Date: 2026-03-11 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3f1b8c2d9e0'
down_revision: Union[str, Sequence[str], None] = '4d8755cfe27b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('sessions', sa.Column('email_otp_hash', sa.String(), nullable=True))
    op.add_column('sessions', sa.Column('email_otp_expires_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('sessions', 'email_otp_expires_at')
    op.drop_column('sessions', 'email_otp_hash')
