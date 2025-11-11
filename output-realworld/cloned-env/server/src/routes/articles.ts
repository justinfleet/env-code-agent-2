import express from 'express';
import db from '../lib/db';
import { authenticateToken, optionalAuth, AuthRequest } from '../lib/auth';
import { formatArticle, createSlug } from '../lib/utils';

const router = express.Router();

// Helper function to get article tags
function getArticleTags(articleId: number): string[] {
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN article_tags at ON t.id = at.tag_id
    WHERE at.article_id = ?
  `).all(articleId);
  
  return tags.map((tag: any) => tag.name);
}

// Helper function to check if user favorited article
function isArticleFavorited(userId: number | undefined, articleId: number): boolean {
  if (!userId) return false;
  
  const favorite = db.prepare(`
    SELECT 1 FROM favorites 
    WHERE user_id = ? AND article_id = ?
  `).get(userId, articleId);
  
  return !!favorite;
}

// Helper function to check if user follows author
function isUserFollowing(userId: number | undefined, authorId: number): boolean {
  if (!userId || userId === authorId) return false;
  
  const follow = db.prepare(`
    SELECT 1 FROM follows 
    WHERE follower_id = ? AND following_id = ?
  `).get(userId, authorId);
  
  return !!follow;
}

// GET /api/articles - List articles
router.get('/', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { tag, author, favorited, limit = '20', offset = '0' } = req.query;
    
    let query = `
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (tag) {
      query += ` JOIN article_tags at ON a.id = at.article_id JOIN tags t ON at.tag_id = t.id`;
      conditions.push('t.name = ?');
      params.push(tag);
    }
    
    if (author) {
      conditions.push('u.username = ?');
      params.push(author);
    }
    
    if (favorited) {
      query += ` JOIN favorites f ON a.id = f.article_id JOIN users fu ON f.user_id = fu.id`;
      conditions.push('fu.username = ?');
      params.push(favorited);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));
    
    const articles = db.prepare(query).all(...params);
    
    const formattedArticles = articles.map((article: any) => {
      const tagList = getArticleTags(article.id);
      const favorited = isArticleFavorited(req.user?.id, article.id);
      const following = isUserFollowing(req.user?.id, article.author_id);
      
      return formatArticle(
        { ...article, tagList },
        { username: article.username, bio: article.bio, image: article.author_image },
        favorited,
        following
      );
    });
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT a.id) as count FROM articles a JOIN users u ON a.author_id = u.id';
    const countConditions: string[] = [];
    const countParams: any[] = [];
    
    if (tag) {
      countQuery += ` JOIN article_tags at ON a.id = at.article_id JOIN tags t ON at.tag_id = t.id`;
      countConditions.push('t.name = ?');
      countParams.push(tag);
    }
    
    if (author) {
      countConditions.push('u.username = ?');
      countParams.push(author);
    }
    
    if (favorited) {
      countQuery += ` JOIN favorites f ON a.id = f.article_id JOIN users fu ON f.user_id = fu.id`;
      countConditions.push('fu.username = ?');
      countParams.push(favorited);
    }
    
    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }
    
    const countResult = db.prepare(countQuery).get(...countParams) as any;
    
    res.json({
      articles: formattedArticles,
      articlesCount: countResult.count
    });
  } catch (error) {
    console.error('List articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/feed - Get user feed
router.get('/feed', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { limit = '20', offset = '0' } = req.query;
    
    const articles = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      JOIN follows f ON u.id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(limit as string), parseInt(offset as string));
    
    const formattedArticles = articles.map((article: any) => {
      const tagList = getArticleTags(article.id);
      const favorited = isArticleFavorited(req.user?.id, article.id);
      
      return formatArticle(
        { ...article, tagList },
        { username: article.username, bio: article.bio, image: article.author_image },
        favorited,
        true // Following is true in feed
      );
    });
    
    const countResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM articles a
      JOIN follows f ON a.author_id = f.following_id
      WHERE f.follower_id = ?
    `).get(req.user.id) as any;
    
    res.json({
      articles: formattedArticles,
      articlesCount: countResult.count
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/:slug - Get article by slug
router.get('/:slug', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    
    const article = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.slug = ?
    `).get(slug);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const tagList = getArticleTags(article.id);
    const favorited = isArticleFavorited(req.user?.id, article.id);
    const following = isUserFollowing(req.user?.id, article.author_id);
    
    const formattedArticle = formatArticle(
      { ...article, tagList },
      { username: article.username, bio: article.bio, image: article.author_image },
      favorited,
      following
    );
    
    res.json({ article: formattedArticle });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/articles - Create article
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { article } = req.body;
    if (!article || !article.title || !article.description || !article.body) {
      return res.status(400).json({ error: 'Title, description, and body are required' });
    }

    const slug = createSlug(article.title);
    
    // Check if slug already exists
    const existingArticle = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
    if (existingArticle) {
      return res.status(409).json({ error: 'Article with similar title already exists' });
    }

    // Create article
    const result = db.prepare(`
      INSERT INTO articles (slug, title, description, body, author_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(slug, article.title, article.description, article.body, req.user.id);

    const articleId = result.lastInsertRowid as number;

    // Handle tags
    if (article.tagList && Array.isArray(article.tagList)) {
      for (const tagName of article.tagList) {
        if (tagName.trim()) {
          // Get or create tag
          let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
          if (!tag) {
            const tagResult = db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName);
            tag = { id: tagResult.lastInsertRowid };
          }
          
          // Link article to tag
          db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)').run(articleId, tag.id);
        }
      }
    }

    // Get created article with author info
    const createdArticle = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(articleId);

    const tagList = getArticleTags(articleId);
    
    const formattedArticle = formatArticle(
      { ...createdArticle, tagList },
      { username: createdArticle.username, bio: createdArticle.bio, image: createdArticle.author_image },
      false,
      false
    );

    res.status(201).json({ article: formattedArticle });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/articles/:slug - Update article
router.put('/:slug', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { slug } = req.params;
    const { article } = req.body;

    if (!article) {
      return res.status(400).json({ error: 'Article data required' });
    }

    // Get existing article
    const existingArticle = db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug);
    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if user is the author
    if (existingArticle.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this article' });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let newSlug = slug;

    if (article.title !== undefined) {
      newSlug = createSlug(article.title);
      if (newSlug !== slug) {
        // Check if new slug already exists
        const slugExists = db.prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').get(newSlug, existingArticle.id);
        if (slugExists) {
          return res.status(409).json({ error: 'Article with similar title already exists' });
        }
      }
      updates.push('title = ?', 'slug = ?');
      values.push(article.title, newSlug);
    }

    if (article.description !== undefined) {
      updates.push('description = ?');
      values.push(article.description);
    }

    if (article.body !== undefined) {
      updates.push('body = ?');
      values.push(article.body);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(existingArticle.id);

      const query = `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...values);
    }

    // Get updated article with author info
    const updatedArticle = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(existingArticle.id);

    const tagList = getArticleTags(existingArticle.id);
    const favorited = isArticleFavorited(req.user?.id, existingArticle.id);

    const formattedArticle = formatArticle(
      { ...updatedArticle, tagList },
      { username: updatedArticle.username, bio: updatedArticle.bio, image: updatedArticle.author_image },
      favorited,
      false
    );

    res.json({ article: formattedArticle });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/articles/:slug - Delete article
router.delete('/:slug', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { slug } = req.params;

    const article = db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if user is the author
    if (article.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this article' });
    }

    // Delete article (cascading will handle comments, favorites, and article_tags)
    db.prepare('DELETE FROM articles WHERE id = ?').run(article.id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;