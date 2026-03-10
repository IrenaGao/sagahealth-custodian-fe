from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    print("Hello world!")
    return {"message": "Hello World"}


class EnrollmentPayload(BaseModel):
    model_config = {"extra": "allow"}

    client_member_id: str | None = None
    client_org: dict[str, Any] | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    dob: str | None = None
    ssn: str | None = None
    address: dict[str, str | None] | None = None
    plan_type: str | None = None


@app.post("/enroll")
async def enroll(payload: EnrollmentPayload):
    print(f"Enrollment received for member: {payload.client_member_id}")
    return {"status": "ok", "client_member_id": payload.client_member_id}
