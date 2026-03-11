from typing import Iterable
from pprint import pformat
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .util import get_basic_logger
from .models import EnrollmentPayload, UserRegistration, UserEnrollmentPayload
from .db.models import User
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
    url = "/".join([settings.LYNX_API_BASE_URL, *(LYNX_ROUTES["member_enroll"])])
    async with httpx.AsyncClient() as client:
        response = None
        try:
            logger.info(
                f"Sending enrollment to Lynx API to {url} with payload:\n{pformat(payload.model_dump())}"
            )
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.LYNX_AUTH_TOKEN}"
            }
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
        except Exception:
            logger.exception(f"An error occurred while sending enrollment to Lynx.")
            return {"error": "Failed to enroll member in Lynx"}
        return (
            response.json()
            if response
            else {"error": "Failed to enroll member in Lynx"}  # this shouldn't happen hopefully, or else it fails silently.
        )

async def register_user(user_info: UserRegistration):
    session


@app.post("/enroll")
async def enroll(payload: UserEnrollmentPayload):
    # TODO: async these in a reasonable way.
    # Do any pre-lynx business logic here
    lynx_response = await lynx_member_enroll(payload.enrollment)
    # Do any post lynx response business logic here
    registration_result = await register_user(payload.user_info)
    return lynx_response

