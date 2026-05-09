"""/api/auth router."""
from fastapi import APIRouter, Body, Depends, Header
from pydantic import BaseModel, EmailStr

from core.exceptions import ok_envelope
from core.security import current_user
from services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class ChangePwdIn(BaseModel):
    old_password: str
    new_password: str


@router.post("/login")
async def login(payload: LoginIn):
    data = await auth_service.login(payload.email, payload.password)
    return ok_envelope(data)


@router.post("/refresh")
async def refresh(payload: RefreshIn):
    data = await auth_service.refresh_session(payload.refresh_token)
    return ok_envelope(data)


@router.post("/logout")
async def logout(payload: RefreshIn | None = Body(default=None), user: dict = Depends(current_user)):
    await auth_service.logout(user["id"], payload.refresh_token if payload else None)
    return ok_envelope({"message": "Logged out"})


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return ok_envelope(await auth_service.me(user))


@router.post("/change-password")
async def change_pwd(payload: ChangePwdIn, user: dict = Depends(current_user)):
    await auth_service.change_password(user["id"], payload.old_password, payload.new_password)
    return ok_envelope({"message": "Password changed"})


# --------------- Sprint C: Google OAuth & Email Verification Scaffolding ---------------

@router.get("/google/login")
async def google_login_initiate(redirect_uri: str):
    """**PLACEHOLDER**: Initiate Google OAuth2 flow.
    Returns authorization_url untuk redirect user ke Google.
    Implementasi nyata memerlukan Google OAuth2 credentials."""
    import logging
    logging.getLogger("aurora.auth").info("[SCAFFOLD] Google OAuth login initiated")
    return ok_envelope({
        "authorization_url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id=PLACEHOLDER&redirect_uri={redirect_uri}&scope=email+profile",
        "note": "Placeholder - implementasi nyata memerlukan GOOGLE_OAUTH_CLIENT_ID",
        "scaffold": True,
    })


@router.post("/google/callback")
async def google_callback(payload: dict):
    """**PLACEHOLDER**: Handle Google OAuth2 callback.
    Exchange authorization code untuk JWT token.
    Implementasi nyata akan fetch user dari Google API dan generate JWT."""
    import logging
    code = payload.get("code")
    if not code:
        from core.exceptions import ValidationError
        raise ValidationError("Missing authorization code")
    
    logging.getLogger("aurora.auth").info("[SCAFFOLD] Google OAuth callback received")
    return ok_envelope({
        "token": "PLACEHOLDER_JWT_TOKEN",
        "user": {"id": "google-user-placeholder", "email": "placeholder@example.com", "name": "Google User", "provider": "google", "verified": True},
        "note": "Placeholder - implementasi nyata akan exchange code dengan Google",
        "scaffold": True,
    })


@router.post("/send-verification-email")
async def send_verification_email(payload: dict):
    """**PLACEHOLDER**: Send email verification link.
    Implementasi nyata memerlukan email service (SendGrid/AWS SES)."""
    import logging
    email = payload.get("email")
    logging.getLogger("aurora.auth").info("[SCAFFOLD] Email verification requested for %s", email)
    return ok_envelope({
        "success": True,
        "message": f"Email verifikasi dikirim ke {email} (placeholder)",
        "note": "Placeholder - implementasi nyata memerlukan EMAIL_SERVICE_API_KEY",
        "scaffold": True,
    })


@router.get("/verify-email")
async def verify_email(token: str):
    """**PLACEHOLDER**: Verify email dengan token dari link.
    Implementasi nyata akan validate token dan update database."""
    import logging
    from core.exceptions import ValidationError
    if not token or len(token) < 10:
        raise ValidationError("Invalid verification token")
    
    logging.getLogger("aurora.auth").info("[SCAFFOLD] Email verification attempt")
    return ok_envelope({
        "verified": True,
        "message": "Email berhasil diverifikasi (placeholder)",
        "note": "Placeholder - implementasi nyata akan validate token dan update DB",
        "scaffold": True,
    })


@router.get("/oauth/status")
async def oauth_status():
    """Dev endpoint untuk check OAuth scaffolding status."""
    return ok_envelope({
        "google_oauth": {"scaffolded": True, "endpoints": ["GET /api/auth/google/login", "POST /api/auth/google/callback"], "required_env": ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"]},
        "email_verification": {"scaffolded": True, "endpoints": ["POST /api/auth/send-verification-email", "GET /api/auth/verify-email"], "required_env": ["EMAIL_SERVICE_API_KEY", "EMAIL_FROM_ADDRESS"]},
    })
