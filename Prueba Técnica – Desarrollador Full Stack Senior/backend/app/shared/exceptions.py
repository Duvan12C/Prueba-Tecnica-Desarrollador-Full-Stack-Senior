from typing import Any

from pydantic import BaseModel, ConfigDict


class AppException(Exception):
    status_code = 400
    code = "application_error"

    def __init__(
        self,
        message: str,
        *,
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.details = details


class BadRequestError(AppException):
    status_code = 400
    code = "bad_request"


class UnauthorizedError(AppException):
    status_code = 401
    code = "unauthorized"


class ForbiddenError(AppException):
    status_code = 403
    code = "forbidden"


class ResourceNotFoundError(AppException):
    status_code = 404
    code = "not_found"


class ConflictError(AppException):
    status_code = 409
    code = "conflict"


class ResourceGoneError(AppException):
    status_code = 410
    code = "resource_expired"


class ValidationIssue(BaseModel):
    field: str
    message: str
    code: str


class ApiErrorResponse(BaseModel):
    success: bool = False
    message: str
    code: str
    details: list[ValidationIssue] | None = None

    model_config = ConfigDict(json_schema_extra={
        "examples": [
            {
                "success": False,
                "message": "No tienes permiso para realizar esta acción",
                "code": "forbidden",
                "details": None,
            }
        ]
    })


ERROR_RESPONSES = {
    400: {"model": ApiErrorResponse, "description": "La solicitud no es válida."},
    401: {"model": ApiErrorResponse, "description": "Se requiere autenticación válida."},
    403: {"model": ApiErrorResponse, "description": "El usuario no tiene permiso para esta acción."},
    404: {"model": ApiErrorResponse, "description": "El recurso no existe o no está disponible."},
    409: {"model": ApiErrorResponse, "description": "La operación entra en conflicto con el estado actual."},
    410: {"model": ApiErrorResponse, "description": "El recurso solicitado expiró."},
    422: {"model": ApiErrorResponse, "description": "Uno o más campos no superaron la validación."},
    500: {"model": ApiErrorResponse, "description": "Ocurrió un error interno."},
}
