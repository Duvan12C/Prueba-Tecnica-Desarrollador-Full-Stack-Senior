from pydantic import BaseModel, ConfigDict, Field


class SpaceWorkCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150, description="Nombre del espacio de trabajo")
    description: str | None = Field(default=None, description="Descripción opcional del espacio")


class SpaceWorkResponse(BaseModel):
    id: int
    name: str
    description: str | None
    owner_user_id: int

    model_config = ConfigDict(from_attributes=True)
