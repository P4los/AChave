from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re
from typing import List
from uuid import UUID

from database import get_db
from schemas.password import PasswordCreate, PasswordUpdate, PasswordResponse
from utils.security import get_current_user_id
from utils.hash_check import hash_check
import crud.password as crud_pwd
import crud.vault as crud_vault

password = APIRouter(
    prefix="/passwords",
    tags=["Contraseñas"],
)

@password.get("/vault/{vault_id}", response_model=List[PasswordResponse])
def get_vault_passwords(
    vault_id: UUID, 
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Obtiene TODAS las contraseñas de un cofre.
    Por seguridad, primero verificamos que el cofre le pertenezca al usuario.
    """
    db_vault = crud_vault.get_user_vaults(db, user_id=user_id)
    if not any(v.vault_id == vault_id for v in db_vault):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cofre.")
        
    return crud_pwd.get_vault_passwords(db=db, vault_id=vault_id)

@password.get("/{password_id}", response_model=PasswordResponse)
def get_single_password(
    password_id: UUID, 
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Obtiene los detalles de una contraseña específica cifrada."""
    db_pwd = crud_pwd.get_password(db=db, password_id=password_id)
    if not db_pwd:
        raise HTTPException(status_code=404, detail="Contraseña no encontrada")
    return db_pwd

@password.post("/", response_model=PasswordResponse, status_code=status.HTTP_201_CREATED)
def create_password(
    password_in: PasswordCreate, 
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Guarda un nuevo ciphertext en un cofre de PostgreSQL."""
    db_vaults = crud_vault.get_user_vaults(db, user_id=user_id)
    
    # 1. Si no enviaron cofre, buscar en su lista la que es por defecto
    if password_in.vault_id is None:
        default_vault = next((v for v in db_vaults if v.is_default), None)
        if not default_vault:
            raise HTTPException(status_code=500, detail="Error interno: No tienes cofre por defecto.")
        password_in.vault_id = default_vault.vault_id
    else:
        # 2. Si enviaron cofre, verificar que sea suyo
        if not any(v.vault_id == password_in.vault_id for v in db_vaults):
            raise HTTPException(status_code=403, detail="Cofre no autorizado o no existe.")
        
    return crud_pwd.create_password(db=db, password_in=password_in)

@password.put("/{password_id}", response_model=PasswordResponse)
def update_password(
    password_id: UUID, 
    password_in: PasswordUpdate, 
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Actualiza un registro (ciphertext) existente."""
    updated_pwd = crud_pwd.update_password(db=db, password_id=password_id, password_in=password_in)
    if not updated_pwd:
        raise HTTPException(status_code=404, detail="Contraseña no encontrada")
    return updated_pwd

@password.delete("/{password_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_password(
    password_id: UUID, 
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Elimina un registro de contraseña."""
    success = crud_pwd.delete_password(db=db, password_id=password_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contraseña no encontrada")

@password.get("/check-pwned/{password_hash}")
def check_local_pwned(password_hash: str):
    """
    Comprueba si el hash de una contraseña está en la base de datos local (Rockyou).
    """
    # Validar que sea un hash SHA‑256
    if not re.fullmatch(r"[0-9a-fA-F]{64}", password_hash):
        raise HTTPException(
            status_code=400,
            detail="El hash debe ser SHA‑256."
        )
    try:
        if hash_check(password_hash):
            return {"is_pwned": True, "message": "¡El hash está en Rockyou!"}
        return {"is_pwned": False, "message": "Contraseña segura"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
