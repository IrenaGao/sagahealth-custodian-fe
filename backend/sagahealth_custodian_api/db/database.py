from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from ..conf import settings

engine = create_async_engine(settings.DB_SCHEME)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db_session():
    async with AsyncSessionLocal() as session:
        yield session
        await session.close()
