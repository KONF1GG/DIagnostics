from fastapi import APIRouter, HTTPException, Depends

from app import crud
from app.depencies import SessionDependency, TokenDependency
from app.schemas import ItemId, CreateRole
from app.models import User, Role

router = APIRouter()


@router.post('/v1/role', response_model=ItemId)
async def create_role(role_data: CreateRole, session: SessionDependency, token: TokenDependency):

    """Эндпоинт для создания новой роли"""

    current_user_id = token.user_id
    current_user = await crud.get_item(session, User, current_user_id)
    if current_user.role_id != 1:  # role: admin
        raise HTTPException(status_code=403, detail="Only admins can create roles")
    else:
        role = Role(**role_data.dict())
        role = await crud.add_item(session, role)
        return {'id': role.id}
