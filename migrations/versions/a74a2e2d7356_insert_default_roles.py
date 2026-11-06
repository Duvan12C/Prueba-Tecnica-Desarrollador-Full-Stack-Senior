"""insert default roles

Revision ID: a74a2e2d7356
Revises: a609140afdee
Create Date: 2026-11-04 19:00:50.731507

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a74a2e2d7356'
down_revision: Union[str, Sequence[str], None] = 'a609140afdee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    roles = sa.table(
        "role",
        sa.column("name", sa.String(50)),
        sa.column("description", sa.String(255))
    )

    op.bulk_insert(
        roles,
        [
            {
                "name": "Gestor",
                "description": (
                    "Administra su espacio de trabajo, "
                    "gestiona usuarios y tiene control total "
                    "sobre los documentos de su espacio."
                )
            },
            {
                "name": "Colaborador",
                "description": (
                    "Accede y trabaja con los documentos "
                    "de su espacio de trabajo según los "
                    "permisos que le hayan sido asignados."
                )
            }
        ]
    )


def downgrade() -> None:
    roles = sa.table(
        "role",
        sa.column("name", sa.String(50))
    )

    op.execute(
        sa.delete(roles).where(
            roles.c.name.in_(["Gestor", "Colaborador"])
        )
    )
