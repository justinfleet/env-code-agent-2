# RealWorld API Documentation

A RESTful API implementation following the RealWorld specification for a social blogging platform.

## Base URL
- **Local Development**: http://localhost:3002/api
- **Production**: Set via your deployment configuration

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication & Users

#### POST /api/users
Register a new user account.

**Request:**
```json
{
  "user": {
    "username": "johndoe",
    "email": "john@example.com", 
    "password": "password123"
  }
}
```

**Response:**
```json
{
  "user": {
    "email": "john@example.com",
    "token": "jwt-token-here",
    "username": "johndoe",
    "bio": "",
    "image": ""
  }
}
```

#### POST /api/users/login
Authenticate user with email and password.

**Request:**
```json
{
  "user": {
    "email": "john@example.com",
    "password": "password123"
  }
}
```

**Response:**
```json
{
  "user": {
    "email": "john@example.com",
    "token": "jwt-token-here",
    "username": "johndoe",
    "bio": "I love writing!",
    "image": "https://example.com/john.jpg"
  }
}
```

#### GET /api/user
Get current authenticated user profile.
**Requires authentication.**

**Response:**
```json
{
  "user": {
    "email": "john@example.com",
    "token": "jwt-token-here",
    "username": "johndoe",
    "bio": "I love writing!",
    "image": "https://example.com/john.jpg"
  }
}
```

#### PUT /api/user
Update current user profile.
**Requires authentication.**

**Request:**
```json
{
  "user": {
    "email": "newemail@example.com",
    "username": "newusername",
    "password": "newpassword",
    "image": "https://example.com/newimage.jpg",
    "bio": "Updated bio"
  }
}
```

**Response:**
```json
{
  "user": {
    "email": "newemail@example.com",
    "token": "jwt-token-here",
    "username": "newusername", 
    "bio": "Updated bio",
    "image": "https://example.com/newimage.jpg"
  }
}
```

### Profiles

#### GET /api/profiles/:username
Get user profile by username.

**Response:**
```json
{
  "profile": {
    "username": "johndoe",
    "bio": "I love writing!",
    "image": "https://example.com/john.jpg",
    "following": false
  }
}
```

#### POST /api/profiles/:username/follow
Follow a user.
**Requires authentication.**

**Response:**
```json
{
  "profile": {
    "username": "johndoe",
    "bio": "I love writing!",
    "image": "https://example.com/john.jpg",
    "following": true
  }
}
```

#### DELETE /api/profiles/:username/follow
Unfollow a user.
**Requires authentication.**

**Response:**
```json
{
  "profile": {
    "username": "johndoe",
    "bio": "I love writing!",
    "image": "https://example.com/john.jpg",
    "following": false
  }
}
```

### Articles

#### GET /api/articles
List articles with optional filtering.

**Query Parameters:**
- `tag`: Filter by tag
- `author`: Filter by author username
- `favorited`: Filter by user who favorited
- `limit`: Number of articles to return (default: 20)
- `offset`: Number of articles to skip (default: 0)

**Response:**
```json
{
  "articles": [
    {
      "slug": "how-to-train-your-dragon",
      "title": "How to train your dragon",
      "description": "Ever wonder how?",
      "body": "It takes a Jacobian. More details...",
      "tagList": ["programming"],
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "favorited": false,
      "favoritesCount": 2,
      "author": {
        "username": "johndoe",
        "bio": "I love writing!",
        "image": "https://example.com/john.jpg",
        "following": false
      }
    }
  ],
  "articlesCount": 1
}
```

#### GET /api/articles/feed
Get articles from followed users.
**Requires authentication.**

**Query Parameters:**
- `limit`: Number of articles to return (default: 20)
- `offset`: Number of articles to skip (default: 0)

**Response:** Same format as GET /api/articles

#### GET /api/articles/:slug
Get single article by slug.

**Response:**
```json
{
  "article": {
    "slug": "how-to-train-your-dragon",
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "It takes a Jacobian. More details...",
    "tagList": ["programming"],
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "favorited": false,
    "favoritesCount": 2,
    "author": {
      "username": "johndoe",
      "bio": "I love writing!",
      "image": "https://example.com/john.jpg",
      "following": false
    }
  }
}
```

#### POST /api/articles
Create new article.
**Requires authentication.**

**Request:**
```json
{
  "article": {
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "It takes a Jacobian. More details...",
    "tagList": ["programming", "tutorial"]
  }
}
```

**Response:** Same format as GET /api/articles/:slug

#### PUT /api/articles/:slug
Update existing article.
**Requires authentication. Only article author can update.**

**Request:**
```json
{
  "article": {
    "title": "Updated title",
    "description": "Updated description",
    "body": "Updated body content"
  }
}
```

**Response:** Same format as GET /api/articles/:slug

#### DELETE /api/articles/:slug
Delete article.
**Requires authentication. Only article author can delete.**

**Response:** 204 No Content

### Comments

#### GET /api/articles/:slug/comments
Get comments for article.

**Response:**
```json
{
  "comments": [
    {
      "id": 1,
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "body": "Great article! Very helpful.",
      "author": {
        "username": "janedoe",
        "bio": "Tech enthusiast",
        "image": "https://example.com/jane.jpg",
        "following": false
      }
    }
  ]
}
```

#### POST /api/articles/:slug/comments
Add comment to article.
**Requires authentication.**

**Request:**
```json
{
  "comment": {
    "body": "Thanks for sharing this!"
  }
}
```

**Response:**
```json
{
  "comment": {
    "id": 2,
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "body": "Thanks for sharing this!",
    "author": {
      "username": "johndoe",
      "bio": "I love writing!",
      "image": "https://example.com/john.jpg",
      "following": false
    }
  }
}
```

#### DELETE /api/articles/:slug/comments/:id
Delete comment.
**Requires authentication. Only comment author can delete.**

**Response:** 204 No Content

### Favorites

#### POST /api/articles/:slug/favorite
Favorite an article.
**Requires authentication.**

**Response:** Same format as GET /api/articles/:slug with `favorited: true`

#### DELETE /api/articles/:slug/favorite
Unfavorite an article.
**Requires authentication.**

**Response:** Same format as GET /api/articles/:slug with `favorited: false`

### Tags

#### GET /api/tags
Get all tags.

**Response:**
```json
{
  "tags": ["react", "javascript", "programming", "web-development", "tutorial"]
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` Bad Request - Invalid request data
- `401` Unauthorized - Authentication required
- `403` Forbidden - Access denied
- `404` Not Found - Resource not found
- `409` Conflict - Resource conflict (e.g., duplicate email)
- `422` Unprocessable Entity - Validation errors
- `500` Internal Server Error - Server error

## Health Check

#### GET /health
Check API server health.

**Response:**
```json
{
  "status": "ok",
  "message": "RealWorld API is running",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```