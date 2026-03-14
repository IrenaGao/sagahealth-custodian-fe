import datetime
import secrets
from typing import Annotated

import bcrypt
import pyotp
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import (
    SESSION_EXPIRY_DAYS,
    create_pre_auth_session,
    create_session,
    generate_email_otp,
    get_current_user,
    get_session_by_pre_auth_token,
    verify_email_otp_hash,
)
from .auth_models import (
    EmailOTPLoginResponse,
    EmailOTPVerifyRequest,
    LoginRequest,
    LoginResponse,
    MFADisableRequest,
    MFAEnableRequest,
    MFALoginResponse,
    MFASetupResponse,
    MFAVerifyRequest,
    MFAVerifyResponse,
    UserMeResponse,
)
from .conf import settings
from .email_service import send_email_otp
from .db.database import get_db_session
from .db.models import Session, User

router = APIRouter()


@router.post("/login")
async def login(
    payload: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LoginResponse | EmailOTPLoginResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not bcrypt.checkpw(payload.password.encode(), user.password_hash.encode()):
        raise HTTPException(401, "Invalid credentials")
    if not settings.EMAIL_OTP_ENABLED:
        row = await create_session(user.id, db)
        return LoginResponse(session_token=row.token)
    otp, otp_hash = generate_email_otp()
    row = await create_pre_auth_session(user.id, otp_hash, db)
    send_email_otp(user.email, otp)
    return EmailOTPLoginResponse(pre_auth_token=row.pre_auth_token)


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    authorization: Annotated[str | None, Header()] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    token = authorization.removeprefix("Bearer ")
    await db.execute(delete(Session).where(Session.token == token))
    await db.commit()
    return {"message": "Logged out"}


@router.post("/email-otp/verify")
async def email_otp_verify(
    payload: EmailOTPVerifyRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LoginResponse | MFALoginResponse:
    pre_auth_row = await get_session_by_pre_auth_token(payload.pre_auth_token, db)
    if not pre_auth_row:
        raise HTTPException(401, "Invalid or expired pre-auth token")
    if (
        not pre_auth_row.email_otp_hash
        or not pre_auth_row.email_otp_expires_at
        or pre_auth_row.email_otp_expires_at < datetime.datetime.utcnow()
    ):
        raise HTTPException(401, "Email OTP expired")
    if not verify_email_otp_hash(payload.code, pre_auth_row.email_otp_hash):
        raise HTTPException(400, "Invalid verification code")
    # Mark email OTP as verified by clearing the hash
    pre_auth_row.email_otp_hash = None
    pre_auth_row.email_otp_expires_at = None
    result = await db.execute(select(User).where(User.id == pre_auth_row.user_id))
    user = result.scalar_one()
    if user.mfa_enabled:
        await db.commit()
        return MFALoginResponse(pre_auth_token=pre_auth_row.pre_auth_token)
    # No TOTP — promote to full session
    pre_auth_row.token = secrets.token_urlsafe(32)
    pre_auth_row.expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=SESSION_EXPIRY_DAYS)
    pre_auth_row.pre_auth_token = None
    pre_auth_row.pre_auth_expires_at = None
    await db.commit()
    return LoginResponse(session_token=pre_auth_row.token)


@router.get("/me")
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> UserMeResponse:
    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        mfa_enabled=current_user.mfa_enabled,
        lynx_member_id=current_user.lynx_member_id,
    )


@router.post("/mfa/setup")
async def mfa_setup(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> MFASetupResponse:
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    await db.commit()
    totp = pyotp.TOTP(secret)
    qr_url = totp.provisioning_uri(current_user.email, issuer_name="SagaHealth")
    return MFASetupResponse(totp_secret=secret, qr_code_url=qr_url)


@router.post("/mfa/enable")
async def mfa_enable(
    payload: MFAEnableRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not current_user.totp_secret:
        raise HTTPException(400, "MFA setup not initiated")
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code):
        raise HTTPException(400, "Invalid TOTP code")
    current_user.mfa_enabled = True
    await db.commit()
    return {"message": "MFA enabled"}


@router.post("/mfa/disable")
async def mfa_disable(
    payload: MFADisableRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not current_user.totp_secret:
        raise HTTPException(400, "MFA not configured")
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code):
        raise HTTPException(400, "Invalid TOTP code")
    current_user.mfa_enabled = False
    current_user.totp_secret = None
    await db.commit()
    return {"message": "MFA disabled"}


@router.post("/mfa/verify")
async def mfa_verify(
    payload: MFAVerifyRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> MFAVerifyResponse:
    pre_auth_row = await get_session_by_pre_auth_token(payload.pre_auth_token, db)
    if not pre_auth_row:
        raise HTTPException(401, "Invalid or expired pre-auth token")
    # Ensure email OTP was already verified
    if pre_auth_row.email_otp_hash is not None:
        raise HTTPException(403, "Email verification required before TOTP")
    result = await db.execute(select(User).where(User.id == pre_auth_row.user_id))
    user = result.scalar_one()
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code):
        raise HTTPException(400, "Invalid TOTP code")
    pre_auth_row.token = secrets.token_urlsafe(32)
    pre_auth_row.expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=SESSION_EXPIRY_DAYS)
    pre_auth_row.pre_auth_token = None
    pre_auth_row.pre_auth_expires_at = None
    await db.commit()
    return MFAVerifyResponse(session_token=pre_auth_row.token)
