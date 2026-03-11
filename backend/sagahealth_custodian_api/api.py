from pprint import pformat
from typing import Iterable, Annotated, Any, cast
import httpx
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete

from .auth import get_current_user
from .db.database import get_db_session
from .db.models import User
from .models import EnrollmentPayload, UserRegistration, UserEnrollmentPayload, UserDeletePayload
from .util import get_basic_logger, StrEnum
from .conf import settings

logger = get_basic_logger(__name__)
router = APIRouter()


LYNX_ROUTES: dict[str, Iterable[str]] = {
    "member_enroll": ["enrollments", "member"],
    "member_delete": ["members", "status"]
}

class Method(StrEnum):
    GET = "get"
    PUT = "put"
    POST = "post"
    PATCH = "patch"
    DELETE = "delete"


async def lynx_req(method: Method | str, lynx_route: str, payload: dict[str, Any] | None = None, params: dict[str, Any] | None = None):
    if not isinstance(method, Method):
        method = Method[method.lower()]
    url = "/".join([settings.LYNX_API_BASE_URL, *(LYNX_ROUTES[lynx_route])])
    async with httpx.AsyncClient() as client:
        response = None
        try:
            logger.info(
                f"Sending request for Lynx API to {url} with payload:\n{pformat(payload or params)}"
            )
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.LYNX_AUTH_TOKEN}"
            }
            response = cast(httpx.Response, await client.request(
                method.value.upper(),
                url,
                json=payload,
                params=params,
                headers=headers,
            ))
            logger.info(
                f"Received response from Lynx API: {response.status_code} - {response.text}"
            )
            response.raise_for_status()
            logger.info("Successfully enrolled member in Lynx")
        except Exception:
            logger.exception(f"An error occurred while sending request to Lynx.")
            return {"error": "Failed to complete Lynx request."}
        return (
            response.json()
            if response
            else {"error": "Failed to complete Lynx request"}  # this shouldn't happen hopefully, or else it fails silently.
        )

async def delete_lynx_member(payload: UserDeletePayload):
    return await lynx_req(Method.DELETE, "member_delete", params=payload.model_dump())

async def enroll_lynx_member(payload: EnrollmentPayload):
    return await lynx_req(Method.POST, "member_enroll", payload=payload.model_dump())

async def register_saga_user(user_info: UserRegistration, session: Annotated[AsyncSession, Depends(get_db_session)]):
    password_hash = bcrypt.hashpw(user_info.password.encode('utf-8'), bcrypt.gensalt(rounds=16)).decode('utf-8')
    await session.execute(
        insert(User).values(
            email=user_info.email,
            password_hash=password_hash,
            lynx_member_id=user_info.member_id
    ))

async def delete_saga_user(payload: UserDeletePayload, session: Annotated[AsyncSession, Depends(get_db_session)]):
    await session.execute(delete(User).where(User.lynx_member_id==payload.clientMemberId))  # TODO: Should also check clientOrgId


@router.post("/enroll")
async def enroll(payload: UserEnrollmentPayload, session: Annotated[AsyncSession, Depends(get_db_session)]):
    # TODO: async these in a reasonable way.
    async with session.begin():
        await register_saga_user(payload.user_info, session)
        lynx_response = await enroll_lynx_member(payload.enrollment)
        await session.commit()
    return lynx_response


@router.delete("/member")
async def delete_member(
    payload: UserDeletePayload,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if current_user.lynx_member_id != payload.clientMemberId:
        raise HTTPException(403, "Cannot delete another user's account")
    async with session.begin():
        await delete_saga_user(payload, session)
        await delete_lynx_member(payload)
        await session.commit()
