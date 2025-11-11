import express from 'express';
import db from '../lib/db';
import { authenticateToken, AuthRequest } from '../lib/auth';
import { formatArticle } from '../lib/utils';

const router = express.Router({ mergeParams: true });

// Helper function to get article tags
function getArticleTags(articleId: number): string[] {
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN article_tags at ON t.id = at.tag_id
    WHERE at.article_id = ?
  `).all(articleId);
  
  return tags.map((tag: any) => tag.name);
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

// POST /api/articles/:slug/favorite - Favorite article
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { slug } = req.params;
    
    // Get article
    const article = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.slug = ?
    `).get(slug);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Check if already favorited
    const existingFavorite = db.prepare(`
      SELECT 1 FROM favorites 
      WHERE user_id = ? AND article_id = ?
    `).get(req.user.id, article.id);
    
    if (!existingFavorite) {
      // Add favorite
      db.prepare(`
        INSERT INTO favorites (user_id, article_id)
        VALUES (?, ?)
      `).run(req.user.id, article.id);
      
      // Update favorites count
      db.prepare(`
        UPDATE articles 
        SET favorites_count = favorites_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(article.id);
    }
    
    // Get updated article
    const updatedArticle = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(article.id);
    
    const tagList = getArticleTags(article.id);
    const following = isUserFollowing(req.user?.id, article.author_id);
    
    const formattedArticle = formatArticle(
      { ...updatedArticle, tagList },
      { username: updatedArticle.username, bio: updatedArticle.bio, image: updatedArticle.author_image },
      true, // Now favorited
      following
    );
    
    res.json({ article: formattedArticle });
  } catch (error) {
    console.error('Favorite article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/articles/:slug/favorite - Unfavorite article
router.delete('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { slug } = req.params;
    
    // Get article
    const article = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.slug = ?
    `).get(slug);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Remove favorite
    const result = db.prepare(`
      DELETE FROM favorites 
      WHERE user_id = ? AND article_id = ?
    `).run(req.user.id, article.id);
    
    if (result.changes > 0) {
      // Update favorites count
      db.prepare(`
        UPDATE articles 
        SET favorites_count = CASE 
          WHEN favorites_count > 0 THEN favorites_count - 1 
          ELSE 0 
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(article.id);
    }
    
    // Get updated article
    const updatedArticle = db.prepare(`
      SELECT a.*, u.username, u.bio, u.image as author_image
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(article.id);
    
    const tagList = getArticleTags(article.id);
    const following = isUserFollowing(req.user?.id, article.author_id);
    
    const formattedArticle = formatArticle(
      { ...updatedArticle, tagList },
      { username: updatedArticle.username, bio: updatedArticle.bio, image: updatedArticle.author_image },
      false, // No longer favorited
      following
    );
    
    res.json({ article: formattedArticle });
  } catch (error) {
    console.error('Unfavorite article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;