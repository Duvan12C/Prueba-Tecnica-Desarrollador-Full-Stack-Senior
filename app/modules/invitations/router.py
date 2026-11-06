from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.modules.users.models import User

from app.modules.invitations.schemas import (
    SpaceWorkInvitationAcceptRequest,
    SpaceWorkInvitationCreateRequest,
    SpaceWorkInvitationResponse
)
from app.modules.invitations.service import SpaceWorkInvitationService
from app.modules.invitations.repository import SpaceWorkInvitationRepository

from app.shared.api_response import ApiResponse


router = APIRouter(
    prefix="/invitations",
    tags=["Invitations"]
)


@router.post("/accept", response_model=ApiResponse[SpaceWorkInvitationResponse])
def accept(
    data: SpaceWorkInvitationAcceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SpaceWorkInvitationService(SpaceWorkInvitationRepository(db))
    try:
        invitation = service.accept_invitation(data.token, current_user)
        return ApiResponse[SpaceWorkInvitationResponse](
            success=True,
            message="Invitación aceptada; ya perteneces al espacio",
            data=invitation,
        )
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except TimeoutError as error:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post(
    "/create",
    response_model=ApiResponse[SpaceWorkInvitationResponse],
    status_code=status.HTTP_201_CREATED
)
def create(
    data: SpaceWorkInvitationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repository = SpaceWorkInvitationRepository(db)
    service = SpaceWorkInvitationService(repository)

    try:
        new_invitation = service.create_invitation(
            data=data,
            invited_by_user_id=current_user.id
        )

        return ApiResponse[SpaceWorkInvitationResponse](
            success=True,
            message="Invitación creada con éxito",
            data=new_invitation
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
