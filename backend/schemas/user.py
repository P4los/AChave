from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserCreate(BaseModel):
    """Fase 1: El usuario envía email + password_login para registrarse."""
    email: EmailStr
    password: str = Field(min_length=8, description="Contraseña de login (NO es la Master Password)")

class UserLogin(BaseModel):
    """Login: El usuario se autentica con email + password_login."""
    email: EmailStr
    password: str

class CryptoSetup(BaseModel):
    """
    El frontend genera las llaves localmente con la Master Password
    y envía los artefactos cifrados al backend para su almacenamiento opaco.
    """
    validador_cifrado: str = Field(description="AES(Master Password, 'SESAMO_ABIERTO')")
    llave_publica: str = Field(description="Llave publica en texto plano")
    llave_privada_cifrada: str = Field(description="Llave privada cifrada con la Master Password")

class UserResponse(BaseModel):
    """Respuesta publica tras registro. No incluye datos sensibles."""
    user_id: UUID
    email: EmailStr
    is_verified: bool
    timestamp: datetime
    token_type: Optional[str] = "Bearer"
    access_token: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    """
    Respuesta tras login exitoso.
    Incluye JWT + paquete criptografico para que el frontend
    pueda validar la Master Password localmente.
    """
    user_id: UUID
    email: EmailStr
    is_verified: bool
    token_type: str = "Bearer"
    access_token: str
    # Paquete criptografico Zero-Knowledge
    validador_cifrado: Optional[str] = None
    llave_privada_cifrada: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserMeResponse(BaseModel):
    """GET /auth/me — Devuelve el perfil y datos criptográficos del usuario autenticado."""
    user_id: UUID
    email: EmailStr
    is_verified: bool
    timestamp: datetime
    validador_cifrado: Optional[str] = None
    llave_publica: Optional[str] = None
    llave_privada_cifrada: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
