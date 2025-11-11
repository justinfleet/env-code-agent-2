"""RealWorld MCP Server

Model Context Protocol server for RealWorld API interactions.
Provides tools for LLMs to access articles, users, comments, and other data.
"""

import asyncio
import json
from typing import Any, Dict, List
from mcp.server import Server
from mcp.server.stdio import stdio_server
from .client import RealWorldAPIClient

# Initialize MCP server
app = Server("realworld-mcp")
client = RealWorldAPIClient()

@app.list_tools()
async def list_tools() -> List[Dict[str, Any]]:
    """List available MCP tools."""
    return [
        {
            "name": "get_articles",
            "description": "Get a list of articles with optional filtering",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "tag": {
                        "type": "string",
                        "description": "Filter by tag"
                    },
                    "author": {
                        "type": "string", 
                        "description": "Filter by author username"
                    },
                    "favorited": {
                        "type": "string",
                        "description": "Filter by user who favorited"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of articles to return",
                        "default": 20
                    },
                    "offset": {
                        "type": "integer", 
                        "description": "Number of articles to skip",
                        "default": 0
                    }
                }
            }
        },
        {
            "name": "get_article",
            "description": "Get a specific article by its slug",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "slug": {
                        "type": "string",
                        "description": "Article slug identifier"
                    }
                },
                "required": ["slug"]
            }
        },
        {
            "name": "get_article_comments", 
            "description": "Get comments for a specific article",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "slug": {
                        "type": "string",
                        "description": "Article slug identifier"
                    }
                },
                "required": ["slug"]
            }
        },
        {
            "name": "get_profile",
            "description": "Get user profile information",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "username": {
                        "type": "string",
                        "description": "Username to get profile for"
                    }
                },
                "required": ["username"]
            }
        },
        {
            "name": "get_tags",
            "description": "Get all available article tags",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "search_articles",
            "description": "Search articles by title, description, or content",
            "inputSchema": {
                "type": "object", 
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query string"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        },
        {
            "name": "health_check",
            "description": "Check API server health status",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        }
    ]

@app.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """Handle tool calls from the LLM."""
    
    try:
        if name == "get_articles":
            result = await client.get_articles(
                tag=arguments.get("tag"),
                author=arguments.get("author"), 
                favorited=arguments.get("favorited"),
                limit=arguments.get("limit", 20),
                offset=arguments.get("offset", 0)
            )
            
            articles_text = f"Found {result.get('articlesCount', 0)} articles.\n\n"
            
            for article in result.get("articles", []):
                articles_text += f"**{article['title']}** (by {article['author']['username']})\n"
                articles_text += f"Slug: {article['slug']}\n"
                articles_text += f"Description: {article['description']}\n"
                articles_text += f"Tags: {', '.join(article.get('tagList', []))}\n"
                articles_text += f"Favorites: {article['favoritesCount']}\n"
                articles_text += f"Created: {article['createdAt']}\n\n"
            
            return [{"type": "text", "text": articles_text}]
        
        elif name == "get_article":
            slug = arguments["slug"]
            result = await client.get_article(slug)
            article = result.get("article", {})
            
            article_text = f"**{article['title']}**\n"
            article_text += f"By: {article['author']['username']}\n"
            article_text += f"Slug: {article['slug']}\n"
            article_text += f"Description: {article['description']}\n\n"
            article_text += f"**Content:**\n{article['body']}\n\n"
            article_text += f"Tags: {', '.join(article.get('tagList', []))}\n"
            article_text += f"Favorites: {article['favoritesCount']}\n"
            article_text += f"Created: {article['createdAt']}\n"
            article_text += f"Updated: {article['updatedAt']}\n"
            
            return [{"type": "text", "text": article_text}]
        
        elif name == "get_article_comments":
            slug = arguments["slug"]
            result = await client.get_article_comments(slug)
            comments = result.get("comments", [])
            
            if not comments:
                return [{"type": "text", "text": f"No comments found for article '{slug}'"}]
            
            comments_text = f"Comments for article '{slug}' ({len(comments)} total):\n\n"
            
            for comment in comments:
                comments_text += f"**{comment['author']['username']}** ({comment['createdAt']}):\n"
                comments_text += f"{comment['body']}\n\n"
            
            return [{"type": "text", "text": comments_text}]
        
        elif name == "get_profile":
            username = arguments["username"]
            result = await client.get_profile(username)
            profile = result.get("profile", {})
            
            profile_text = f"**Profile: {profile['username']}**\n"
            if profile.get("bio"):
                profile_text += f"Bio: {profile['bio']}\n"
            if profile.get("image"):
                profile_text += f"Image: {profile['image']}\n"
            profile_text += f"Following: {'Yes' if profile.get('following') else 'No'}\n"
            
            return [{"type": "text", "text": profile_text}]
        
        elif name == "get_tags":
            result = await client.get_tags()
            tags = result.get("tags", [])
            
            if not tags:
                return [{"type": "text", "text": "No tags found"}]
            
            tags_text = f"Available tags ({len(tags)} total):\n"
            tags_text += ", ".join(tags)
            
            return [{"type": "text", "text": tags_text}]
        
        elif name == "search_articles":
            query = arguments["query"]
            limit = arguments.get("limit", 10)
            result = await client.search_articles(query, limit)
            
            articles = result.get("articles", [])
            if not articles:
                return [{"type": "text", "text": f"No articles found matching '{query}'"}]
            
            search_text = f"Search results for '{query}' ({len(articles)} found):\n\n"
            
            for article in articles:
                search_text += f"**{article['title']}** (by {article['author']['username']})\n"
                search_text += f"Slug: {article['slug']}\n"  
                search_text += f"Description: {article['description']}\n"
                search_text += f"Tags: {', '.join(article.get('tagList', []))}\n\n"
            
            return [{"type": "text", "text": search_text}]
        
        elif name == "health_check":
            result = await client.health_check()
            
            health_text = f"**API Health Status**\n"
            health_text += f"Status: {result.get('status', 'unknown')}\n"
            health_text += f"Message: {result.get('message', 'No message')}\n"
            health_text += f"Timestamp: {result.get('timestamp', 'Unknown')}\n"
            health_text += f"Base URL: {client.base_url}\n"
            
            return [{"type": "text", "text": health_text}]
        
        else:
            return [{"type": "text", "text": f"Unknown tool: {name}"}]
            
    except Exception as e:
        error_msg = f"Error executing {name}: {str(e)}"
        return [{"type": "text", "text": error_msg}]

async def main():
    """Main entry point for the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())