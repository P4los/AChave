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
    Self-Hosted: Crea usuario completo en un solo paso.
    - Marcado como verificado automáticamente
    - Master Password hasheada con bcrypt
    - Paquete criptográfico ZK guardado
    - Cofre por defecto creado
    """
    db_user = User(
        email=user_in.email,
        is_verified=True,  # Self-hosted: sin verificación de email
        hashed_password=get_password_hash(user_in.password),
        validador_cifrado=user_in.validador_cifrado,
        llave_publica=user_in.llave_publica,
        llave_privada_cifrada=user_in.llave_privada_cifrada,
    )
    db.add(db_user)
    db.flush()  # Para obtener el user_id antes del commit

    # Crear cofre por defecto
    default_vault = Vault(
        name="Cofre Principal",
        description="Cofre por defecto. No se puede eliminar.",
        user_id=db_user.user_id,
        is_default=True
    )
    db.add(default_vault)
    db.commit()
    db.refresh(db_user)
    return db_user

def setup_crypto(db: Session, user_id: UUID, crypto_in: CryptoSetup) -> User | None:
    """
    Actualiza el paquete criptográfico de un usuario existente.
    Mantenido por compatibilidad.
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    db_user.hashed_password = get_password_hash(crypto_in.password)
    db_user.validador_cifrado = crypto_in.validador_cifrado
    db_user.llave_publica = crypto_in.llave_publica
    db_user.llave_privada_cifrada = crypto_in.llave_privada_cifrada

    db.commit()
    db.refresh(db_user)
    return db_user
