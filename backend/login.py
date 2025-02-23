from fastapi import APIRouter, HTTPException, Header, Request
from fastapi import Header, HTTPException, Depends
import logging, tempfile, os, subprocess, json
from fastapi import Request
from database import get_user_by_id, insert_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

login_router = APIRouter()


def validate_youtube_cookies(cookie_file: str) -> bool:
    """Validate cookies by trying to access YouTube feed"""

    try:
        # Use yt-dlp to validate and format cookies
        cmd = [
            "yt-dlp",
            "--cookies",
            cookie_file,
            "--dump-single-json",
            "--flat-playlist",
            "--playlist-items",
            "1",
            "--no-check-certificates",
            "--no-warnings",
            "--no-progress",
            "--ignore-errors",
            "--skip-download",
            "https://www.youtube.com/feed/recommended",
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True
        )  # Command will modify the cookies file
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


@login_router.post("/set-cookies")
async def set_cookies(request: Request):
    """
    Accepts Netscape format YouTube cookies as raw text in request body,
    validates them, and stores in MongoDB.
    """
    try:
        cookies_text = await request.body()
        cookies_text = cookies_text.decode("utf-8")

        if not cookies_text:
            raise HTTPException(
                status_code=400, detail="No cookie data provided in request body."
            )

        # Create temporary file
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as temp_file:
            temp_file.write(cookies_text)
            cookie_file = temp_file.name

        try:
            # Validate cookies
            if not validate_youtube_cookies(cookie_file):
                raise HTTPException(
                    status_code=400, detail="Invalid or expired YouTube cookies"
                )

            # Read the validated cookies
            with open(cookie_file, "r") as f:
                new_cookies_text = f.read()

            # Store in database
            user_id = await insert_user(new_cookies_text)
            
            logger.info(f"Successfully stored cookies for user {user_id}")
            return {
                "status": "success",
                "user_id": user_id,
            }

        finally:
            # Clean up temporary file
            if os.path.exists(cookie_file):
                os.unlink(cookie_file)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing cookies: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing cookies: {str(e)}"
        )

async def require_login(login: str = Header(None)):
    """Validate login header and return user data"""
    if not login:
        raise HTTPException(status_code=401, detail="Missing login header")
    user = await get_user_by_id(login)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login header")
    return user
