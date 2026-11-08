"""Persist renewable authentication sessions."""

from alembic import op
import sqlalchemy as sa


revision = "aaed412f1380"
down_revision = "d19f3b6a42ce"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_session",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("User.id"), nullable=False),
        sa.Column("refresh_digest", sa.String(64), nullable=False),
        sa.Column("idle_expires_at", sa.BigInteger(), nullable=False),
        sa.Column("expires_at", sa.BigInteger(), nullable=False),
    )
    op.create_index("ix_auth_session_user_id", "auth_session", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_auth_session_user_id", table_name="auth_session")
    op.drop_table("auth_session")
