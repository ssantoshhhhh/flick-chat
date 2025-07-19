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

// Create a wiki page
router.post('/create', authenticateToken, async (req, res) => {
  const { project_id, title, content } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO project_wiki_pages (project_id, title, content, created_by, updated_by) VALUES (?, ?, ?, ?, ?)',
      [project_id, title, content, req.user.id, req.user.id]
    );
    res.json({ pageId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all wiki pages for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [pages] = await pool.query('SELECT * FROM project_wiki_pages WHERE project_id = ?', [projectId]);
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single wiki page
router.get('/:pageId', authenticateToken, async (req, res) => {
  const { pageId } = req.params;
  try {
    const [pages] = await pool.query('SELECT * FROM project_wiki_pages WHERE id = ?', [pageId]);
    if (pages.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(pages[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a wiki page (and save version)
router.put('/:pageId', authenticateToken, async (req, res) => {
  const { pageId } = req.params;
  const { content } = req.body;
  try {
    // Save version
    const [pages] = await pool.query('SELECT * FROM project_wiki_pages WHERE id = ?', [pageId]);
    if (pages.length === 0) return res.status(404).json({ message: 'Not found' });
    await pool.query(
      'INSERT INTO project_wiki_versions (wiki_page_id, content, updated_by) VALUES (?, ?, ?)',
      [pageId, pages[0].content, req.user.id]
    );
    // Update page
    await pool.query(
      'UPDATE project_wiki_pages SET content = ?, updated_by = ? WHERE id = ?',
      [content, req.user.id, pageId]
    );
    res.json({ message: 'Wiki page updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get version history for a wiki page
router.get('/:pageId/versions', authenticateToken, async (req, res) => {
  const { pageId } = req.params;
  try {
    const [versions] = await pool.query('SELECT * FROM project_wiki_versions WHERE wiki_page_id = ? ORDER BY updated_at DESC', [pageId]);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Revert to a previous version
router.post('/:pageId/revert', authenticateToken, async (req, res) => {
  const { pageId } = req.params;
  const { versionId } = req.body;
  try {
    const [versions] = await pool.query('SELECT * FROM project_wiki_versions WHERE id = ?', [versionId]);
    if (versions.length === 0) return res.status(404).json({ message: 'Version not found' });
    await pool.query('UPDATE project_wiki_pages SET content = ?, updated_by = ? WHERE id = ?', [versions[0].content, req.user.id, pageId]);
    res.json({ message: 'Wiki page reverted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a wiki page
router.delete('/:pageId', authenticateToken, async (req, res) => {
  const { pageId } = req.params;
  try {
    await pool.query('DELETE FROM project_wiki_pages WHERE id = ?', [pageId]);
    res.json({ message: 'Wiki page deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 