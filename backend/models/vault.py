from sqlalchemy import String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import List
import uuid

from database import Base

class Vault(Base):
    __tablename__ = "vaults"

    vault_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    icon: Mapped[str] = mapped_column(String(255), nullable=True)
    color: Mapped[str] = mapped_column(String(50), nullable=True)

    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    owner: Mapped["User"] = relationship(back_populates="vaults")
    passwords: Mapped[List["Password"]] = relationship(back_populates="vault", cascade="all, delete-orphan")
