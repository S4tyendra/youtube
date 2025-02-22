import motor.motor_asyncio
from fastapi import FastAPI, Header, HTTPException, Depends, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
import yt_dlp
import asyncio
import logging, os, tempfile
import re  # For parsing Cookie header
from datetime import datetime, timezone
from fastapi import Request
from youtube import YouTubeFeed

# Configure logging (optional, but very helpful)
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
def get_youtube_recommendations(cookies_file=None, max_results=50):
    """
    Get YouTube recommendations using yt-dlp
    
    Args:
        cookies_file (str): Path to Netscape formatted cookies file
        max_results (int): Maximum number of recommendations to fetch
        
    Returns:
        list: List of dictionaries containing video information
    """
    
    # URLs to try in order
    urls = [
        'https://www.youtube.com/',
        'https://www.youtube.com/feed/recommended',
        'https://www.youtube.com/feed/subscriptions'
    ]
    
    ydl_opts = {
        'quiet': True,
        'extract_flat': True,  # Don't download videos
        'force_generic_extractor': False,
        'no_warnings': True,
        'ignoreerrors': True,
        'max_results': max_results,
        'no_color': True,
        'extractor_args': {
            'youtube': {
                'skip': ['dash', 'hls'],  # Skip these formats for faster extraction
                'player_skip': ['js', 'configs', 'webpage']  # Skip additional data
            }
        }
    }
    
    if cookies_file:
        ydl_opts['cookiefile'] = cookies_file

    recommendations = []
    
    for url in urls:
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                logger.info(f"Trying to fetch recommendations from: {url}")
                result = ydl.extract_info(url, download=False)
                
                if result and 'entries' in result:
                    entries = result['entries']
                    if entries:
                        logger.info(f"Successfully got {len(entries)} entries from {url}")
                        
                        for entry in entries:
                            if entry and isinstance(entry, dict):
                                try:
                                    video_info = {
                                        'id': entry.get('id'),
                                        'title': entry.get('title'),
                                        'channel': entry.get('channel', entry.get('uploader')),
                                        'channel_id': entry.get('channel_id', entry.get('uploader_id')),
                                        'duration': entry.get('duration'),
                                        'view_count': entry.get('view_count'),
                                        'thumbnail': entry.get('thumbnail'),
                                        'description': entry.get('description'),
                                        'url': f"https://www.youtube.com/watch?v={entry.get('id')}" if entry.get('id') else None
                                    }
                                    
                                    if video_info['id'] and video_info['title']:
                                        recommendations.append(video_info)
                                        
                                except Exception as e:
                                    logger.warning(f"Error processing entry: {str(e)}")
                                    continue
                        
                        # If we got recommendations, no need to try other URLs
                        if recommendations:
                            break
                            
        except Exception as e:
            logger.error(f"Error fetching from {url}: {str(e)}")
            continue
    
    return recommendations
@app.get("/feed")
async def feed(page: int = Query(1, ge=1), user: dict = Depends(require_login)):
    netscape_cookies = user.get("cookies", "")
    # Create a temporary cookie file
    with tempfile.NamedTemporaryFile('w+', delete=False) as f:
        f.write(netscape_cookies)
        cookie_file = f.name
    
    try:
      data = get_youtube_recommendations(cookies_file=cookie_file)
      return data
    finally:
        # Clean up temporary cookie file
        if os.path.exists(cookie_file):
            os.unlink(cookie_file)