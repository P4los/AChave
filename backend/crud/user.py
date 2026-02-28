from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID

from models.user import User
from models.vault import Vault
from schemas.user import UserCreate, CryptoSetup
from utils.security import get_password_hash

def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalars().first()

def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    stmt = select(User).where(User.user_id == user_id)
    return db.execute(stmt).scalars().first()

def create_user(db: Session, user_in: UserCreate) -> User:
    """
    Fase 1: Solo guarda el email. Sin password, sin bóveda.
    """
    db_user = User(
        email=user_in.email,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_user(db: Session, user_id: UUID) -> User | None:
    """
    Fase 2: Marca is_verified=True y crea la bóveda por defecto.
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    if db_user.is_verified:
        return db_user

    db_user.is_verified = True

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
    Fase 3: Hashea la Master Password para login futuro
    y guarda el paquete criptográfico Zero-Knowledge como TEXT opaco.
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    # Hashear la Master Password con bcrypt para autenticación futura
    db_user.hashed_password = get_password_hash(crypto_in.password)

    # Guardar paquete criptográfico (el backend NUNCA descifra esto)
    db_user.validador_cifrado = crypto_in.validador_cifrado
    db_user.llave_publica = crypto_in.llave_publica
    db_user.llave_privada_cifrada = crypto_in.llave_privada_cifrada

    db.commit()
    db.refresh(db_user)
    return db_user
