"""Published directive register foundation.

Revision ID: 0002
"""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'directive',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=True),
        sa.Column('full_text', sa.Text(), nullable=True),
        sa.Column('provenance', sa.String(length=16), nullable=False),
        sa.Column('citations', sa.JSON(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.CheckConstraint("number >= 1 AND number <= 23", name='directive_number'),
        sa.CheckConstraint("provenance IN ('published','unverified')", name='directive_provenance'),
        sa.UniqueConstraint('number', name='directive_unique_number'),
    )
    op.create_table(
        'directive_scorecard',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('directive_id', sa.UUID(), sa.ForeignKey('directive.id', ondelete='CASCADE'), nullable=False),
        sa.Column('period', sa.String(length=20), nullable=False),
        sa.Column('label', sa.String(length=20), nullable=False),
        sa.Column('citation', sa.JSON(), nullable=False),
        sa.CheckConstraint("label IN ('Achieved','Above average','Average','Below average','Not achieved')", name='directive_score_label'),
    )
    op.execute("GRANT SELECT ON public.directive, public.directive_scorecard TO nexus_app")


def downgrade():
    op.drop_table('directive_scorecard')
    op.drop_table('directive')
