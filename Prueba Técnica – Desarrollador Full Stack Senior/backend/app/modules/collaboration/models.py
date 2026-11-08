from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DocumentDraft(Base):
    __tablename__ = "document_draft"

    document_id: Mapped[int] = mapped_column(ForeignKey("document.id"), primary_key=True, autoincrement=False)
    revision: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
