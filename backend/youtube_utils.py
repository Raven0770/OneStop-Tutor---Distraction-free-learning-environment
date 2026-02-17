import re
import requests
from typing import Optional, Dict
from urllib.parse import urlparse, parse_qs


def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various YouTube URL formats."""
    # Handle youtube.com URLs
    if 'youtube.com' in url:
        if '/watch?' in url:
            parsed = parse_qs(urlparse(url).query)
            if 'v' in parsed:
                return parsed['v'][0]
        elif '/embed/' in url:
            match = re.search(r'/embed/([a-zA-Z0-9_-]{11})', url)
            if match:
                return match.group(1)
    
    # Handle youtu.be URLs
    elif 'youtu.be' in url:
        match = re.search(r'youtu\.be/([a-zA-Z0-9_-]{11})', url)
        if match:
            return match.group(1)
    
    # Handle just the ID
    elif re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    
    return None


def get_youtube_metadata(video_id: str) -> Optional[Dict]:
    """
    Get YouTube video metadata using YouTube Data API.
    For production, use official YouTube API with API key.
    This is a fallback approach.
    """
    try:
        # Using noembed as a fallback for metadata
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "title": data.get("title", "Unknown Title"),
                "thumbnail": data.get("thumbnail_url", ""),
                "author": data.get("author_name", "Unknown Author"),
            }
    except Exception as e:
        print(f"Error fetching YouTube metadata: {e}")
    
    return {
        "title": "Video Title (Fetch Failed)",
        "thumbnail": "",
        "author": "Unknown",
    }


def validate_youtube_url(url: str) -> bool:
    """Validate if URL is a valid YouTube URL."""
    video_id = extract_youtube_id(url)
    return video_id is not None


def build_youtube_embed_url(video_id: str) -> str:
    """Build embeddable YouTube URL."""
    return f"https://www.youtube.com/embed/{video_id}"
