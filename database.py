from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.mongodb_uri)
    return client


def get_db():
    return get_client()[settings.mongodb_db_name]


# Collections
def analyses_collection():
    return get_db()["analyses"]


async def ping_db() -> bool:
    """Health-check the MongoDB connection."""
    try:
        await get_client().admin.command("ping")
        return True
    except Exception:
        return False


async def close_db():
    global client
    if client:
        client.close()
        client = None
