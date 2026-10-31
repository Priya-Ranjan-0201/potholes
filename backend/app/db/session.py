"""Database session and connection management."""

from collections.abc import AsyncGenerator
from typing import Any

from backend.app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Async engine for FastAPI request handling
# NullPool avoids event-loop boundary errors with asyncpg during testing and local dev
engine_kwargs: dict[str, Any] = {"echo": settings.DEBUG}
if settings.ENVIRONMENT in ("development", "test"):
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs.update({"pool_pre_ping": True, "pool_size": 10, "max_overflow": 20})

async_engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    **engine_kwargs,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Synchronous engine for migrations and sync scripts
sync_engine = create_engine(
    settings.SYNC_DATABASE_URI,
    pool_pre_ping=True,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding an asynchronous database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
