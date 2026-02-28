from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID

from models.vault import Vault
from schemas.vault import VaultCreate, VaultUpdate

def get_user_vaults(db: Session, user_id: UUID) -> list[Vault]:
    """Obtiene todas las bóvedas de un usuario específico."""
    stmt = select(Vault).where(Vault.user_id == user_id)
    return list(db.execute(stmt).scalars().all())

def create_vault(db: Session, vault_in: VaultCreate, user_id: UUID) -> Vault:
    """Crea una nueva bóveda asignada a un usuario."""
    db_vault = Vault(
        name=vault_in.name,
        description=vault_in.description,
        icon=vault_in.icon,
        color=vault_in.color,
        user_id=user_id
    )
    db.add(db_vault)
    db.commit()
    db.refresh(db_vault)
    return db_vault

def update_vault(db: Session, vault_id: UUID, user_id: UUID, vault_in: VaultUpdate) -> Vault | None:
    """Actualiza una bóveda. Verifica que pertenezca al usuario primero (Seguridad IDOR)."""
    stmt = select(Vault).where(Vault.vault_id == vault_id, Vault.user_id == user_id)
    db_vault = db.execute(stmt).scalars().first()
    
    if not db_vault:
        return None
        
    update_data = vault_in.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_vault, key, value)
        
    db.commit()
    db.refresh(db_vault)
    return db_vault

def delete_vault(db: Session, vault_id: UUID, user_id: UUID) -> bool:
    """Elimina una vault solo si el usuario es el dueño."""
    stmt = select(Vault).where(Vault.vault_id == vault_id, Vault.user_id == user_id)
    db_vault = db.execute(stmt).scalars().first()
    
    if not db_vault:
        return False
        
    if db_vault.is_default:
        raise ValueError("No puedes eliminar tu vault por defecto.")
        
    db.delete(db_vault)
    db.commit()
    return True
