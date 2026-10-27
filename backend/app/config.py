import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduVerify AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "eduverify-ai-secret-key-sih-26263-production-safe-32b")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for hackathon evaluation ease
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./eduverify.db")
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]
    MOCK_PROVIDERS_ENABLED: bool = True
    
    # Asymmetric/HMAC keys for demonstration verifiable credentials
    CREDENTIAL_SIGNING_KEY: str = os.getenv("CREDENTIAL_SIGNING_KEY", "aicte-ed25519-demo-signing-key-hex-491b")
    CREDENTIAL_PUBLIC_KEY: str = "aicte-ed25519-demo-public-key-hex-88ff"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
