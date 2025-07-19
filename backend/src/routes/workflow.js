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

// Create a workflow
router.post('/create', authenticateToken, async (req, res) => {
  const { project_id, name, definition } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO workflows (project_id, name, definition, created_by) VALUES (?, ?, ?, ?)',
      [project_id, name, JSON.stringify(definition), req.user.id]
    );
    res.json({ workflowId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List workflows for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [flows] = await pool.query('SELECT * FROM workflows WHERE project_id = ?', [projectId]);
    res.json(flows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a trigger to a workflow
router.post('/:workflowId/trigger', authenticateToken, async (req, res) => {
  const { workflowId } = req.params;
  const { trigger_type, trigger_value } = req.body;
  try {
    await pool.query(
      'INSERT INTO workflow_triggers (workflow_id, trigger_type, trigger_value) VALUES (?, ?, ?)',
      [workflowId, trigger_type, trigger_value]
    );
    res.json({ message: 'Trigger added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List triggers for a workflow
router.get('/:workflowId/triggers', authenticateToken, async (req, res) => {
  const { workflowId } = req.params;
  try {
    const [trigs] = await pool.query('SELECT * FROM workflow_triggers WHERE workflow_id = ?', [workflowId]);
    res.json(trigs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manually trigger a workflow
router.post('/:workflowId/trigger-now', authenticateToken, async (req, res) => {
  const { workflowId } = req.params;
  try {
    // For demo: just log the run, real execution logic would go here
    const [result] = await pool.query(
      'INSERT INTO workflow_runs (workflow_id, triggered_by, status) VALUES (?, ?, ?)',
      [workflowId, req.user.id, 'pending']
    );
    res.json({ runId: result.insertId, message: 'Workflow triggered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get workflow run history
router.get('/:workflowId/runs', authenticateToken, async (req, res) => {
  const { workflowId } = req.params;
  try {
    const [runs] = await pool.query('SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC', [workflowId]);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 