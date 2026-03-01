from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_env_file_path() -> Path:
    module_dir = Path(__file__).parent
    env_file = module_dir / ".env"
    return env_file


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_get_env_file_path()),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    log_level: str = Field("INFO", validation_alias="LOG_LEVEL")
    database_url: str = Field(
        "postgresql://usuario:contraseña@localhost:5432/achave",
        validation_alias="DATABASE_URL"
    )

    # JWT
    jwt_secret_key: str = Field(
        "CAMBIA_ESTA_CLAVE_SECRETA_POR_UNA_SEGURA",
        validation_alias="JWT_SECRET_KEY"
    )
    jwt_algorithm: str = Field("HS256", validation_alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(60, validation_alias="JWT_EXPIRE_MINUTES")

    # URL base del frontend
    frontend_url: str = Field("http://localhost:3000", validation_alias="FRONTEND_URL")

config = Config()
