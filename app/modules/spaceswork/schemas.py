from pydantic import BaseModel, EmailStr, ConfigDict


class SpaceWorkCreateRequest(BaseModel):
    name: str
    description: str | None = None


class SpaceWorkResponse(BaseModel):
    id: int
    name: str
    description: str | None
    owner_user_id: int

    model_config = ConfigDict(from_attributes=True)
