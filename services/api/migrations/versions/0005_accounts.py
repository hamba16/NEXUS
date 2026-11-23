"""Internal accounts, sessions and scope enforcement.

Revision ID: 0005
"""
from pathlib import Path

from alembic import op
from sqlalchemy import text

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade():
    for statement in (Path(__file__).parent / '0005.sql').read_text().split('-- statement-break'):
        if statement.strip():
            op.execute(text(statement))


def downgrade():
    raise RuntimeError('Account migration requires a reviewed restore; automatic downgrade would remove credentials and scope controls.')
