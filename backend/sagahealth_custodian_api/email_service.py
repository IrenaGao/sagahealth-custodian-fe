import resend

from .conf import settings

FROM_ADDRESS = "SagaHealth <support@mysagahealth.com>"


def send_email_otp(to_email: str, otp: str) -> None:
    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send({
        "from": FROM_ADDRESS,
        "to": [to_email],
        "subject": "Your SagaHealth verification code",
        "html": f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a5c38;">SagaHealth Verification Code</h2>
            <p>Use the code below to complete your sign-in. It expires in 10 minutes.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                        color: #1a5c38; padding: 16px 0;">{otp}</div>
            <p style="color: #666; font-size: 13px;">
                If you did not request this code, please ignore this email.
            </p>
        </div>
        """,
    })
