from fastapi import APIRouter, HTTPException, Header, Request
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging, tempfile, os
from datetime import datetime, timezone
import redis
import json

from login import require_login

recommendations_router = APIRouter()

# Initialize Redis connection
redis_client = redis.Redis(host='localhost', port=6379, db=0)
CACHE_EXPIRATION = 600  # 10 minutes in seconds

@recommendations_router.get("/recommendations")
async def read_users_me(user: dict = Depends(require_login)):
    """Get the current user's YouTube recommendations using stored cookies"""
    
    # Check cache first
    cache_key = f"recommendations:{user['_id']}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)

    # Create a temporary cookie file
    cookie_file = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
            f.write(user['cookies'])
            cookie_file = f.name

        # Configure yt-dlp options based on the command line parameters
        ydl_opts = {
            'cookiefile': cookie_file,
            'quiet': True,
            'extract_flat': True,          # --flat-playlist
            'playlist_items': '1-12',      # --playlist-items 1-12
            'no_warnings': True,           # --no-warnings
            'no_progress': True,           # --no-progress 
            'ignore_errors': True,         # --ignore-errors
            'skip_download': True,         # --skip-download
            'dump_single_json': True,      # --dump-single-json
            # 'write_pages': True            # --write-pages
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                # Extract feed information
                result = ydl.extract_info(
                    'https://www.youtube.com/feed/recommended',
                    download=False
                )
                
                if not result:
                    raise HTTPException(
                        status_code=404,
                        detail="Could not fetch recommendations"
                    )

                # Prepare response
                response_data = {
                    "status": "success",
                    "timestamp": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S'),
                    "data": result
                }

                # Cache the response
                redis_client.setex(
                    cache_key,
                    CACHE_EXPIRATION,
                    json.dumps(response_data)
                )

                return response_data

            except Exception as e:
                logging.error(f"Error fetching recommendations: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error fetching recommendations: {str(e)}"
                )

    except Exception as e:
        logging.error(f"Error setting up yt-dlp: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error setting up yt-dlp: {str(e)}"
        )

    finally:
        # Clean up temporary cookie file
        if cookie_file and os.path.exists(cookie_file):
            try:
                os.unlink(cookie_file)
            except Exception as e:
                logging.error(f"Error deleting temporary cookie file: {str(e)}")