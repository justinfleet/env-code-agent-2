import express from 'express';
import db from '../lib/db';
import { generateToken, hashPassword, verifyPassword, authenticateToken, AuthRequest } from '../lib/auth';
import { formatUser } from '../lib/utils';

const router = express.Router();

// POST /api/users - Register
router.post('/', (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user || !user.username || !user.email || !user.password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(user.email, user.username);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    // Create new user
    const passwordHash = hashPassword(user.password);
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, bio, image)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.username, user.email, passwordHash, null, null);

    // Get the created user
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newUser);

    res.status(201).json({
      user: formatUser(newUser, token)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/login - Login
router.post('/login', (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user || !user.email || !user.password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const dbUser = db.prepare('SELECT * FROM users WHERE email = ?').get(user.email);
    if (!dbUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    if (!verifyPassword(user.password, dbUser.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(dbUser);

    res.json({
      user: formatUser(dbUser, token)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;