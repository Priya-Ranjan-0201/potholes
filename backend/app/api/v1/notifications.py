"""Notifications API endpoints for user and field alerts."""

from __future__ import annotations

import uuid
from typing import Any

from backend.app.db.session import get_db
from backend.app.models.analytics import Notification
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    channel: str
    is_read: bool
    created_at: str


class NotificationCreateRequest(BaseModel):
    user_id: uuid.UUID
    title: str
    message: str
    channel: str = "IN_APP"


@router.get(
    "/notifications",
    response_model=list[NotificationResponse],
    summary="List active alerts and notifications",
)
async def list_notifications(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieve all notifications."""
    stmt = select(Notification).order_by(Notification.created_at.desc()).limit(50)
    res = await db.execute(stmt)
    notifs = res.scalars().all()

    return [
        {
            "id": str(n.id),
            "user_id": str(n.user_id),
            "title": n.title,
            "message": n.message,
            "channel": n.channel,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else "",
        }
        for n in notifs
    ]


@router.post(
    "/notifications",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch a new notification",
)
async def create_notification(
    req: NotificationCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new notification alert."""
    notif = Notification(
        user_id=req.user_id,
        title=req.title,
        message=req.message,
        channel=req.channel,
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    return {
        "id": str(notif.id),
        "user_id": str(notif.user_id),
        "title": notif.title,
        "message": notif.message,
        "channel": notif.channel,
        "is_read": notif.is_read,
        "created_at": notif.created_at.isoformat() if notif.created_at else "",
    }


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Mark a notification as read."""
    notif = await db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)

    return {
        "id": str(notif.id),
        "user_id": str(notif.user_id),
        "title": notif.title,
        "message": notif.message,
        "channel": notif.channel,
        "is_read": notif.is_read,
        "created_at": notif.created_at.isoformat() if notif.created_at else "",
    }
