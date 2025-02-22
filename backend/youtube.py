import aiohttp
import json
import logging
import re
from typing import Dict, List, Optional

class YouTubeFeed:
    def __init__(self):
        self.base_url = "https://www.youtube.com"
        self.api_base = "https://www.youtube.com/youtubei/v1"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'X-YouTube-Client-Name': '1',
        }

    async def get_api_key(self, session: aiohttp.ClientSession, cookies: Dict = None) -> Dict[str, str]:
        """Extract YouTube configuration including INNERTUBE_API_KEY."""
        async with session.get(self.base_url, headers=self.headers, cookies=cookies) as response:
            text = await response.text()
            
            # Try different methods to extract the API key
            patterns = [
                r'ytcfg\.set\s*\(({.+?})\);',
                r'window\.ytcfg\s*=\s*({.+?});',
                r'"INNERTUBE_API_KEY":"([^"]+)"'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    if '{' in pattern:
                        try:
                            ytcfg = json.loads(match.group(1))
                            if 'INNERTUBE_API_KEY' in ytcfg:
                                return {
                                    'api_key': ytcfg['INNERTUBE_API_KEY'],
                                    'client_version': ytcfg.get('INNERTUBE_CLIENT_VERSION', '2.20240220.01.00')
                                }
                        except json.JSONDecodeError:
                            continue
                    else:
                        return {
                            'api_key': match.group(1),
                            'client_version': '2.20240220.01.00'
                        }
            
            # Fallback to default key if extraction fails
            return {
                'api_key': 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
                'client_version': '2.20240220.01.00'
            }

    async def get_feed(self, cookies: Dict = None, page_token: str = None) -> Dict:
        """Get YouTube homepage feed/recommendations."""
        async with aiohttp.ClientSession() as session:
            # Get API configuration
            config = await self.get_api_key(session, cookies)
            self.headers['X-YouTube-Client-Version'] = config['client_version']
            
            # Prepare the browse request
            browse_endpoint = f"{self.api_base}/browse?key={config['api_key']}"
            
            payload = {
                "context": {
                    "client": {
                        "clientName": "WEB",
                        "clientVersion": config['client_version'],
                        "hl": "en",
                        "gl": "US",
                        "originalUrl": "https://www.youtube.com",
                        "platform": "DESKTOP"
                    },
                    "user": {
                        "lockedSafetyMode": False
                    },
                    "request": {
                        "useSsl": True,
                        "internalExperimentFlags": [],
                        "consistencyTokenJars": []
                    }
                },
                "browseId": "FEwhat_to_watch"
            }

            if page_token:
                payload["continuation"] = page_token

            # Make the request
            async with session.post(
                browse_endpoint,
                json=payload,
                headers=self.headers,
                cookies=cookies
            ) as response:
                if response.status != 200:
                    raise Exception(f"Failed to fetch feed: {response.status}")
                
                data = await response.json()
                return self._parse_feed(data)

    def _parse_feed(self, data: Dict) -> Dict[str, List]:
        """Parse the feed response and extract video information."""
        videos = []
        next_page_token = None

        try:
            # Extract videos from response
            tabs = data.get('contents', {}).get('twoColumnBrowseResultsRenderer', {}).get('tabs', [])
            for tab in tabs:
                if 'tabRenderer' in tab and tab['tabRenderer'].get('selected', False):
                    content = tab['tabRenderer'].get('content', {})
                    
                    # Handle both initial feed and continuation responses
                    items = []
                    if 'richGridRenderer' in content:
                        items = content['richGridRenderer'].get('contents', [])
                    elif 'continuationItems' in data:
                        items = data['continuationItems']

                    for item in items:
                        if 'richItemRenderer' in item:
                            video_data = item['richItemRenderer']['content'].get('videoRenderer', {})
                            if video_data:
                                video = {
                                    'id': video_data.get('videoId'),
                                    'title': self._get_text(video_data.get('title', {})),
                                    'thumbnail': self._get_thumbnail(video_data.get('thumbnail', {})),
                                    'channel': self._get_text(video_data.get('ownerText', {})),
                                    'channel_id': self._get_channel_id(video_data.get('ownerText', {})),
                                    'duration': self._get_text(video_data.get('lengthText', {})),
                                    'views': self._get_text(video_data.get('viewCountText', {})),
                                    'published': self._get_text(video_data.get('publishedTimeText', {})),
                                    'description': self._get_text(video_data.get('descriptionSnippet', {})),
                                    'url': f"https://www.youtube.com/watch?v={video_data.get('videoId')}"
                                }
                                if video['id'] and video['title']:
                                    videos.append(video)

                        # Extract continuation token for pagination
                        if 'continuationItemRenderer' in item:
                            continuation = item['continuationItemRenderer'].get('continuationEndpoint', {}).get('continuationCommand', {})
                            next_page_token = continuation.get('token')

        except Exception as e:
            logging.error(f"Error parsing feed data: {str(e)}")
            raise Exception("Failed to parse video data")

        return {
            "videos": videos,
            "next_page_token": next_page_token
        }

    def _get_text(self, data: Dict) -> Optional[str]:
        """Extract text from YouTube's text rendering format."""
        if not data:
            return None
        
        if 'simpleText' in data:
            return data['simpleText']
        
        if 'runs' in data:
            return ' '.join(run.get('text', '') for run in data['runs'])
        
        return None

    def _get_thumbnail(self, data: Dict) -> Optional[str]:
        """Get the highest quality thumbnail URL."""
        if not data:
            return None
        
        thumbnails = data.get('thumbnails', [])
        return thumbnails[-1].get('url') if thumbnails else None

    def _get_channel_id(self, data: Dict) -> Optional[str]:
        """Extract channel ID from owner text data."""
        if not data or 'runs' not in data:
            return None
        
        for run in data['runs']:
            if 'navigationEndpoint' in run:
                browse_endpoint = run['navigationEndpoint'].get('browseEndpoint', {})
                return browse_endpoint.get('browseId')
        
        return None