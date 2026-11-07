import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.shared.exceptions import ApiErrorResponse, AppException, ValidationIssue


logger = logging.getLogger("docspace.api")


def _error_response(
    status_code: int,
    message: str,
    code: str,
    details: list[dict[str, Any]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    payload = ApiErrorResponse(
        message=message,
        code=code,
        details=details,
    )
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(payload, exclude_none=True),
        headers=headers,
    )


async def handle_app_exception(_request: Request, error: AppException) -> JSONResponse:
    return _error_response(
        error.status_code,
        error.message,
        error.code,
        error.details,
    )


async def handle_http_exception(_request: Request, error: StarletteHTTPException) -> JSONResponse:
    message = error.detail if isinstance(error.detail, str) else "La solicitud no pudo procesarse"
    code_by_status = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        410: "resource_expired",
    }
    return _error_response(
        error.status_code,
        message,
        code_by_status.get(error.status_code, "http_error"),
        headers=error.headers,
    )


async def handle_validation_exception(_request: Request, error: RequestValidationError) -> JSONResponse:
    details = [
        ValidationIssue(
            field=".".join(str(part) for part in item.get("loc", ())),
            message=item.get("msg", "Valor no válido"),
            code=item.get("type", "validation_error"),
        ).model_dump()
        for item in error.errors()
    ]
    return _error_response(
        422,
        "La solicitud contiene campos no válidos",
        "validation_error",
        details,
    )


async def handle_database_exception(_request: Request, error: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database operation failed", exc_info=error)
    return _error_response(500, "No se pudo completar la operación de datos", "database_error")


async def handle_unexpected_exception(_request: Request, error: Exception) -> JSONResponse:
    logger.exception("Unhandled API exception", exc_info=error)
    return _error_response(500, "Ocurrió un error interno", "internal_error")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, handle_app_exception)
    app.add_exception_handler(RequestValidationError, handle_validation_exception)
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    app.add_exception_handler(SQLAlchemyError, handle_database_exception)
    app.add_exception_handler(Exception, handle_unexpected_exception)
