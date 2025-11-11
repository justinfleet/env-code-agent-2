"""RealWorld API Client

HTTP client for interacting with the RealWorld API server.
"""

import os
import httpx
from typing import Optional, Dict, Any, List
import asyncio

class RealWorldAPIClient:
    """Client for RealWorld API interactions."""
    
    def __init__(self):
        self.app_env = os.getenv("APP_ENV", "local")
        
        if self.app_env == "local":
            self.base_url = os.getenv("API_BASE_URL", "http://localhost:3002")
        else:
            # In production, you would set this to your production API URL
            self.base_url = os.getenv("API_BASE_URL", "https://your-production-api.com")
        
        self.api_url = f"{self.base_url}/api"
        
    async def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to the API."""
        url = f"{self.api_url}{path}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.request(method, url, **kwargs)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                raise Exception(f"API request failed: {str(e)}")
            except Exception as e:
                raise Exception(f"Request error: {str(e)}")

    # Articles
    async def get_articles(self, tag: Optional[str] = None, author: Optional[str] = None, 
                          favorited: Optional[str] = None, limit: int = 20, 
                          offset: int = 0) -> Dict[str, Any]:
        """Get articles with optional filtering."""
        params = {"limit": limit, "offset": offset}
        if tag:
            params["tag"] = tag
        if author:
            params["author"] = author
        if favorited:
            params["favorited"] = favorited
            
        return await self._request("GET", "/articles", params=params)

    async def get_article(self, slug: str) -> Dict[str, Any]:
        """Get a single article by slug."""
        return await self._request("GET", f"/articles/{slug}")

    async def get_article_comments(self, slug: str) -> Dict[str, Any]:
        """Get comments for an article."""
        return await self._request("GET", f"/articles/{slug}/comments")

    # Users and Profiles
    async def get_profile(self, username: str) -> Dict[str, Any]:
        """Get user profile by username."""
        return await self._request("GET", f"/profiles/{username}")

    # Tags
    async def get_tags(self) -> Dict[str, Any]:
        """Get all available tags."""
        return await self._request("GET", "/tags")

    # Health check
    async def health_check(self) -> Dict[str, Any]:
        """Check API health status."""
        url = f"{self.base_url}/health"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                raise Exception(f"Health check failed: {str(e)}")

    # Search functionality
    async def search_articles(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Search articles by title or content."""
        # Simple search by getting all articles and filtering
        # In a real implementation, you might want to implement server-side search
        articles = await self.get_articles(limit=50)
        
        if not articles.get("articles"):
            return {"articles": [], "articlesCount": 0}
        
        query_lower = query.lower()
        matching_articles = []
        
        for article in articles["articles"]:
            if (query_lower in article.get("title", "").lower() or 
                query_lower in article.get("description", "").lower() or
                query_lower in article.get("body", "").lower()):
                matching_articles.append(article)
                if len(matching_articles) >= limit:
                    break
        
        return {
            "articles": matching_articles,
            "articlesCount": len(matching_articles)
        }