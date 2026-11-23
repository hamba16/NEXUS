"""Public Uganda context pack storage.

Revision ID: 0003
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'public_context_pack',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('version', sa.String(length=40), nullable=False),
        sa.Column('as_of', sa.String(length=20), nullable=False),
        sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_table(
        'public_context_record',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('pack_id', sa.UUID(), sa.ForeignKey('public_context_pack.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section', sa.String(length=80), nullable=False),
        sa.Column('slug', sa.String(length=200), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('provenance', sa.String(length=20), nullable=False),
        sa.Column('source_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('as_of', sa.String(length=20), nullable=True),
        sa.Column('reverify', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.UniqueConstraint('pack_id', 'section', 'slug', name='context_record_unique'),
    )
    op.create_index('context_record_section_idx', 'public_context_record', ['section'])
    op.execute('GRANT SELECT ON public.public_context_pack, public.public_context_record TO nexus_app')


def downgrade():
    op.drop_index('context_record_section_idx', table_name='public_context_record')
    op.drop_table('public_context_record')
    op.drop_table('public_context_pack')
