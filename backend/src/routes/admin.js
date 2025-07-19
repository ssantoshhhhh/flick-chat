import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

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

// Get audit logs (admin only)
router.get('/audit-logs', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) return res.status(403).json({ message: 'Admin only' });
  const { userId, action, limit = 100 } = req.query;
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  let params = [];
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit));
  try {
    const [logs] = await pool.query(query, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 