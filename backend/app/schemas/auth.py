"""Pydantic schemas for authentication and user management."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """User registration payload."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    role: str = Field(default="citizen", pattern="^(citizen|engineer|contractor|admin)$")


class UserLoginRequest(BaseModel):
    """Credentials for login."""

    email: EmailStr
    password: str


class TokenRefreshRequest(BaseModel):
    """Token refresh payload."""

    refresh_token: str


class UserResponse(BaseModel):
    """Public user profile information."""

    id: uuid.UUID
    email: str
    full_name: str
    phone: str | None = None
    is_active: bool
    is_verified: bool
    roles: list[str]
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT authorization tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

