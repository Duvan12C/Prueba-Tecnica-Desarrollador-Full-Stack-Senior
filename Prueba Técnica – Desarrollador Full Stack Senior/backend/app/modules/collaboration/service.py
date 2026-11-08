from dataclasses import dataclass
from time import time

from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.core.dependencies import authenticate_access_token
from app.modules.auth.repository import AuthRepository
from app.modules.collaboration.models import DocumentDraft
from app.modules.collaboration.schemas import DocumentSnapshot, EditMessage, Participant
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.schemas import DocumentSaveRequest
from app.modules.documents.service import DocumentService
from app.modules.versions.models import DocumentVersion
from app.shared.exceptions import ConflictError, ForbiddenError, ResourceNotFoundError, UnauthorizedError


@dataclass(frozen=True)
class CollaborationIdentity:
    participant: Participant
    session_id: str


class CollaborationService:
    def __init__(self, sessions: sessionmaker[Session]):
        self.sessions = sessions

    def authenticate(self, token: str, document_id: int) -> CollaborationIdentity:
        with self.sessions() as db:
            session = authenticate_access_token(token, db)
            if session is None:
                raise UnauthorizedError("La sesión no está activa")
            DocumentService(DocumentRepository(db)).get_readable_document(document_id, session.user.id)
            return CollaborationIdentity(
                Participant(user_id=session.user.id, name=session.user.name),
                session.session_id,
            )

    def _user_id(self, db: Session, identity: CollaborationIdentity) -> int:
        user_id = identity.participant.user_id
        if AuthRepository(db).get_session_user(identity.session_id, user_id, int(time())) is None:
            raise UnauthorizedError("La sesión no está activa")
        return user_id

    def snapshot(self, document_id: int, identity: CollaborationIdentity) -> DocumentSnapshot:
        with self.sessions() as db:
            user_id = self._user_id(db, identity)
            _, snapshot, _ = self._document_state(db, document_id, user_id)
            return snapshot

    def _document_state(
        self, db: Session, document_id: int, user_id: int,
    ) -> tuple[DocumentDraft | None, DocumentSnapshot, DocumentVersion]:
        documents = DocumentRepository(db)
        document, permission = DocumentService(documents).get_readable_document(document_id, user_id)
        version = documents.latest_version(document.id)
        if version is None:
            raise ResourceNotFoundError("Documento no encontrado")
        draft = db.get(DocumentDraft, document.id)
        snapshot = DocumentSnapshot(
            version=version.version_number,
            revision=draft.revision if draft is not None else version.version_number,
            content=draft.content if draft is not None else version.content,
            permission=permission,
            has_unpublished_changes=draft is not None and draft.content != version.content,
        )
        return draft, snapshot, version

    @staticmethod
    def require_current_edit(snapshot: DocumentSnapshot, base_revision: int) -> None:
        if snapshot.permission not in {"edit", "admin"}:
            raise ForbiddenError("No tienes permiso de edición para este documento")
        if snapshot.revision != base_revision:
            raise ConflictError("El borrador compartido cambió")

    def edit(self, document_id: int, identity: CollaborationIdentity, edit: EditMessage) -> DocumentSnapshot:
        with self.sessions() as db:
            user_id = self._user_id(db, identity)
            draft, snapshot, published = self._document_state(db, document_id, user_id)
            self.require_current_edit(snapshot, edit.base_revision)
            if snapshot.content == edit.content:
                return snapshot

            revision = snapshot.revision + 1
            if draft is None:
                db.add(DocumentDraft(document_id=document_id, revision=revision, content=edit.content))
            else:
                result = db.execute(
                    update(DocumentDraft)
                    .where(DocumentDraft.document_id == document_id, DocumentDraft.revision == edit.base_revision)
                    .values(revision=revision, content=edit.content)
                )
                if result.rowcount != 1:
                    raise ConflictError("El borrador compartido cambió")
            try:
                db.commit()
            except IntegrityError as error:
                db.rollback()
                current = db.get(DocumentDraft, document_id)
                if current is not None and current.revision != edit.base_revision:
                    raise ConflictError("El borrador compartido cambió") from error
                raise
            return snapshot.model_copy(update={
                "revision": revision,
                "content": edit.content,
                "has_unpublished_changes": edit.content != published.content,
            })

    def save_version(self, document_id: int, identity: CollaborationIdentity, base_revision: int) -> tuple[int, bool]:
        with self.sessions() as db:
            user_id = self._user_id(db, identity)
            _, snapshot, _ = self._document_state(db, document_id, user_id)
            self.require_current_edit(snapshot, base_revision)
            if not snapshot.has_unpublished_changes:
                return snapshot.version, False
            version = DocumentService(DocumentRepository(db)).save(
                document_id,
                DocumentSaveRequest(
                    content=snapshot.content,
                    base_version=snapshot.version,
                    change_summary="Versión del borrador compartido",
                ),
                user_id,
            )
            return version.version_number, True
