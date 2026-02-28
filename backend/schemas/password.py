from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

# Esquema base
class PasswordBase(BaseModel):
    web: str
    user_email: str
    password: str 
    compromised: Optional[bool] = False

# Esquema para creacion
class PasswordCreate(PasswordBase):
    vault_id: Optional[UUID] = None

# Esquema de actualizacion 
class PasswordUpdate(BaseModel):
    web: Optional[str] = None
    user_email: Optional[str] = None
    password: Optional[str] = None
    compromised: Optional[bool] = None

# Esquema de respuesta
class PasswordResponse(PasswordBase):
    passwords_id: int 
    vault_id: UUID

    model_config = ConfigDict(from_attributes=True)
