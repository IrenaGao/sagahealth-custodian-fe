import datetime
import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .db.database import get_db_session
from .db.models import Session, User

SESSION_EXPIRY_DAYS = 30
PRE_AUTH_EXPIRY_MINUTES = 5


async def create_session(user_id: int, db: AsyncSession) -> Session:
    row = Session(
        user_id=user_id,
        token=secrets.token_urlsafe(32),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=SESSION_EXPIRY_DAYS),
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def create_pre_auth_session(user_id: int, db: AsyncSession) -> Session:
    row = Session(
        user_id=user_id,
        pre_auth_token=secrets.token_urlsafe(32),
        pre_auth_expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=PRE_AUTH_EXPIRY_MINUTES),
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def get_session_by_token(token: str, db: AsyncSession) -> Session | None:
    result = await db.execute(select(Session).where(Session.token == token))
    row = result.scalar_one_or_none()
    if row and row.expires_at and row.expires_at > datetime.datetime.utcnow():
        return row
    return None


async def get_session_by_pre_auth_token(pre_auth_token: str, db: AsyncSession) -> Session | None:
    result = await db.execute(select(Session).where(Session.pre_auth_token == pre_auth_token))
    row = result.scalar_one_or_none()
    if row and row.pre_auth_expires_at and row.pre_auth_expires_at > datetime.datetime.utcnow():
        return row
    return None


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ")
    session_row = await get_session_by_token(token, db)
    if not session_row:
        raise HTTPException(401, "Invalid or expired session")
    result = await db.execute(select(User).where(User.id == session_row.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")
    return user
