"""Open-profile reporting foundation and forced RLS.

Revision ID: 0001
"""
import os
from pathlib import Path

from alembic import op
from sqlalchemy import text

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    for statement in (Path(__file__).parent / '0001.sql').read_text().split('-- statement-break'):
        if statement.strip():
            op.execute(text(statement))
    password = os.environ.get('APP_DATABASE_PASSWORD')
    if password:
        # PostgreSQL performs literal quoting. Never log or interpolate a password in shell text.
        statement = op.get_bind().scalar(text("SELECT format('ALTER ROLE nexus_app PASSWORD %L', :password)"), {'password': password})
        op.execute(text(statement))


def downgrade():
    op.execute('DROP TABLE public.report_revision, public.mda_report, public.audit_event, public.profile, public.institution CASCADE')
    op.execute('DROP FUNCTION public.audit_report_change(), public.enforce_report_write(), public.deny_mutation() CASCADE')
    # Cluster-scoped role may be shared with a different database; do not drop it here.
