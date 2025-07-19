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

// Create onboarding checklist
router.post('/checklist', authenticateToken, async (req, res) => {
  const { project_id, name } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO onboarding_checklists (project_id, name, created_by) VALUES (?, ?, ?)',
      [project_id, name, req.user.id]
    );
    res.json({ checklistId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add task to checklist
router.post('/task', authenticateToken, async (req, res) => {
  const { checklist_id, description, assigned_to } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO onboarding_tasks (checklist_id, description, assigned_to) VALUES (?, ?, ?)',
      [checklist_id, description, assigned_to]
    );
    res.json({ taskId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List checklists for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [lists] = await pool.query('SELECT * FROM onboarding_checklists WHERE project_id = ?', [projectId]);
    res.json(lists);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List tasks for a checklist
router.get('/checklist/:checklistId/tasks', authenticateToken, async (req, res) => {
  const { checklistId } = req.params;
  try {
    const [tasks] = await pool.query('SELECT * FROM onboarding_tasks WHERE checklist_id = ?', [checklistId]);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark onboarding task as complete
router.post('/task/:taskId/complete', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  try {
    await pool.query('UPDATE onboarding_tasks SET completed = 1, completed_at = NOW() WHERE id = ? AND assigned_to = ?', [taskId, req.user.id]);
    res.json({ message: 'Task completed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 