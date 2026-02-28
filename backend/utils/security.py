import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import config

# Esquema HTTP Bearer para Swagger UI (botón "Authorize")
security_scheme = HTTPBearer()

# ─────────────────────────────────────────────
# HASHING DE CONTRASEÑAS (Bcrypt)
# ─────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara contraseña plana contra el hash bcrypt almacenado en PostgreSQL."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8')[:72], 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Genera hash bcrypt unidireccional de la contraseña."""
    pwd_bytes = password.encode('utf-8')[:72]
    hashed_bytes = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt(rounds=12))
    return hashed_bytes.decode('utf-8')

# ─────────────────────────────────────────────
# JSON WEB TOKENS (JWT) - Sesión de usuario
# ─────────────────────────────────────────────

def create_access_token(user_id: UUID) -> str:
    """Genera un JWT de sesión firmado con HS256 que contiene el UUID del usuario."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }
    return jwt.encode(payload, config.jwt_secret_key, algorithm=config.jwt_algorithm)

def decode_access_token(token: str) -> UUID:
    """Decodifica un JWT de sesión y devuelve el user_id."""
    try:
        payload = jwt.decode(token, config.jwt_secret_key, algorithms=[config.jwt_algorithm])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
        return UUID(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado. Inicia sesión de nuevo.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o manipulado.")

def create_verification_token(user_id: UUID) -> str:
    """
    Genera un JWT de un solo uso para verificar el email.
    Expira en 24 horas.
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "email_verification"
    }
    return jwt.encode(payload, config.jwt_secret_key, algorithm=config.jwt_algorithm)

def decode_verification_token(token: str) -> UUID:
    """Decodifica el token de verificación y devuelve el user_id."""
    try:
        payload = jwt.decode(token, config.jwt_secret_key, algorithms=[config.jwt_algorithm])
        
        if payload.get("type") != "email_verification":
            raise HTTPException(status_code=400, detail="Este token no es de verificación.")
        
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=400, detail="Token de verificación inválido.")
        return UUID(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="El enlace de verificación ha expirado (24h). Solicita uno nuevo.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Enlace de verificación inválido o manipulado.")

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> UUID:
    """Inyecta el UUID del usuario autenticado en cada endpoint protegido."""
    token = credentials.credentials
    return decode_access_token(token)
