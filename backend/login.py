from fastapi import APIRouter, HTTPException, Header, Request
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging, tempfile, os, subprocess, json
from datetime import datetime, timezone
from fastapi import Request
import yt_dlp
from database import get_user_by_id, insert_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

login_router = APIRouter()

def validate_youtube_cookies(cookies_text: str) -> bool:
    """Validate cookies by trying to access YouTube feed"""
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
        temp_file.write(cookies_text)
        cookie_file = temp_file.name

    try:
        # Use yt-dlp to validate and format cookies
        cmd = [
            'yt-dlp',
            '--cookies', cookie_file,
            '--dump-single-json',
            '--flat-playlist',
            '--playlist-items', '1',
            '--no-check-certificates',
            '--no-warnings',
            '--no-progress',
            '--ignore-errors',
            '--skip-download',
            'https://www.youtube.com/feed/recommended'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Check if command succeeded and returned valid JSON
        try:
            json.loads(result.stdout)
            return True
        except json.JSONDecodeError:
            logger.error("Invalid response from YouTube")
            return False
            
    except Exception as e:
        logger.error(f"Error validating cookies: {str(e)}")
        return False
    finally:
        if os.path.exists(cookie_file):
            os.unlink(cookie_file)


@login_router.post("/set-cookies")
async def set_cookies(request: Request):
    """
    Accepts Netscape format YouTube cookies as raw text in request body,
    validates them, and stores in MongoDB.
    
    Current Date and Time (UTC): 2025-02-23 11:24:54
    Current User's Login: S4tyendra
    """
    try:
        cookies_text = await request.body()
        cookies_text = cookies_text.decode('utf-8')

        if not cookies_text:
            raise HTTPException(
                status_code=400, 
                detail="No cookie data provided in request body."
            )

        # Validate and check if cookies work with YouTube
        if not validate_youtube_cookies(cookies_text):
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired YouTube cookies"
            )

        # Store validated cookies in MongoDB
        user_id = await insert_user(cookies_text)
        
        logger.info(f"Successfully stored cookies for user {user_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "timestamp": "2025-02-23 11:24:54",
            "message": "YouTube cookies validated and stored successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing cookies: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing cookies: {str(e)}"
        )


async def require_login(login: str = Header(None)):
    """Validate login header and return user data"""
    if not login:
        raise HTTPException(
            status_code=401, 
            detail="Missing login header"
        )
        
    user = await get_user_by_id(login)
    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Invalid login header"
        )
        
    return user

async def require_login(login: str = Header(None)):
    if not login:
        raise HTTPException(status_code=401, detail="Missing login header")
    user = await get_user_by_id(login)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login header")
    return user
