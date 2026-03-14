"""add support tickets

Revision ID: c8d5e6f7a2b3
Revises: b7c4d5e6f1a2
Create Date: 2026-03-14 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'c8d5e6f7a2b3'
down_revision: Union[str, Sequence[str], None] = 'b7c4d5e6f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'support_tickets',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('body', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_support_tickets_user_id', 'support_tickets', ['user_id'])

    op.create_table(
        'support_ticket_attachments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('ticket_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('storage_key', sa.String(), nullable=False),
        sa.Column('uploaded', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['ticket_id'], ['support_tickets.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_support_ticket_attachments_ticket_id', 'support_ticket_attachments', ['ticket_id'])


def downgrade() -> None:
    op.drop_index('ix_support_ticket_attachments_ticket_id', 'support_ticket_attachments')
    op.drop_table('support_ticket_attachments')
    op.drop_index('ix_support_tickets_user_id', 'support_tickets')
    op.drop_table('support_tickets')
