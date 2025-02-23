from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging, tempfile, os
from datetime import datetime, timezone
from fastapi import Request
import yt_dlp
from database import get_user_by_id, insert_user

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

class UserResponse(BaseModel):
    id: str
    name: str

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

    # Store cookies in MongoDB
    user_id = await insert_user(netscape_cookies)
    return {"user_id": user_id}

async def require_login(login: str = Header(None)):
    if not login:
        raise HTTPException(status_code=401, detail="Missing login header")
    user = await get_user_by_id(login)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login header")
    return user

@app.get("/me", response_model=UserResponse)
async def read_users_me(user: dict = Depends(require_login)):
    """Get the current user's YouTube profile information using stored cookies"""
    # Create a temporary cookie file
    cookie_file = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
            f.write(user['cookies'])
            cookie_file = f.name

        # Configure yt-dlp to use the cookies
        ydl_opts = {
            'cookiefile': cookie_file,
            'quiet': True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get channel info from YouTube
            result = ydl.extract_info('https://www.youtube.com/account', download=False)
            
            # Extract channel name from the response
            channel_name = result.get('channel', '')
            if not channel_name:
                channel_name = result.get('uploader', 'Unknown User')
            
            return {
                "id": str(user["_id"]),
                "name": channel_name
            }
    
    except Exception as e:
        logger.error(f"Failed to fetch YouTube user data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch YouTube user data")
    
    finally:
        # Clean up the temporary cookie file
        if cookie_file and os.path.exists(cookie_file):
            try:
                os.unlink(cookie_file)
            except Exception as e:
                logger.error(f"Failed to delete temporary cookie file: {str(e)}")