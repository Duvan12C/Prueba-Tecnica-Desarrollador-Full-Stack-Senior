from app.modules.spaceswork.schemas import (
    SpaceWorkCreateRequest,
    SpaceWorkResponse
)
from app.modules.spaceswork.models import SpaceWork
from app.modules.spaceswork.repository import SpaceWorkRepository
from app.shared.exceptions import ForbiddenError


class SpaceWorkService:

    def __init__(self, repository: SpaceWorkRepository):
        self.repository = repository

    def create_space_work(self, data: SpaceWorkCreateRequest, owner_user_id: int) -> SpaceWorkResponse:

        if not self.repository.is_manager(owner_user_id):
            raise ForbiddenError("Solo un Gestor puede crear un espacio de trabajo")

        space_work = SpaceWork(
            name=data.name,
            description=data.description,
            owner_user_id=owner_user_id
        )

        created_space_work = self.repository.create_for_owner(space_work)

        return SpaceWorkResponse.model_validate(created_space_work)
