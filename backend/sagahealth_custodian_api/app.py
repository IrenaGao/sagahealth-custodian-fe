from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .util import get_basic_logger
from .api import router as api_router
from .auth_router import router as auth_router
from .support_router import router as support_router

logger = get_basic_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    logger.info("Hello world!")
    return {"message": "Hello World"}

app.include_router(api_router)
app.include_router(auth_router)
app.include_router(support_router)
