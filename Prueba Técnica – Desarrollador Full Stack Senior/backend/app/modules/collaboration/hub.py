import asyncio
from collections import deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field

from app.modules.collaboration.schemas import Participant, VersionActivity


@dataclass(eq=False)
class Connection:
    participant: Participant
    changed: asyncio.Event = field(default_factory=asyncio.Event)
    activities: deque[VersionActivity] = field(default_factory=lambda: deque(maxlen=32))


@dataclass
class DocumentRoom:
    connections: set[Connection] = field(default_factory=set)
    write_lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    writers: int = 0


class CollaborationHub:
    def __init__(self):
        self._rooms: dict[int, DocumentRoom] = {}

    def _room(self, document_id: int) -> DocumentRoom:
        room = self._rooms.get(document_id)
        if room is None:
            room = self._rooms[document_id] = DocumentRoom()
        return room

    def _release(self, document_id: int, room: DocumentRoom) -> None:
        if not room.connections and not room.writers:
            del self._rooms[document_id]

    def join(self, document_id: int, participant: Participant) -> Connection:
        connection = Connection(participant)
        self._room(document_id).connections.add(connection)
        self.notify(document_id)
        return connection

    def leave(self, document_id: int, connection: Connection) -> None:
        room = self._rooms[document_id]
        room.connections.remove(connection)
        self.notify(document_id)
        self._release(document_id, room)

    def notify(self, document_id: int) -> None:
        room = self._rooms.get(document_id)
        if room is not None:
            for connection in room.connections:
                connection.changed.set()

    def participants(self, document_id: int) -> list[Participant]:
        people = {peer.participant.user_id: peer.participant for peer in self._rooms[document_id].connections}
        return sorted(people.values(), key=lambda person: (person.name.casefold(), person.user_id))

    def announce(self, document_id: int, sender: Connection, activity: VersionActivity) -> None:
        for connection in self._rooms[document_id].connections:
            if connection is not sender:
                connection.activities.append(activity)
                connection.changed.set()

    @asynccontextmanager
    async def writing(self, document_id: int):
        room = self._room(document_id)
        room.writers += 1
        try:
            async with room.write_lock:
                yield
        finally:
            room.writers -= 1
            self._release(document_id, room)


collaboration_hub = CollaborationHub()
