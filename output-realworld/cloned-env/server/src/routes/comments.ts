import express from 'express';
import db from '../lib/db';
import { authenticateToken, optionalAuth, AuthRequest } from '../lib/auth';
import { formatComment } from '../lib/utils';

const router = express.Router({ mergeParams: true });

// Helper function to check if user follows author
function isUserFollowing(userId: number | undefined, authorId: number): boolean {
  if (!userId || userId === authorId) return false;
  
  const follow = db.prepare(`
    SELECT 1 FROM follows 
    WHERE follower_id = ? AND following_id = ?
  `).get(userId, authorId);
  
  return !!follow;
}

// GET /api/articles/:slug/comments - Get comments for article
router.get('/', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    
    // Get article first
    const article = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const comments = db.prepare(`
      SELECT c.*, u.username, u.bio, u.image
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.article_id = ?
      ORDER BY c.created_at ASC
    `).all(article.id);
    
    const formattedComments = comments.map((comment: any) => {
      const following = isUserFollowing(req.user?.id, comment.author_id);
      return formatComment(comment, comment, following);
    });
    
    res.json({ comments: formattedComments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/articles/:slug/comments - Add comment to article
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { slug } = req.params;
    const { comment } = req.body;
    
    if (!comment || !comment.body) {
      return res.status(400).json({ error: 'Comment body is required' });
    }
    
    // Get article
    const article = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Create comment
    const result = db.prepare(`
      INSERT INTO comments (body, article_id, author_id)
      VALUES (?, ?, ?)
    `).run(comment.body, article.id, req.user.id);
    
    // Get created comment with author info
    const createdComment = db.prepare(`
      SELECT c.*, u.username, u.bio, u.image
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);
    
    const formattedComment = formatComment(createdComment, createdComment, false);
    
    res.status(201).json({ comment: formattedComment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/articles/:slug/comments/:id - Delete comment
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { slug, id } = req.params;
    
    // Get article
    const article = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Get comment
    const comment = db.prepare(`
      SELECT * FROM comments 
      WHERE id = ? AND article_id = ?
    `).get(id, article.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user is the comment author
    if (comment.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    // Delete comment
    db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;