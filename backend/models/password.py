from sqlalchemy import String, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from database import Base

class Password(Base):
    __tablename__ = "passwords"

    passwords_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    web: Mapped[str] = mapped_column(String(255), nullable=False)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)

    password: Mapped[str] = mapped_column(String, nullable=False)

    compromised: Mapped[bool] = mapped_column(Boolean, default=False)

    vault_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vaults.vault_id", ondelete="CASCADE"), nullable=False)

    vault: Mapped["Vault"] = relationship(back_populates="passwords")
