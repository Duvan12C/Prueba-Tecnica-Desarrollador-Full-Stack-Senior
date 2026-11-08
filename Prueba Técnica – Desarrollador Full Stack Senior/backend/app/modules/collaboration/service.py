from dataclasses import dataclass
from time import time

from sqlalchemy.orm import Session, sessionmaker

from app.core.dependencies import authenticate_access_token
from app.modules.auth.repository import AuthRepository
from app.modules.collaboration.schemas import DocumentSnapshot, EditMessage, Participant
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.schemas import DocumentSaveRequest
from app.modules.documents.service import DocumentService
from app.shared.exceptions import ResourceNotFoundError, UnauthorizedError


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
            documents = DocumentRepository(db)
            document, permission = DocumentService(documents).get_readable_document(document_id, user_id)
            version = documents.latest_version(document.id)
            if version is None:
                raise ResourceNotFoundError("Documento no encontrado")
            return DocumentSnapshot(version=version.version_number, content=version.content, permission=permission)

    def save(self, document_id: int, identity: CollaborationIdentity, edit: EditMessage) -> int:
        with self.sessions() as db:
            user_id = self._user_id(db, identity)
            version = DocumentService(DocumentRepository(db)).save(
                document_id,
                DocumentSaveRequest(
                    content=edit.content,
                    base_version=edit.base_version,
                    change_summary="Edición colaborativa",
                ),
                user_id,
            )
            return version.version_number
