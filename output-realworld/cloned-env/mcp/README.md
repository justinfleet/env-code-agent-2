# RealWorld MCP Server

Model Context Protocol (MCP) server for the RealWorld API, providing LLMs with tools to interact with articles, users, profiles, comments, and tags.

## Setup

1. **Install uv** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Install dependencies**:
   ```bash
   cd mcp
   uv install
   ```

3. **Set environment variables** (optional):
   ```bash
   export APP_ENV=local  # or "production"
   export API_BASE_URL=http://localhost:3002
   ```

## Running the MCP Server

### Standalone
```bash
cd mcp
uv run python -m realworld_mcp.server
```

### With mprocs (from root directory)
```bash
mprocs  # This will start both server and MCP
```

## Available Tools

The MCP server provides the following tools for LLM interaction:

### Articles
- **get_articles**: Get articles with optional filtering by tag, author, favorited user
- **get_article**: Get a specific article by slug
- **search_articles**: Search articles by title, description, or content

### Comments
- **get_article_comments**: Get all comments for a specific article

### Users & Profiles
- **get_profile**: Get user profile information by username

### Tags
- **get_tags**: Get all available article tags

### System
- **health_check**: Check API server health and connectivity

## Environment Variables

- `APP_ENV`: Set to "local" for development, "production" for production
- `API_BASE_URL`: Base URL of the RealWorld API server (default: http://localhost:3002)

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "realworld": {
      "command": "uv",
      "args": ["run", "python", "-m", "realworld_mcp.server"],
      "cwd": "/path/to/realworld-api-environment/mcp",
      "env": {
        "APP_ENV": "local",
        "API_BASE_URL": "http://localhost:3002"
      }
    }
  }
}
```

## Example Queries

Once connected, you can ask Claude:

- "Show me the latest articles"
- "Get the article with slug 'how-to-train-your-dragon'"
- "Search for articles about JavaScript"
- "Show me all available tags"
- "Get the profile for user 'johndoe'"
- "What are the comments on the React article?"

## Development

The MCP server automatically detects the environment and connects to the appropriate API endpoint:

- **Local development**: http://localhost:3002/api
- **Production**: Your configured production API URL

Make sure your RealWorld API server is running before starting the MCP server.