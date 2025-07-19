import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Search messages
router.get('/messages', authenticateToken, async (req, res) => {
  const { q } = req.query;
  try {
    const [results] = await pool.query(
      `SELECT m.*, u.username, u.display_name FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.content LIKE ? AND m.is_deleted = 0
       ORDER BY m.created_at DESC LIMIT 50`,
      [`%${q}%`]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search files
router.get('/files', authenticateToken, async (req, res) => {
  const { q } = req.query;
  try {
    const [results] = await pool.query(
      `SELECT * FROM media_files WHERE filename LIKE ? OR original_name LIKE ? ORDER BY uploaded_at DESC LIMIT 50`,
      [`%${q}%`, `%${q}%`]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/users', authenticateToken, async (req, res) => {
  const { q } = req.query;
  try {
    const [results] = await pool.query(
      `SELECT id, username, display_name, email FROM users WHERE (username LIKE ? OR display_name LIKE ? OR email LIKE ?) AND is_deleted = 0 LIMIT 50`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search projects
router.get('/projects', authenticateToken, async (req, res) => {
  const { q } = req.query;
  try {
    const [results] = await pool.query(
      `SELECT p.*, o.name as organization_name FROM projects p
       JOIN organizations o ON p.organization_id = o.id
       WHERE p.name LIKE ? OR o.name LIKE ?
       ORDER BY p.created_at DESC LIMIT 50`,
      [`%${q}%`, `%${q}%`]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 