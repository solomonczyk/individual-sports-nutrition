from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Individual Sports Nutrition AI Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/individual_sports_nutrition"
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    
    # API
    backend_api_url: str = "http://localhost:3000"
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:8081"
    
    # AI Models
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
