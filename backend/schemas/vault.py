from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


# Esquema base
class VaultBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


# Esquema para crear un cofre
class VaultCreate(VaultBase):
    pass


# Esquema para actualizar
class VaultUpdate(VaultBase):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


# Esquema de respuesta
class VaultResponse(VaultBase):
    vault_id: UUID
    user_id: UUID
    timestamp: datetime
    is_default: bool = False

    model_config = ConfigDict(from_attributes=True)
