import pathlib
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import get_current_user
from .conf import settings
from .db.database import get_db_session
from .db.models import SupportTicket, SupportTicketAttachment, User

router = APIRouter(prefix="/support")


class AttachmentMeta(BaseModel):
    filename: str
    content_type: str


class CreateTicketRequest(BaseModel):
    body: str
    attachments: list[AttachmentMeta] = []


class AttachmentUploadInfo(BaseModel):
    id: int
    upload_url: str


class CreateTicketResponse(BaseModel):
    ticket_id: int
    attachments: list[AttachmentUploadInfo]


@router.post("/tickets")
async def create_ticket(
    payload: CreateTicketRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CreateTicketResponse:
    ticket = SupportTicket(user_id=current_user.id, body=payload.body)
    db.add(ticket)
    await db.flush()

    attachment_infos: list[AttachmentUploadInfo] = []
    for meta in payload.attachments:
        storage_key = f"support/{ticket.id}/{meta.filename}"
        attachment = SupportTicketAttachment(
            ticket_id=ticket.id,
            filename=meta.filename,
            content_type=meta.content_type,
            storage_key=storage_key,
        )
        db.add(attachment)
        await db.flush()

        if settings.ENV == "production":
            upload_url = _s3_presigned_put(storage_key, meta.content_type)
        else:
            base = str(request.base_url).rstrip("/")
            upload_url = f"{base}/support/tickets/{ticket.id}/attachments/{attachment.id}/upload"

        attachment_infos.append(AttachmentUploadInfo(id=attachment.id, upload_url=upload_url))

    await db.commit()
    return CreateTicketResponse(ticket_id=ticket.id, attachments=attachment_infos)


def _s3_presigned_put(key: str, content_type: str) -> str:
    import boto3
    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    return s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=3600,
    )


@router.put("/tickets/{ticket_id}/attachments/{attachment_id}/upload")
async def upload_attachment(
    ticket_id: int,
    attachment_id: int,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Dev-only endpoint: receives raw file bytes and saves to the local uploads folder."""
    attachment = await _get_owned_attachment(ticket_id, attachment_id, current_user.id, db)

    dest = settings.upload_dir_path / attachment.storage_key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(await request.body())

    attachment.uploaded = True
    await db.commit()
    return {"message": "Uploaded"}


@router.post("/tickets/{ticket_id}/attachments/{attachment_id}/confirm")
async def confirm_attachment(
    ticket_id: int,
    attachment_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Called after a direct S3 upload to mark the attachment as uploaded in the DB."""
    attachment = await _get_owned_attachment(ticket_id, attachment_id, current_user.id, db)
    attachment.uploaded = True
    await db.commit()
    return {"message": "Confirmed"}


async def _get_owned_attachment(
    ticket_id: int,
    attachment_id: int,
    user_id: int,
    db: AsyncSession,
) -> SupportTicketAttachment:
    ticket_result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.id == ticket_id)
        .where(SupportTicket.user_id == user_id)
    )
    if not ticket_result.scalar_one_or_none():
        raise HTTPException(404, "Ticket not found")

    att_result = await db.execute(
        select(SupportTicketAttachment)
        .where(SupportTicketAttachment.id == attachment_id)
        .where(SupportTicketAttachment.ticket_id == ticket_id)
    )
    attachment = att_result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(404, "Attachment not found")
    return attachment
