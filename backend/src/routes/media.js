import express from 'express';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import pool from '../db.js';

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

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'video/mp4', 'video/webm',
  'application/pdf'
];
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Upload media (image, file, voice)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const fileUrl = `/media/${req.file.filename}`;
  try {
    // Track upload in media_files
    await pool.query(
      'INSERT INTO media_files (filename, original_name, uploader_id) VALUES (?, ?, ?)',
      [req.file.filename, req.file.originalname, req.user.id]
    );
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: 'Upload tracked, but DB error' });
  }
});

// Delete media file (only uploader can delete)
router.delete('/delete/:filename', authenticateToken, async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  try {
    // Check if user is uploader
    const [rows] = await pool.query('SELECT * FROM media_files WHERE filename = ?', [filename]);
    if (rows.length === 0) return res.status(404).json({ message: 'File not found in DB' });
    if (rows[0].uploader_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    // Delete file
    fs.unlink(filePath, async (err) => {
      if (err) return res.status(404).json({ message: 'File not found or already deleted' });
      await pool.query('DELETE FROM media_files WHERE filename = ?', [filename]);
      res.json({ message: 'File deleted' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Orphaned file cleanup (admin-only, for demo: user ID 1 is admin)
router.post('/cleanup-orphans', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) return res.status(403).json({ message: 'Admin only' });
  const uploadDir = path.join(process.cwd(), 'uploads');
  fs.readdir(uploadDir, async (err, files) => {
    if (err) return res.status(500).json({ message: 'Failed to read uploads dir' });
    let deleted = [];
    for (const file of files) {
      const [rows] = await pool.query('SELECT * FROM media_files WHERE filename = ?', [file]);
      if (rows.length === 0) {
        // Orphaned file
        fs.unlinkSync(path.join(uploadDir, file));
        deleted.push(file);
      }
    }
    res.json({ deleted });
  });
});

export default router; 