from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID

from models.user import User
from models.vault import Vault
from schemas.user import UserCreate, CryptoSetup
from utils.security import get_password_hash

def get_user_by_email(db: Session, email: str) -> User | None:
    """Busca un usuario por su email."""
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalars().first()

def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    """Busca un usuario por su UUID."""
    stmt = select(User).where(User.user_id == user_id)
    return db.execute(stmt).scalars().first()

def create_user(db: Session, user_in: UserCreate) -> User:
    """
    Fase 1: Crea el usuario con is_verified=False.
    La bóveda por defecto se crea DESPUÉS de la verificación del email.
    """
    hashed_password = get_password_hash(user_in.password)
    
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_user(db: Session, user_id: UUID) -> User | None:
    """
    Marca al usuario como verificado y crea su bóveda por defecto.
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    if db_user.is_verified:
        return db_user
    
    db_user.is_verified = True
    
    # Creacion de vault por defecto
    default_vault = Vault(
        name="Bóveda Principal",
        description="Bóveda por defecto. No se puede eliminar.",
        user_id=db_user.user_id,
        is_default=True
    )
    db.add(default_vault)
    db.commit()
    db.refresh(db_user)
    return db_user

def setup_crypto(db: Session, user_id: UUID, crypto_in: CryptoSetup) -> User | None:
    """
    Almacena el paquete criptográfico Zero-Knowledge.
    No aplica logica de descifrado sobre ellos.
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    db_user.validador_cifrado = crypto_in.validador_cifrado
    db_user.llave_publica = crypto_in.llave_publica
    db_user.llave_privada_cifrada = crypto_in.llave_privada_cifrada
    
    db.commit()
    db.refresh(db_user)
    return db_user
