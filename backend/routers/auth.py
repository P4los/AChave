from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db
from schemas.user import (
    UserCreate, UserLogin, CryptoSetup,
    UserResponse, LoginResponse, UserMeResponse
)
from crud.user import (
    create_user, get_user_by_email, get_user_by_id,
    verify_user, setup_crypto
)
from utils.security import (
    verify_password, create_access_token,
    create_verification_token, decode_verification_token,
    get_current_user_id
)
from utils.email import send_verification_email

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)

# ─── FASE 1: Registro (solo email) ───

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Fase 1: Recibe SOLO el email.
    Crea usuario con is_verified=False y envía email de verificación.
    """
    db_user = get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email ya está registrado en AChave."
        )

    new_user = create_user(db=db, user_in=user_in)

    verification_token = create_verification_token(new_user.user_id)
    background_tasks.add_task(send_verification_email, new_user.email, verification_token)

    return new_user

# ─── FASE 2: Verificación email ───

@router.get("/verify/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Fase 2: El usuario hace clic en el enlace.
    Marca is_verified=True y crea la bóveda por defecto.
    """
    user_id = decode_verification_token(token)

    db_user = verify_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Generar un JWT temporal para que pueda llamar a /setup-crypto
    token = create_access_token(user_id=db_user.user_id)

    return {
        "message": "Email verificado. Ahora configura tu Master Password.",
        "is_verified": True,
        "user_id": str(db_user.user_id),
        "access_token": token
    }

# ─── FASE 3: Master Password + Paquete Cripto ───

@router.post("/setup-crypto", response_model=UserMeResponse)
def setup_user_crypto(
    crypto_in: CryptoSetup,
    db: Session = Depends(get_db),
    user_id = Depends(get_current_user_id)
):
    """
    Fase 3: Recibe la Master Password + paquete criptográfico.
    - Hashea la Master Password con bcrypt (para login futuro).
    - Guarda validador_cifrado, llave_publica, llave_privada_cifrada como TEXT opaco.
    Requiere el JWT que se entregó en la verificación.
    """
    db_user = get_user_by_id(db, user_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Debes verificar tu email primero.")
    if db_user.hashed_password is not None:
        raise HTTPException(status_code=400, detail="La Master Password ya fue configurada.")

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

    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Debes verificar tu email primero.")

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
