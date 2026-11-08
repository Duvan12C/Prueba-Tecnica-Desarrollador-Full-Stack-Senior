from app.modules.spaceswork.schemas import (
    SpaceWorkCreateRequest,
    SpaceWorkMemberResponse,
    SpaceWorkMemberSummary,
    SpaceWorkResponse,
)
from app.modules.spaceswork.models import SpaceWork
from app.modules.spaceswork.repository import SpaceWorkRepository
from app.shared.exceptions import ForbiddenError, ResourceNotFoundError


class SpaceWorkService:

    def __init__(self, repository: SpaceWorkRepository):
        self.repository = repository

    def can_create(self, user_id: int) -> bool:
        return self.repository.is_manager(user_id)

    def create_space_work(self, data: SpaceWorkCreateRequest, owner_user_id: int) -> SpaceWorkResponse:

        if not self.can_create(owner_user_id):
            raise ForbiddenError("Solo un Gestor puede crear un espacio de trabajo")

        space_work = SpaceWork(
            name=data.name,
            description=data.description,
            icon_key=data.icon_key.value,
            color_key=data.color_key.value,
            owner_user_id=owner_user_id
        )

        created_space_work = self.repository.create_for_owner(space_work)

        return SpaceWorkResponse.model_validate(created_space_work)

    def list_for_user(self, user_id: int) -> list[SpaceWorkResponse]:
        spaces = self.repository.list_for_user(user_id)
        summaries: dict[int, SpaceWorkMemberSummary] = {}
        for space_id, member_name, member_count in self.repository.list_member_previews(user_id):
            summary = summaries.setdefault(space_id, SpaceWorkMemberSummary(count=member_count, names=[]))
            summary.names.append(member_name)
        return [
            SpaceWorkResponse.model_validate(space).model_copy(update={"member_summary": summaries.get(space.id)})
            for space in spaces
        ]

    def archive(self, space_work_id: int, user_id: int) -> None:
        if not self.repository.is_manager_of_space(space_work_id, user_id, active_only=False):
            raise ForbiddenError("Solo el Gestor propietario puede archivar el espacio")
        self.repository.archive(space_work_id, user_id)

    def list_members(self, space_work_id: int, user_id: int) -> list[SpaceWorkMemberResponse]:
        if not self.repository.can_view_members(space_work_id, user_id):
            raise ResourceNotFoundError("Espacio de trabajo no encontrado")

        members = self.repository.list_active_members(space_work_id)
        return [
            SpaceWorkMemberResponse(
                user_id=member.id,
                name=member.name,
                email=member.email,
                role_name=role.name,
                joined_at=membership.joined_at,
            )
            for member, role, membership in members
        ]

    def remove_member(self, space_work_id: int, member_user_id: int, actor_user_id: int) -> None:
        if not self.repository.is_manager_of_space(space_work_id, actor_user_id):
            raise ForbiddenError("Solo el Gestor propietario puede retirar miembros del espacio")
        self.repository.remove_member(space_work_id, member_user_id, actor_user_id)
