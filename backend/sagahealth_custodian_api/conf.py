import pathlib
from pydantic_settings import BaseSettings, SettingsConfigDict

class LynxSettings(BaseSettings):
    pass

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=pathlib.Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        env_prefix="SAGA_"
    )
    # Logging Configurations
    LOG_LEVEL: str = "INFO"
    LOG_FILE_LEVEL: str | None = None
    LOG_STREAM_LEVEL: str | None = None
    LOG_BASE_DIR: str | None = None
    # API Configurations
    LYNX_API_BASE_URL: str = "https://sandbox.lynx-fh.co"
    LYNX_AUTH_TOKEN: str
    LYNX_CLIENT_ID: str
    LYNX_CLIENT_SECRET: str

    # Util properties for log configuration
    @property
    def log_base_path(self) -> pathlib.Path:
        if self.LOG_BASE_DIR:
            return pathlib.Path(self.LOG_BASE_DIR)
        # default to a "logs" directory in the current working directory if not set
        return pathlib.Path(__file__).parent.parent.parent / "logs"

    @property
    def log_level(self) -> str:
        return self.LOG_LEVEL

    @property
    def log_file_level(self) -> str:
        return self.LOG_FILE_LEVEL or self.LOG_LEVEL
    
    @property
    def log_stream_level(self) -> str:
        return self.LOG_STREAM_LEVEL or self.LOG_LEVEL

settings = Settings()  # type: ignore[arg-type]  # loaded from env
