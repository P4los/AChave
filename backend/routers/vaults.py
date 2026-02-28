from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from database import get_db
from schemas.vault import VaultCreate, VaultUpdate, VaultResponse
from utils.security import get_current_user_id
import crud.vault as crud_vault

vaults = APIRouter(
    prefix="/vaults",
    tags=["Bóvedas"],
)

@vaults.get("/", response_model=List[VaultResponse])
def read_user_vaults(
    db: Session = Depends(get_db), 
    user_id: UUID = Depends(get_current_user_id)
):
    """Obtiene la lista de todas las bóvedas del usuario actual."""
    return crud_vault.get_user_vaults(db=db, user_id=user_id)

@vaults.post("/", response_model=VaultResponse, status_code=status.HTTP_201_CREATED)
def create_vault(
    vault_in: VaultCreate, 
    db: Session = Depends(get_db), 
    user_id: UUID = Depends(get_current_user_id)
):
    """Crea una nueva bóveda para el usuario logueado."""
    return crud_vault.create_vault(db=db, vault_in=vault_in, user_id=user_id)

@vaults.put("/{vault_id}", response_model=VaultResponse)
def update_vault(
    vault_id: UUID, 
    vault_in: VaultUpdate, 
    db: Session = Depends(get_db), 
    user_id: UUID = Depends(get_current_user_id)
):
    """Actualiza el nombre, descripción, color o ícono de la bóveda."""
    updated_vault = crud_vault.update_vault(db=db, vault_id=vault_id, user_id=user_id, vault_in=vault_in)
    if not updated_vault:
        raise HTTPException(status_code=404, detail="Bóveda no encontrada o no tienes permisos")
    return updated_vault

@vaults.delete("/{vault_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vault(
    vault_id: UUID, 
    db: Session = Depends(get_db), 
    user_id: UUID = Depends(get_current_user_id)
):
    """Elimina una bóveda (y todas sus claves en cascada)."""
    try:
        success = crud_vault.delete_vault(db=db, vault_id=vault_id, user_id=user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Bóveda no encontrada o no tienes permisos")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
