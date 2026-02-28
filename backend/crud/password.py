from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID

from models.password import Password
from schemas.password import PasswordCreate, PasswordUpdate

def get_vault_passwords(db: Session, vault_id: UUID) -> list[Password]:
    """Obtiene las contraseñas de una bóveda específica."""
    stmt = select(Password).where(Password.vault_id == vault_id)
    return list(db.execute(stmt).scalars().all())

def get_password(db: Session, password_id: UUID) -> Password | None:
    """Obtiene el detalle de una sola contraseña."""
    stmt = select(Password).where(Password.passwords_id == password_id)
    return db.execute(stmt).scalars().first()

def create_password(db: Session, password_in: PasswordCreate) -> Password:
    """Guarda el ciphertext de una contraseña nueva en la base de datos."""
    db_pwd = Password(
        web=password_in.web,
        user_email=password_in.user_email,
        password=password_in.password,
        compromised=password_in.compromised,
        vault_id=password_in.vault_id
    )
    db.add(db_pwd)
    db.commit()
    db.refresh(db_pwd)
    return db_pwd

def update_password(db: Session, password_id: UUID, password_in: PasswordUpdate) -> Password | None:
    """Actualiza una contraseña existente."""
    db_pwd = get_password(db, password_id)
    if not db_pwd:
        return None
        
    update_data = password_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pwd, key, value)
        
    db.commit()
    db.refresh(db_pwd)
    return db_pwd

def delete_password(db: Session, password_id: UUID) -> bool:
    """Elimina la contraseña."""
    db_pwd = get_password(db, password_id)
    if not db_pwd:
        return False
        
    db.delete(db_pwd)
    db.commit()
    return True
