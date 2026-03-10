from typing import Iterable
from pprint import pformat
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .util import get_basic_logger
from .models import EnrollmentPayload
from .conf import settings

logger = get_basic_logger(__name__)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LYNX_ROUTES: dict[str, Iterable[str]] = {
    "member_enroll": ["enrollments", "member"],
}


@app.get("/")
async def root():
    logger.info("Hello world!")
    return {"message": "Hello World"}


async def lynx_member_enroll(payload: EnrollmentPayload):
    async with httpx.AsyncClient() as client:
        response = None
        try:
            logger.info(
                f"Sending enrollment to Lynx API at {settings.LYNX_API_BASE_URL} with payload:\n{pformat(payload.model_dump())}"
            )
            url_parts = [settings.LYNX_API_BASE_URL, *(LYNX_ROUTES["member_enroll"])]
            logger.info(str(url_parts))
            url = "/".join(url_parts)
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.LYNX_AUTH_TOKEN}"
            }
            logger.info(f"Requesting from {url} w/ headers:\n{pformat(headers)}")
            response = await client.post(
                url,
                json=payload.model_dump(),
                headers=headers,
            )
            logger.info(
                f"Received response from Lynx API: {response.status_code} - {response.text}"
            )
            response.raise_for_status()
            logger.info("Successfully enrolled member in Lynx")
        except httpx.HTTPError as exc:
            logger.error(f"An error occurred while sending enrollment to Lynx: {exc}")
            return {"error": "Failed to enroll member in Lynx"}
        return (
            response.json()
            if response
            else {"error": "Failed to enroll member in Lynx"}
        )


@app.post("/enroll")
async def enroll(payload: EnrollmentPayload):
    # forward the enrollment payload to the Lynx API
    logger.info(f"Received enrollment payload:\n{pformat(payload.model_dump())}")
    return await lynx_member_enroll(payload)
