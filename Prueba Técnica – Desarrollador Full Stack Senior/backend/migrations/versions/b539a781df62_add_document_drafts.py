from alembic import op
import sqlalchemy as sa


revision = "b539a781df62"
down_revision = "af5d923b187a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "document_draft",
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("document.id"), primary_key=True, autoincrement=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("document_draft")
