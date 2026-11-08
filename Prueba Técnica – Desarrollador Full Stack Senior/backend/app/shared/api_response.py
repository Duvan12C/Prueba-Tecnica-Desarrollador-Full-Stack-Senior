from typing import TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: T | None = None


class PaginationMeta(BaseModel):
    total: int
    limit: int
    offset: int


class PaginatedApiResponse(ApiResponse[list[T]], Generic[T]):
    pagination: PaginationMeta
