"""Seed document permission levels.

Revision ID: c5d2a7e91b43
Revises: a74a2e2d7356
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5d2a7e91b43"
down_revision: Union[str, Sequence[str], None] = "a74a2e2d7356"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    permissions = sa.table(
        "permission",
        sa.column("name", sa.String(50)),
        sa.column("description", sa.String(255)),
    )
    op.bulk_insert(
        permissions,
        [
            {"name": "read", "description": "Puede consultar el documento y su historial."},
            {"name": "edit", "description": "Puede consultar y crear versiones nuevas."},
            {"name": "admin", "description": "Puede editar y gestionar permisos del documento."},
        ],
    )


def downgrade() -> None:
    permissions = sa.table("permission", sa.column("name", sa.String(50)))
    op.execute(sa.delete(permissions).where(permissions.c.name.in_(["read", "edit", "admin"])))
