from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# ─────────────────────────────────────────────
# REGISTRO (Self-Hosted: email + password + crypto en un paso)
# ─────────────────────────────────────────────

class UserCreate(BaseModel):
    """Self-Hosted: Email + Master Password + paquete criptográfico completo."""
    email: EmailStr
    password: str = Field(min_length=8, description="Master Password para login y cifrado")
    validador_cifrado: str = Field(description="AES(Master Password, 'SESAMO_ABIERTO')")
    llave_publica: str = Field(description="Llave pública en texto plano")
    llave_privada_cifrada: str = Field(description="Llave privada cifrada con la Master Password")

# ─────────────────────────────────────────────
# SETUP CRYPTO (mantenido por compatibilidad interna)
# ─────────────────────────────────────────────

class CryptoSetup(BaseModel):
    """Paquete criptográfico Zero-Knowledge."""
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
    """Respuesta tras registro."""
    user_id: UUID
    email: EmailStr
    is_verified: bool
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    """Respuesta tras login o registro: JWT + paquete criptográfico."""
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
