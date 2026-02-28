from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# ─────────────────────────────────────────────
# FASE 1: Registro (solo email)
# ─────────────────────────────────────────────

class UserCreate(BaseModel):
    """Fase 1: Solo el email. Sin password."""
    email: EmailStr

# ─────────────────────────────────────────────
# FASE 3: Setup Master Password + Cripto
# ─────────────────────────────────────────────

class CryptoSetup(BaseModel):
    """
    Fase 3 (post-verificación): El usuario define su Master Password
    y el frontend envía su paquete criptográfico.
    La Master Password se hashea para login futuro.
    """
    password: str = Field(min_length=8, description="Master Password para login y cifrado")
    validador_cifrado: str = Field(description="AES(Master Password, 'SESAMO_ABIERTO')")
    llave_publica: str = Field(description="Llave pública en texto plano")
    llave_privada_cifrada: str = Field(description="Llave privada cifrada con la Master Password")

# ─────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────

class UserLogin(BaseModel):
    """Login: email + Master Password."""
    email: EmailStr
    password: str

# ─────────────────────────────────────────────
# RESPUESTAS
# ─────────────────────────────────────────────

class UserResponse(BaseModel):
    """Respuesta tras registro (solo email, sin datos sensibles)."""
    user_id: UUID
    email: EmailStr
    is_verified: bool
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    """Respuesta tras login: JWT + paquete criptográfico."""
    user_id: UUID
    email: EmailStr
    is_verified: bool
    token_type: str = "Bearer"
    access_token: str
    validador_cifrado: Optional[str] = None
    llave_privada_cifrada: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserMeResponse(BaseModel):
    """GET /auth/me — Perfil + datos criptográficos."""
    user_id: UUID
    email: EmailStr
    is_verified: bool
    timestamp: datetime
    validador_cifrado: Optional[str] = None
    llave_publica: Optional[str] = None
    llave_privada_cifrada: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
