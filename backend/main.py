from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging, tempfile, os
from datetime import datetime, timezone
from fastapi import Request
import yt_dlp
from feed.recommendations import recommendations_router
from login import login_router, require_login
from data.video import video_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def log_id_header(request: Request, call_next):
    id_header = request.headers.get('_id')
    if id_header:
        logger.info(f"Request with _id header: {id_header}")
    response = await call_next(request)
    return response


app.include_router(login_router)
app.include_router(recommendations_router, prefix="/feed")
app.include_router(video_router)
