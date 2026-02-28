from pathlib import Path
from typing import Optional

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


def _getEnvFilePath() -> Path:
    moduleDir = Path(__file__).parent
    appDir = moduleDir.parent.parent
    envFile = appDir / ".env"
    return envFile


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_getEnvFilePath()),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    logLevel: str = Field("INFO", validation_alias="LOG_LEVEL")
    
    # La URL de conexión a la base de datos
    databaseUrl: str = Field(..., validation_alias="DATABASE_URL")
    
    # Las credenciales de Google OAuth
    googleClientId: str = Field(..., validation_alias="GOOGLE_CLIENT_ID")
    
    # El secreto para firmar tus JWT
    secretKey: str = Field(..., validation_alias="SECRET_KEY")


config = Config()