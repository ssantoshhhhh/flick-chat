import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, username, display_name, profile_pic FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile (username, display name, profile pic)
router.put('/profile', authenticateToken, async (req, res) => {
  const { username, display_name, profile_pic } = req.body;
  try {
    // Check if username is unique (if changed)
    if (username) {
      const [users] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
      if (users.length > 0) return res.status(409).json({ message: 'Username already taken' });
    }
    await pool.query('UPDATE users SET username = COALESCE(?, username), display_name = COALESCE(?, display_name), profile_pic = COALESCE(?, profile_pic) WHERE id = ?', [username, display_name, profile_pic, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request OTP for account deletion
router.post('/delete/request-otp', authenticateToken, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('INSERT INTO otps (user_id, otp_code, expires_at, type) VALUES (?, ?, ?, ?)', [req.user.id, otp, expires, 'delete']);
    // Send OTP email
    const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    const email = users[0].email;
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
      to: email,
      subject: 'Flick Account Deletion OTP',
      text: `Your OTP for account deletion is: ${otp}`,
    });
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete account (with OTP verification)
router.post('/delete', authenticateToken, async (req, res) => {
  const { otp } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND type = ? AND used = 0 AND expires_at > NOW()', [req.user.id, otp, 'delete']);
    if (rows.length === 0) return res.status(400).json({ message: 'Invalid or expired OTP' });
    // Mark user as deleted
    await pool.query('UPDATE users SET is_deleted = 1 WHERE id = ?', [req.user.id]);
    await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enable 2FA: generate secret and QR code
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `Flick (${req.user.username})` });
  await pool.query('UPDATE users SET twofa_secret = ? WHERE id = ?', [secret.base32, req.user.id]);
  const qr = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ otpauth_url: secret.otpauth_url, qr });
});

// Verify 2FA code and enable 2FA
router.post('/2fa/verify', authenticateToken, async (req, res) => {
  const { token } = req.body;
  const [users] = await pool.query('SELECT twofa_secret FROM users WHERE id = ?', [req.user.id]);
  if (!users[0].twofa_secret) return res.status(400).json({ message: '2FA not set up' });
  const verified = speakeasy.totp.verify({
    secret: users[0].twofa_secret,
    encoding: 'base32',
    token
  });
  if (!verified) return res.status(400).json({ message: 'Invalid code' });
  await pool.query('UPDATE users SET twofa_enabled = 1 WHERE id = ?', [req.user.id]);
  res.json({ message: '2FA enabled' });
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  await pool.query('UPDATE users SET twofa_enabled = 0, twofa_secret = NULL WHERE id = ?', [req.user.id]);
  res.json({ message: '2FA disabled' });
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const [prefs] = await pool.query('SELECT theme, layout, custom_settings FROM user_preferences WHERE user_id = ?', [req.user.id]);
    res.json(prefs[0] || { theme: 'default', layout: 'default', custom_settings: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Set user preferences
router.post('/preferences', authenticateToken, async (req, res) => {
  const { theme, layout, custom_settings } = req.body;
  try {
    await pool.query(
      'INSERT INTO user_preferences (user_id, theme, layout, custom_settings) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE theme = VALUES(theme), layout = VALUES(layout), custom_settings = VALUES(custom_settings)',
      [req.user.id, theme || 'default', layout || 'default', custom_settings ? JSON.stringify(custom_settings) : null]
    );
    res.json({ message: 'Preferences updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 