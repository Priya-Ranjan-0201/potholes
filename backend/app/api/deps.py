"""Authentication and Role-Based Access Control (RBAC) dependencies."""

from __future__ import annotations

import uuid
from collections.abc import Callable

from backend.app.core.security import decode_token
from backend.app.db.session import get_db
from backend.app.models.auth import User, UserRole
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate Bearer token and retrieve the authenticated user."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type: access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(UserRole.role))
        .where(User.id == user_uuid)
    )
    user = (await db.execute(stmt)).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_optional_user(
    token: str | None = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Validate Bearer token if present; return None if unauthenticated."""
    if not token:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except Exception:
        return None


def require_role(allowed_roles: list[str]) -> Callable[[User], User]:
    """Dependency factory checking user has one of the allowed roles."""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = [ur.role.name.lower() for ur in current_user.roles if ur.role]
        # Superuser / admin always passes
        if "admin" in user_role_names:
            return current_user

        if not any(r.lower() in user_role_names for r in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
