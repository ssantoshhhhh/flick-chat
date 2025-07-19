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

// Get latest analytics snapshot for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM team_analytics WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [projectId]);
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get analytics history for a project
router.get('/project/:projectId/history', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM team_analytics WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 