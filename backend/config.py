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



config = Config()