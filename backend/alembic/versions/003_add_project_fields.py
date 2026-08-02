"""Add client website fields to projects table

Revision ID: 003_add_project_fields
Revises: 002_add_invitations
Create Date: 2026-07-28 13:16:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003_add_project_fields"
down_revision: Union[str, None] = "002_add_invitations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("website_url", sa.String(length=255), nullable=True))
    op.add_column("projects", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("projects", sa.Column("timezone", sa.String(length=100), nullable=True))
    op.add_column("projects", sa.Column("industry", sa.String(length=100), nullable=True))
    op.add_column("projects", sa.Column("currency", sa.String(length=10), server_default=sa.text("'USD'"), nullable=False))
    op.add_column("projects", sa.Column("logo_url", sa.String(length=500), nullable=True))

    op.create_index("ix_projects_country", "projects", ["country"])
    op.create_index("ix_projects_industry", "projects", ["industry"])


def downgrade() -> None:
    op.drop_index("ix_projects_industry", table_name="projects")
    op.drop_index("ix_projects_country", table_name="projects")
    op.drop_column("projects", "logo_url")
    op.drop_column("projects", "currency")
    op.drop_column("projects", "industry")
    op.drop_column("projects", "timezone")
    op.drop_column("projects", "country")
    op.drop_column("projects", "website_url")
