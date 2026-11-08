from alembic import op
import sqlalchemy as sa


revision = "af5d923b187a"
down_revision = "aaed412f1380"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("space_work", sa.Column("icon_key", sa.String(16), nullable=False, server_default="folder"))
    op.add_column("space_work", sa.Column("color_key", sa.String(16), nullable=False, server_default="blue"))


def downgrade() -> None:
    op.drop_column("space_work", "color_key", mssql_drop_default=True)
    op.drop_column("space_work", "icon_key", mssql_drop_default=True)
