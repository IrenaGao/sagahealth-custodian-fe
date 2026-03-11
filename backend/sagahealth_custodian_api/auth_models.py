from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    session_token: str


class MFALoginResponse(BaseModel):
    mfa_required: bool = True
    pre_auth_token: str


class MFAVerifyRequest(BaseModel):
    pre_auth_token: str
    code: str


class MFAVerifyResponse(BaseModel):
    session_token: str


class MFASetupResponse(BaseModel):
    totp_secret: str
    qr_code_url: str


class MFAEnableRequest(BaseModel):
    code: str


class MFADisableRequest(BaseModel):
    code: str


class UserMeResponse(BaseModel):
    id: int
    email: str
    mfa_enabled: bool
    lynx_member_id: str
