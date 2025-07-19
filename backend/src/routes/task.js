import express from 'express';
import pool from '../db.js';
import nodemailer from 'nodemailer';
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

// Helper: Send email
async function sendMail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: `Flick <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
}

// Assign task
router.post('/assign', authenticateToken, async (req, res) => {
  const { project_id, assigned_to, title, description, deadline } = req.body;
  try {
    // Only teamlead or project creator can assign
    const [member] = await pool.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, req.user.id]);
    if (member.length === 0 || (member[0].role !== 'teamlead' && member[0].role !== 'manager')) return res.status(403).json({ message: 'Not allowed' });
    const [result] = await pool.query('INSERT INTO tasks (project_id, assigned_by, assigned_to, title, description, deadline) VALUES (?, ?, ?, ?, ?, ?)', [project_id, req.user.id, assigned_to, title, description, deadline]);
    // Notify assignee
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [assigned_to]);
    if (users.length > 0) {
      await sendMail(users[0].email, 'Flick Task Assigned', `You have a new task: ${title}\nDeadline: ${deadline}`);
    }
    res.json({ taskId: result.insertId, message: 'Task assigned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.put('/:taskId/status', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body; // 'pending'|'done'
  try {
    // Only assignee can update
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) return res.status(404).json({ message: 'Task not found' });
    if (tasks[0].assigned_to !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
    // Notify assigner
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [tasks[0].assigned_by]);
    if (users.length > 0) {
      await sendMail(users[0].email, 'Flick Task Status Update', `Task "${tasks[0].title}" marked as ${status}.`);
    }
    res.json({ message: 'Task status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 