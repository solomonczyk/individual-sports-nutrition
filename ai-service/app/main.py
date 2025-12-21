from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers.health import router as health_router
from app.routers import recommendations
from app.routers import meal_plan as meal_plan_router
from app.utils.logger import logger
from app.utils.ml_config import get_ml_config

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if isinstance(settings.cors_origins, str) else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(recommendations.router)
app.include_router(meal_plan_router.router)


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Server running on {settings.host}:{settings.port}")
    try:
        ml_cfg = get_ml_config()
        if not ml_cfg:
            logger.warning("ML config not found or failed to load (app/ml_config.json)")
        else:
            keys = list(ml_cfg.keys())
            logger.info(f"ML config loaded with keys: {keys}")
    except Exception as e:
        logger.warning(f"Error loading ML config: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down AI service")
