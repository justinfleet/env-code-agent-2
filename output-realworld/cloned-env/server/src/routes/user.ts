import express from 'express';
import db from '../lib/db';
import { authenticateToken, AuthRequest, generateToken, hashPassword } from '../lib/auth';
import { formatUser } from '../lib/utils';

const router = express.Router();

// GET /api/user - Get current user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateToken(dbUser);

    res.json({
      user: formatUser(dbUser, token)
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user - Update user
router.put('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { user } = req.body;
    if (!user) {
      return res.status(400).json({ error: 'User data required' });
    }

    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for unique constraints if email or username is being changed
    if (user.email && user.email !== currentUser.email) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(user.email, req.user.id);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already taken' });
      }
    }

    if (user.username && user.username !== currentUser.username) {
      const existingUsername = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(user.username, req.user.id);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (user.email !== undefined) {
      updates.push('email = ?');
      values.push(user.email);
    }
    if (user.username !== undefined) {
      updates.push('username = ?');
      values.push(user.username);
    }
    if (user.bio !== undefined) {
      updates.push('bio = ?');
      values.push(user.bio);
    }
    if (user.image !== undefined) {
      updates.push('image = ?');
      values.push(user.image);
    }
    if (user.password) {
      updates.push('password_hash = ?');
      values.push(hashPassword(user.password));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    if (updates.length === 1) {
      // Only updated_at, no actual changes
      const token = generateToken(currentUser);
      return res.json({
        user: formatUser(currentUser, token)
      });
    }

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    // Get updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const token = generateToken(updatedUser);

    res.json({
      user: formatUser(updatedUser, token)
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;