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

// Create a whiteboard session
router.post('/create', authenticateToken, async (req, res) => {
  const { project_id, name } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO whiteboards (project_id, name, created_by) VALUES (?, ?, ?)',
      [project_id, name, req.user.id]
    );
    res.json({ whiteboardId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List whiteboards for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [boards] = await pool.query('SELECT * FROM whiteboards WHERE project_id = ?', [projectId]);
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a whiteboard snapshot
router.post('/:whiteboardId/snapshot', authenticateToken, async (req, res) => {
  const { whiteboardId } = req.params;
  const { snapshot_data } = req.body;
  try {
    await pool.query(
      'INSERT INTO whiteboard_snapshots (whiteboard_id, snapshot_data, created_by) VALUES (?, ?, ?)',
      [whiteboardId, snapshot_data, req.user.id]
    );
    res.json({ message: 'Snapshot saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all snapshots for a whiteboard
router.get('/:whiteboardId/snapshots', authenticateToken, async (req, res) => {
  const { whiteboardId } = req.params;
  try {
    const [snaps] = await pool.query('SELECT * FROM whiteboard_snapshots WHERE whiteboard_id = ? ORDER BY created_at DESC', [whiteboardId]);
    res.json(snaps);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 