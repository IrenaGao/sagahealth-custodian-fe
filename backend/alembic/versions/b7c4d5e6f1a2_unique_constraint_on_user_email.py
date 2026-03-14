"""unique constraint on user email

Revision ID: b7c4d5e6f1a2
Revises: a3f1b8c2d9e0
Create Date: 2026-03-11 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b7c4d5e6f1a2'
down_revision: Union[str, Sequence[str], None] = 'a3f1b8c2d9e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.create_unique_constraint('uq_users_email', ['email'])


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('uq_users_email', type_='unique')
