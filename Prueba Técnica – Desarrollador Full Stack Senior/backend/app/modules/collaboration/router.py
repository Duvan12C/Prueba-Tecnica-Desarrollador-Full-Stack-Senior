import asyncio
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, WebSocketException
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from starlette.concurrency import run_in_threadpool

from app.core.database import get_session_factory
from app.modules.collaboration.hub import Connection, collaboration_hub
from app.modules.collaboration.schemas import (
    AuthenticateMessage,
    EditMessage,
    Participant,
    SaveVersionMessage,
    VersionActivity,
    collaboration_message,
)
from app.modules.collaboration.service import CollaborationIdentity, CollaborationService
from app.shared.exceptions import ConflictError, ForbiddenError, ResourceNotFoundError, UnauthorizedError


router = APIRouter(prefix="/documents")
logger = logging.getLogger(__name__)
AUTH_TIMEOUT_SECONDS = 5
RECHECK_SECONDS = 5
MAX_FRAME_BYTES = 2_000_000


async def receive_frame(websocket: WebSocket) -> str:
    message = await websocket.receive()
    if message["type"] == "websocket.disconnect":
        raise WebSocketDisconnect(message["code"])
    frame = message.get("text")
    if frame is None:
        raise WebSocketException(code=1003)
    if len(frame.encode("utf-8")) > MAX_FRAME_BYTES:
        raise WebSocketException(code=1009)
    return frame


async def wait_for_activity(incoming: asyncio.Task[str], connection: Connection) -> bool:
    change = asyncio.create_task(connection.changed.wait())
    try:
        ready, _ = await asyncio.wait(
            (incoming, change), timeout=RECHECK_SECONDS, return_when=asyncio.FIRST_COMPLETED,
        )
        return incoming in ready
    finally:
        change.cancel()
        await asyncio.gather(change, return_exceptions=True)


async def publish_version(
    document_id: int,
    identity: CollaborationIdentity,
    connection: Connection,
    service: CollaborationService,
    message: SaveVersionMessage,
) -> dict:
    snapshot = await run_in_threadpool(service.snapshot, document_id, identity)
    service.require_current_edit(snapshot, message.base_revision)
    if not snapshot.has_unpublished_changes:
        return {"type": "version_published", "version": snapshot.version, "revision": snapshot.revision, "created": False}

    name = identity.participant.name
    collaboration_hub.announce(document_id, connection, VersionActivity(status="saving", name=name))
    try:
        version, created = await run_in_threadpool(service.save_version, document_id, identity, message.base_revision)
    except Exception:
        collaboration_hub.announce(document_id, connection, VersionActivity(status="cancelled", name=name))
        raise
    activity = VersionActivity(status="saved", name=name, version=version) if created else VersionActivity(status="cancelled", name=name)
    collaboration_hub.announce(document_id, connection, activity)
    return {"type": "version_published", "version": version, "revision": snapshot.revision, "created": created}


async def handle_message(
    websocket: WebSocket,
    document_id: int,
    identity: CollaborationIdentity,
    connection: Connection,
    service: CollaborationService,
    frame: str,
) -> None:
    try:
        message = collaboration_message.validate_json(frame)
    except ValidationError:
        await websocket.send_json({"type": "error", "message": "El mensaje de colaboración no es válido"})
        return

    async with collaboration_hub.writing(document_id):
        try:
            if isinstance(message, EditMessage):
                snapshot = await run_in_threadpool(service.edit, document_id, identity, message)
                response = {
                    "type": "draft_synced",
                    "revision": snapshot.revision,
                    "has_unpublished_changes": snapshot.has_unpublished_changes,
                }
            else:
                response = await publish_version(document_id, identity, connection, service, message)
        except ConflictError:
            snapshot = await run_in_threadpool(service.snapshot, document_id, identity)
            response = {"type": "conflict", **snapshot.model_dump()}
        except ForbiddenError as error:
            response = {"type": "error", "message": error.message}
        except SQLAlchemyError:
            logger.exception("Falló una operación colaborativa del documento %s", document_id)
            response = {"type": "error", "message": "No se pudo completar el guardado"}
        else:
            collaboration_hub.notify(document_id)
    await websocket.send_json({**response, "request_id": message.request_id})


async def listen(
    websocket: WebSocket,
    document_id: int,
    identity: CollaborationIdentity,
    connection: Connection,
    service: CollaborationService,
) -> None:
    previous_document: tuple[int, int, str] | None = None
    previous_people: list[Participant] | None = None
    incoming = asyncio.create_task(receive_frame(websocket))
    try:
        while True:
            connection.changed.clear()
            snapshot = await run_in_threadpool(service.snapshot, document_id, identity)
            document_key = (snapshot.version, snapshot.revision, snapshot.permission)
            if document_key != previous_document:
                await websocket.send_json({"type": "document", **snapshot.model_dump()})
                previous_document = document_key

            people = collaboration_hub.participants(document_id)
            if people != previous_people:
                await websocket.send_json({"type": "presence", "participants": [person.model_dump() for person in people]})
                previous_people = people

            while connection.activities:
                await websocket.send_json(connection.activities.popleft().model_dump())

            if await wait_for_activity(incoming, connection):
                frame = incoming.result()
                incoming = asyncio.create_task(receive_frame(websocket))
                await handle_message(websocket, document_id, identity, connection, service, frame)
    finally:
        incoming.cancel()
        await asyncio.gather(incoming, return_exceptions=True)


@router.websocket("/{document_id}/collaboration")
async def collaborate(
    websocket: WebSocket,
    document_id: int,
    sessions: sessionmaker[Session] = Depends(get_session_factory),
):
    await websocket.accept()
    connection = None
    service = CollaborationService(sessions)
    try:
        frame = await asyncio.wait_for(receive_frame(websocket), timeout=AUTH_TIMEOUT_SECONDS)
        message = AuthenticateMessage.model_validate_json(frame)
        identity = await run_in_threadpool(service.authenticate, message.token, document_id)
        connection = collaboration_hub.join(document_id, identity.participant)
        await listen(websocket, document_id, identity, connection, service)
    except WebSocketDisconnect:
        pass
    except (ValidationError, TimeoutError):
        await websocket.close(code=1008)
    except UnauthorizedError:
        await websocket.close(code=4401)
    except ResourceNotFoundError:
        await websocket.close(code=4404)
    except SQLAlchemyError:
        logger.exception("Falló la conexión colaborativa del documento %s", document_id)
        await websocket.close(code=1011)
    finally:
        if connection is not None:
            collaboration_hub.leave(document_id, connection)
