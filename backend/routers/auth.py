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

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Crea el usuario con is_verified=False
    y envia un email de verificacion via Brevo SMTP.
    """
    # Verificar que el email no exista
    db_user = get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email ya está registrado en AChave."
        )
    
    # Crear usuario (sin verificar)
    new_user = create_user(db=db, user_in=user_in)
    
    # Generar token de verificacion y enviar email en background
    verification_token = create_verification_token(new_user.user_id)
    background_tasks.add_task(send_verification_email, new_user.email, verification_token)
    
    return new_user

@router.get("/verify/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Decodificamos el token, marcamos is_verified=True
    y creamos la vault por defecto.
    """
    user_id = decode_verification_token(token)
    
    db_user = verify_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    return {
        "message": "Email verificado correctamente. Ya puedes configurar tu Master Password.",
        "is_verified": True,
        "user_id": str(db_user.user_id)
    }

@router.post("/setup-crypto", response_model=UserMeResponse)
def setup_user_crypto(
    crypto_in: CryptoSetup,
    db: Session = Depends(get_db),
    user_id = Depends(get_current_user_id)
):
    """
    El frontend genera las llaves con la Master Password
    y envia los artefactos cifrados. El backend los guarda como
    TEXT opaco sin aplicar lógica de descifrado nunva.
    
    Requiere JWT (el usuario debe hacer login primero).
    """
    db_user = get_user_by_id(db, user_id)
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Debes verificar tu email antes de configurar la criptografía.")
    
    updated_user = setup_crypto(db=db, user_id=user_id, crypto_in=crypto_in)
    return updated_user

@router.post("/login", response_model=LoginResponse)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login: Verifica credenciales y devuelve JWT + paquete criptografico.
    El frontend usara el validador_cifrado para comprobar la Master Password
    localmente sin que el backend la conozca.
    """
    db_user = get_user_by_email(db, email=user_credentials.email)
    
    if not db_user or not verify_password(user_credentials.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not db_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes verificar tu email antes de iniciar sesión."
        )
    
    # Generar JWT de sesión
    token = create_access_token(user_id=db_user.user_id)
    db_user.access_token = token
    db_user.token_type = "Bearer"
    db.commit()
    
    return db_user

@router.get("/me", response_model=UserMeResponse)
def get_me(
    db: Session = Depends(get_db),
    user_id = Depends(get_current_user_id)
):
    """
    Devuelve el perfil del usuario autenticado junto con su
    paquete criptografico completo (validador, llaves).
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return db_user

@router.post("/logout")
def logout():
    """Con JWT stateless, el cliente simplemente descarta el token."""
    return {"message": "Has cerrado sesión de forma segura."}
