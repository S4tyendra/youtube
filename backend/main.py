import motor.motor_asyncio
from fastapi import FastAPI, Header, HTTPException, Depends, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
import yt_dlp
import asyncio
import logging, os, tempfile
from datetime import datetime, timezone
from fastapi import Request


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

client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client["testdb"]
users_collection = db["users"]

class UserData(BaseModel):
    cookies: str = ""  # Store cookies as Netscape format text
    other_data: dict = {}



@app.post("/set-cookies")
async def set_cookies(request: Request):
    """
    Accepts Netscape format cookies as raw text in request body and stores in MongoDB.
    """
    cookies_text = await request.body()
    cookies_text = cookies_text.decode('utf-8')

    if not cookies_text:
        raise HTTPException(status_code=400, detail="No cookie data provided in request body.")

    # Store the Netscape format cookies directly
    netscape_cookies = cookies_text

    if not netscape_cookies:
        logger.warning("No valid cookies found to convert to Netscape format.")
        raise HTTPException(status_code=400, detail="No valid cookies found in request body.")

    # Create user data and insert it into MongoDB
    user_data = UserData(cookies=netscape_cookies).model_dump()
    result = await users_collection.insert_one(user_data)
    user_id = str(result.inserted_id)
    return {"user_id": user_id}




async def require_login(login: str = Header(None)):
    if not login:
        raise HTTPException(status_code=401, detail="Missing login header")
    try:
        user = await users_collection.find_one({"_id": ObjectId(login)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login header")
    return user

@app.get("/me")
async def read_users_me(user: dict = Depends(require_login)):
    