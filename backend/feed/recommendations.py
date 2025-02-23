from fastapi import APIRouter, HTTPException, Header, Request
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging, tempfile, os
from datetime import datetime, timezone
import json
import yt_dlp
from login import require_login
from database import redis_client, CACHE_EXPIRATION, update_user_cookies

recommendations_router = APIRouter()

ITEMS_PER_PAGE = 12

@recommendations_router.get("/recommendations")
async def read_users_me(page: int = 1, user: dict = Depends(require_login)):
    """Get the current user's YouTube recommendations using stored cookies and refresh them"""
    if page < 1:
        raise HTTPException(status_code=400, detail="Page number must be >= 1")
    
    # Calculate playlist items range
    start_item = ((page - 1) * ITEMS_PER_PAGE) + 1
    end_item = start_item + ITEMS_PER_PAGE - 1
    
    # Check cache first
    cache_key = f"recommendations:{user['_id']}:page:{page}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)

    # Create a temporary cookie file
    cookie_file = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
            f.write(user['cookies'])
            cookie_file = f.name

        ydl_opts = {
            'cookiefile': cookie_file,  # This file will be modified by yt-dlp
            'quiet': True,
            'extract_flat': True,
            'playlist_items': f'{start_item}-{end_item}',
            'no_warnings': True,
            'no_progress': True,
            'ignore_errors': True,
            'skip_download': True,
            'dump_single_json': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                result = ydl.extract_info(
                    'https://www.youtube.com/feed/recommended',
                    download=False
                )
                
                if not result or 'entries' not in result or not result['entries']:
                    raise HTTPException(
                        status_code=404,
                        detail="Could not fetch recommendations"
                    )

                # Read the modified cookies file
                with open(cookie_file, 'r') as f:
                    new_cookies = f.read()
                
                # Update cookies in database if they've changed
                if new_cookies != user['cookies']:
                    await update_user_cookies(user['_id'], new_cookies)
                    # Invalidate all cached recommendations for this user
                    for key in redis_client.scan_iter(f"recommendations:{user['_id']}:*"):
                        redis_client.delete(key)

                # Prepare response with pagination info
                response_data = {
                    "status": "success",
                    "timestamp": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S'),
                    "pagination": {
                        "page": page,
                        "items_per_page": ITEMS_PER_PAGE,
                        "start_item": start_item,
                        "end_item": end_item
                    },
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