from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import EnrollmentPayload


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



@app.post("/enroll")
async def enroll(payload: EnrollmentPayload):
    print(f"Enrollment received for member: {payload.clientMemberId}")
    print(f"Payload: {payload.model_dump_json(indent=2)}")
    return {"status": "ok", "client_member_id": payload.clientMemberId}
