"""Allow the API role to import reviewed context-pack JSON.

Revision ID: 0004
"""
from alembic import op

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    op.execute('GRANT INSERT, UPDATE, DELETE ON public.public_context_pack, public.public_context_record TO nexus_app')


def downgrade():
    op.execute('REVOKE INSERT, UPDATE, DELETE ON public.public_context_pack, public.public_context_record FROM nexus_app')
