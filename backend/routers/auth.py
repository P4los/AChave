from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.user import (
    UserCreate, UserLogin, CryptoSetup,
    UserResponse, LoginResponse, UserMeResponse
)
from crud.user import (
    create_user, get_user_by_email, get_user_by_id,
    setup_crypto
)
from utils.security import (
    verify_password, create_access_token,
    get_current_user_id
)

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)

# ─── REGISTRO (Self-Hosted: sin verificación de email) ───

@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Self-Hosted: Registro completo en un solo paso.
    Recibe email + Master Password + paquete criptográfico.
    Crea el usuario ya verificado, con su cofre por defecto y llaves configuradas.
    Devuelve JWT para acceso inmediato.
    """
    db_user = get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email ya está registrado en AChave."
        )

    # Crear usuario ya verificado + cofre por defecto + crypto setup
    new_user = create_user(db=db, user_in=user_in)

    # Generar JWT de sesión
    token = create_access_token(user_id=new_user.user_id)
    new_user.access_token = token
    new_user.token_type = "Bearer"
    db.commit()
    db.refresh(new_user)

    return new_user

# ─── SETUP CRYPTO (re-cifrado con JWT real) ───

@router.post("/setup-crypto", response_model=UserMeResponse)
def setup_user_crypto(
    crypto_in: CryptoSetup,
    db: Session = Depends(get_db),
    user_id = Depends(get_current_user_id)
):
    """
    Actualiza el paquete criptográfico del usuario.
    Usado tras el registro para re-cifrar con el salt del JWT real.
    """
    db_user = get_user_by_id(db, user_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    updated_user = setup_crypto(db=db, user_id=user_id, crypto_in=crypto_in)
    return updated_user

# ─── LOGIN ───

@router.post("/login", response_model=LoginResponse)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login: email + Master Password.
    Devuelve JWT + paquete criptográfico para validación local.
    """
    db_user = get_user_by_email(db, email=user_credentials.email)

    if not db_user or not db_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_credentials.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user_id=db_user.user_id)
    db_user.access_token = token
    db_user.token_type = "Bearer"
    db.commit()

    return db_user

# ─── PERFIL ───

@router.get("/me", response_model=UserMeResponse)
def get_me(
    db: Session = Depends(get_db),
    user_id = Depends(get_current_user_id)
):
    """Devuelve perfil + paquete criptográfico del usuario autenticado."""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return db_user

# ─── LOGOUT ───

@router.post("/logout")
def logout():
    return {"message": "Sesión cerrada."}
