import express from 'express';
import db from '../lib/db';
import { authenticateToken, optionalAuth, AuthRequest } from '../lib/auth';
import { formatProfile } from '../lib/utils';

const router = express.Router();

// GET /api/profiles/:username - Get profile
router.get('/:username', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { username } = req.params;

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let following = false;
    if (req.user) {
      const followRecord = db.prepare(`
        SELECT 1 FROM follows 
        WHERE follower_id = ? AND following_id = ?
      `).get(req.user.id, user.id);
      following = !!followRecord;
    }

    res.json({
      profile: formatProfile(user, following)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profiles/:username/follow - Follow user
router.post('/:username/follow', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { username } = req.params;

    const targetUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!targetUser) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = db.prepare(`
      SELECT 1 FROM follows 
      WHERE follower_id = ? AND following_id = ?
    `).get(req.user.id, targetUser.id);

    if (!existingFollow) {
      db.prepare(`
        INSERT INTO follows (follower_id, following_id)
        VALUES (?, ?)
      `).run(req.user.id, targetUser.id);
    }

    res.json({
      profile: formatProfile(targetUser, true)
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profiles/:username/follow - Unfollow user
router.delete('/:username/follow', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { username } = req.params;

    const targetUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!targetUser) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    db.prepare(`
      DELETE FROM follows 
      WHERE follower_id = ? AND following_id = ?
    `).run(req.user.id, targetUser.id);

    res.json({
      profile: formatProfile(targetUser, false)
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;