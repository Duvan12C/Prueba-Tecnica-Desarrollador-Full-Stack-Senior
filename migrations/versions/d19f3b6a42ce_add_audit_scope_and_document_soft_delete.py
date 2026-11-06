"""Add workspace scope to audit records and soft-delete documents.

Revision ID: d19f3b6a42ce
Revises: c5d2a7e91b43
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d19f3b6a42ce"
down_revision: Union[str, Sequence[str], None] = "c5d2a7e91b43"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "audit_log",
        sa.Column("space_work_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_audit_log_space_work",
        "audit_log",
        "space_work",
        ["space_work_id"],
        ["id"],
    )
    op.create_index("ix_audit_log_space_work_id", "audit_log", ["space_work_id"])
    op.add_column(
        "document",
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("0"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("document", "is_deleted")
    op.drop_index("ix_audit_log_space_work_id", table_name="audit_log")
    op.drop_constraint("fk_audit_log_space_work", "audit_log", type_="foreignkey")
    op.drop_column("audit_log", "space_work_id")
