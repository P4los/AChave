from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import List, Optional
import uuid

from database import Base

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    # Hash bcrypt de la Master Password (NULL hasta que el usuario complete la Fase 3)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Verificación de email
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Paquete Criptográfico Zero-Knowledge (se rellena en Fase 3)
    validador_cifrado: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    llave_publica: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    llave_privada_cifrada: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Sesión JWT
    token_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vaults: Mapped[List["Vault"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
