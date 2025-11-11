import express from 'express';
import db from '../lib/db';

const router = express.Router();

// GET /api/tags - Get all tags
router.get('/', (req, res) => {
  try {
    const tags = db.prepare(`
      SELECT DISTINCT t.name 
      FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      ORDER BY t.name
    `).all();
    
    const tagNames = tags.map((tag: any) => tag.name);
    
    res.json({ tags: tagNames });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;