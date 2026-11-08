from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.schemas import (
    DocumentCreateRequest,
    DocumentListItem,
    DocumentMemberAccessResponse,
    DocumentPermissionRequest,
    DocumentPermissionResponse,
    DocumentResponse,
    DocumentSaveRequest,
    DocumentVersionResponse,
    PermissionName,
    VersionCompareResponse,
)
from app.modules.documents.service import DocumentService
from app.modules.users.models import User
from app.shared.api_response import ApiResponse
from app.shared.exceptions import ERROR_RESPONSES


router = APIRouter(prefix="/documents", tags=["Documents"], responses=ERROR_RESPONSES)


def build_service(db: Session) -> DocumentService:
    return DocumentService(DocumentRepository(db))


def make_document_response(document, latest, permission: PermissionName):
    return DocumentResponse(
        id=document.id,
        title=document.title,
        space_work_id=document.space_work_id,
        created_by_user_id=document.created_by_user_id,
        created_at=document.created_at,
        updated_at=document.updated_at,
        current_version_number=latest.version_number,
        content=latest.content,
        permission=permission,
    )


@router.post(
    "",
    response_model=ApiResponse[DocumentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Crear documento",
    description="Crea un documento en el espacio del Gestor y registra su versión inicial.",
)
def create_document(
    data: DocumentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = build_service(db)
    try:
        document, version = service.create(data, current_user.id)
        return ApiResponse[DocumentResponse](
            success=True,
            message="Documento creado",
            data=make_document_response(document, version, "admin"),
        )
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error


@router.get(
    "",
    response_model=ApiResponse[list[DocumentListItem]],
    summary="Listar documentos accesibles",
    description="Lista solo documentos del espacio indicado a los que el usuario autenticado tiene acceso.",
)
def list_documents(
    space_work_id: int = Query(gt=0, description="Filtra documentos visibles del espacio indicado"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repository = DocumentRepository(db)
    documents = repository.list_for_user(space_work_id, current_user.id)
    items = []
    for document in documents:
        latest = repository.latest_version(document.id)
        if latest is not None:
            items.append(DocumentListItem(
                id=document.id,
                title=document.title,
                space_work_id=document.space_work_id,
                created_by_user_id=document.created_by_user_id,
                created_at=document.created_at,
                updated_at=document.updated_at,
                current_version_number=latest.version_number,
            ))
    return ApiResponse[list[DocumentListItem]](success=True, message="Documentos accesibles", data=items)


@router.get(
    "/{document_id}",
    response_model=ApiResponse[DocumentResponse],
    summary="Consultar documento",
    description="Devuelve el contenido de la versión más reciente si el usuario tiene acceso al documento.",
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = build_service(db)
    try:
        document, permission = service.get_readable_document(document_id, current_user.id)
        latest = service.repository.latest_version(document.id)
        if latest is None:
            raise LookupError("Documento no encontrado")
        return ApiResponse[DocumentResponse](success=True, message="Documento", data=make_document_response(document, latest, permission))
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.put(
    "/{document_id}",
    response_model=ApiResponse[DocumentVersionResponse],
    summary="Guardar nueva versión",
    description="Guarda el contenido y crea una versión inmutable nueva. Requiere permiso edit o admin.",
)
def save_document(
    document_id: int,
    data: DocumentSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        version = build_service(db).save(document_id, data, current_user.id)
        return ApiResponse[DocumentVersionResponse](success=True, message="Nueva versión guardada", data=version)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error


@router.get(
    "/{document_id}/versions",
    response_model=ApiResponse[list[DocumentVersionResponse]],
    summary="Consultar historial",
    description="Lista las versiones del documento en orden descendente. Requiere acceso de lectura.",
)
def list_versions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = build_service(db)
    try:
        service.get_readable_document(document_id, current_user.id)
        versions = service.repository.list_versions(document_id)
        return ApiResponse[list[DocumentVersionResponse]](success=True, message="Historial de versiones", data=versions)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get(
    "/{document_id}/versions/compare",
    response_model=ApiResponse[VersionCompareResponse],
    summary="Comparar versiones",
    description="Devuelve un diff unificado entre dos versiones del mismo documento.",
)
def compare_versions(
    document_id: int,
    from_version: int = Query(gt=0, description="Número de la versión base"),
    to_version: int = Query(gt=0, description="Número de la versión que se compara"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        unified_diff = build_service(db).compare(document_id, from_version, to_version, current_user.id)
        data = VersionCompareResponse(
            document_id=document_id,
            from_version=from_version,
            to_version=to_version,
            unified_diff=unified_diff,
        )
        return ApiResponse[VersionCompareResponse](success=True, message="Comparación de versiones", data=data)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post(
    "/{document_id}/versions/{version_number}/restore",
    response_model=ApiResponse[DocumentVersionResponse],
    summary="Restaurar versión",
    description="Copia el contenido de una versión anterior en una nueva versión; no modifica el historial existente.",
)
def restore_version(
    document_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        version = build_service(db).restore(document_id, version_number, current_user.id)
        return ApiResponse[DocumentVersionResponse](success=True, message="Versión restaurada como una nueva versión", data=version)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error


@router.get(
    "/{document_id}/permissions",
    response_model=ApiResponse[list[DocumentMemberAccessResponse]],
    summary="Consultar acceso al documento",
    description="Lista los miembros activos del espacio y su acceso al documento. Requiere permiso admin.",
)
def list_document_permissions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    members = build_service(db).list_member_access(document_id, current_user.id)
    return ApiResponse(success=True, message="Acceso al documento", data=members)


@router.put(
    "/{document_id}/permissions/{target_user_id}",
    response_model=ApiResponse[DocumentPermissionResponse],
    summary="Asignar permiso documental",
    description="Asigna read, edit o admin a un miembro activo del espacio. Requiere permiso admin en el documento.",
)
def assign_permission(
    document_id: int,
    target_user_id: int,
    data: DocumentPermissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        assignment = build_service(db).assign_permission(document_id, target_user_id, data, current_user.id)
        return ApiResponse[DocumentPermissionResponse](
            success=True,
            message="Permiso asignado",
            data=DocumentPermissionResponse(
                document_id=assignment.document_id,
                user_id=assignment.user_id,
                permission=data.permission,
                assigned_by_user_id=assignment.assigned_by_user_id,
                assigned_at=assignment.assigned_at,
            ),
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete(
    "/{document_id}/permissions/{target_user_id}",
    response_model=ApiResponse[None],
    summary="Revocar permiso documental",
    description="Quita el permiso del usuario en este documento. Requiere permiso admin en el documento.",
)
def revoke_permission(
    document_id: int,
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    build_service(db).revoke_permission(document_id, target_user_id, current_user.id)
    return ApiResponse[None](success=True, message="Permiso documental revocado")


@router.delete(
    "/{document_id}",
    response_model=ApiResponse[None],
    summary="Eliminar documento",
    description="Marca el documento como eliminado, conserva sus versiones y registra la acción en la bitácora.",
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        build_service(db).delete(document_id, current_user.id)
        return ApiResponse[None](success=True, message="Documento eliminado; el historial se conserva")
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
