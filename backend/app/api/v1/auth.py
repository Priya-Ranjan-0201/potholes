"""Authentication and authorization endpoints (JWT + Argon2id)."""

from __future__ import annotations

import uuid

from backend.app.api.deps import get_current_user
from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from backend.app.db.session import get_db
from backend.app.models.auth import Role, User, UserRole
from backend.app.schemas.auth import (
    TokenRefreshRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/auth")


def _format_user_response(user: User) -> UserResponse:
    roles = [ur.role.name for ur in user.roles if ur.role]
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        roles=roles,
        created_at=user.created_at,
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
)
async def register(
    req: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Create a new user with Argon2id password and return authentication tokens."""
    # Check duplicate email
    existing_stmt = select(User).where(User.email == req.email.lower())
    if (await db.execute(existing_stmt)).scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists",
        )

    # Ensure role exists
    role_stmt = select(Role).where(Role.name == req.role.lower())
    role = (await db.execute(role_stmt)).scalar_one_or_none()
    if role is None:
        role = Role(name=req.role.lower(), description=f"{req.role.capitalize()} user role")
        db.add(role)
        await db.flush()

    new_user = User(
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        phone=req.phone,
        is_active=True,
        is_verified=True,
    )
    db.add(new_user)
    await db.flush()

    user_role = UserRole(user_id=new_user.id, role_id=role.id)
    db.add(user_role)
    await db.commit()

    # Re-fetch with relations
    user_stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(UserRole.role))
        .where(User.id == new_user.id)
    )
    user = (await db.execute(user_stmt)).scalar_one()

    roles = [role.name]
    access_token = create_access_token(user.id, roles=roles)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=_format_user_response(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login and JWT token issuance",
)
async def login(
    req: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate email and password, returning JWT access and refresh tokens."""
    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(UserRole.role))
        .where(User.email == req.email.lower())
    )
    user = (await db.execute(stmt)).scalar_one_or_none()

    if user is None or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    roles = [ur.role.name for ur in user.roles if ur.role]
    access_token = create_access_token(user.id, roles=roles)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=_format_user_response(user),
    )


@router.post(
    "/refresh",
    summary="Refresh expired access token",
)
async def refresh_token_endpoint(
    req: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Exchange valid refresh token for a new short-lived access token."""
    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type: refresh token required",
        )

    user_id = uuid.UUID(payload["sub"])
    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(UserRole.role))
        .where(User.id == user_id)
    )
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer active",
        )

    roles = [ur.role.name for ur in user.roles if ur.role]
    new_access_token = create_access_token(user.id, roles=roles)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Retrieve details and role permissions of currently authenticated user."""
    return _format_user_response(current_user)
