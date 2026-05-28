"""MongoDB async client (Motor).

A single lazily-created client is shared across the process. Import
`get_db()` wherever you need a handle to the database; call `close_mongo()`
on shutdown (wired into the FastAPI lifespan).
"""

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


def get_db() -> AsyncIOMotorDatabase:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
        logger.info("MongoDB connected: %s", settings.MONGODB_URI)
    return _client[settings.MONGODB_DB_NAME]


async def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB disconnected")
