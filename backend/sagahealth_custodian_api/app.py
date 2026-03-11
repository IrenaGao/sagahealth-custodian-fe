from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .util import get_basic_logger
from .api import router as api_router
# from .conf import settings

logger = get_basic_logger(__name__)
app = FastAPI()

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
