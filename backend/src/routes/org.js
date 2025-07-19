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

// Create organization
router.post('/organization', authenticateToken, async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO organizations (name, owner_id) VALUES (?, ?)', [name, req.user.id]);
    res.json({ orgId: result.insertId, message: 'Organization created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List user's organizations
router.get('/organizations', authenticateToken, async (req, res) => {
  try {
    const [orgs] = await pool.query(
      `SELECT o.id, o.name, o.owner_id, o.created_at
       FROM organizations o
       LEFT JOIN projects p ON o.id = p.organization_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE o.owner_id = ? OR pm.user_id = ?
       GROUP BY o.id`,
      [req.user.id, req.user.id]
    );
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project in organization
router.post('/project', authenticateToken, async (req, res) => {
  const { organization_id, name } = req.body;
  try {
    // Only org owner can create project
    const [orgs] = await pool.query('SELECT * FROM organizations WHERE id = ? AND owner_id = ?', [organization_id, req.user.id]);
    if (orgs.length === 0) return res.status(403).json({ message: 'Not org owner' });
    const [result] = await pool.query('INSERT INTO projects (organization_id, name, created_by) VALUES (?, ?, ?)', [organization_id, name, req.user.id]);
    res.json({ projectId: result.insertId, message: 'Project created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List projects in organization
router.get('/organization/:orgId/projects', authenticateToken, async (req, res) => {
  const { orgId } = req.params;
  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE organization_id = ?', [orgId]);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/invite user to project (by email or username)
router.post('/project/:projectId/invite', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { email, username, role } = req.body;
  try {
    // Only project creator or org owner can invite
    const [project] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (project.length === 0) return res.status(404).json({ message: 'Project not found' });
    const [org] = await pool.query('SELECT * FROM organizations WHERE id = ?', [project[0].organization_id]);
    if (project[0].created_by !== req.user.id && org[0].owner_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    // Find user by email or username
    let user;
    if (email) {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) return res.status(404).json({ message: 'User not found' });
      user = users[0];
    } else if (username) {
      const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      if (users.length === 0) return res.status(404).json({ message: 'User not found' });
      user = users[0];
    } else {
      return res.status(400).json({ message: 'Email or username required' });
    }
    // Add to project_members
    await pool.query('INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [projectId, user.id, role || 'member']);
    // Send invite email
    await sendMail(user.email, 'Flick Project Invitation', `You have been invited to project "${project[0].name}" as ${role || 'member'}.`);
    res.json({ message: 'User invited' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change user role in project
router.put('/project/:projectId/member/:userId/role', authenticateToken, async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  try {
    // Only project creator or org owner can change role
    const [project] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (project.length === 0) return res.status(404).json({ message: 'Project not found' });
    const [org] = await pool.query('SELECT * FROM organizations WHERE id = ?', [project[0].organization_id]);
    if (project[0].created_by !== req.user.id && org[0].owner_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    await pool.query('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?', [role, projectId, userId]);
    // Notify user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length > 0) {
      await sendMail(users[0].email, 'Flick Project Role Changed', `Your role in project "${project[0].name}" is now ${role}.`);
    }
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove user from project
router.post('/project/:projectId/member/:userId/remove', authenticateToken, async (req, res) => {
  const { projectId, userId } = req.params;
  try {
    // Only project creator or org owner can remove
    const [project] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (project.length === 0) return res.status(404).json({ message: 'Project not found' });
    const [org] = await pool.query('SELECT * FROM organizations WHERE id = ?', [project[0].organization_id]);
    if (project[0].created_by !== req.user.id && org[0].owner_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    await pool.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    // Notify user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length > 0) {
      await sendMail(users[0].email, 'Flick Project Removal', `You have been removed from project "${project[0].name}".`);
    }
    res.json({ message: 'User removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 