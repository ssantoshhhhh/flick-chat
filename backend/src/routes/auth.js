import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import speakeasy from 'speakeasy';

const router = express.Router();

// Helper: Send OTP email
async function sendOTPEmail(email, otp) {
  console.log('[sendOTPEmail] Called with:', email, otp);
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  try {
    const info = await transporter.sendMail({
      from: `Flick <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Flick OTP',
      text: `Your OTP is: ${otp}`,
    });
    console.log('[sendOTPEmail] OTP email sent:', info.response);
    return true;
  } catch (err) {
    console.error('[sendOTPEmail] Error sending OTP email:', err);
    return false;
  }
}

// Helper: Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if username or email is unique
router.post('/check-unique', async (req, res) => {
  const { username, email } = req.body;
  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (users.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    res.json({ unique: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register: Step 1 - Submit registration data, send OTP
router.post('/register', async (req, res) => {
  console.log('[POST /register] Body:', req.body);
  const { email, username, display_name } = req.body;
  try {
    // Check uniqueness
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (users.length > 0) {
      console.log('[POST /register] Username or email already exists');
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    // Generate OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    // Insert temp user (no password yet)
    const [result] = await pool.query(
      'INSERT INTO users (email, username, display_name) VALUES (?, ?, ?)',
      [email, username, display_name]
    );
    const userId = result.insertId;
    await pool.query(
      'INSERT INTO otps (user_id, otp_code, expires_at, type) VALUES (?, ?, ?, ?)',
      [userId, otp, expires, 'register']
    );
    console.log('[POST /register] Sending OTP email...');
    const mailSent = await sendOTPEmail(email, otp);
    if (mailSent) {
      res.json({ userId, message: 'OTP sent to email', mailSent: true });
    } else {
      res.status(500).json({ userId, message: 'OTP sending failed', mailSent: false });
    }
  } catch (err) {
    console.error('[POST /register] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register: Step 2 - Verify OTP and set password
router.post('/verify-register', async (req, res) => {
  const { userId, otp, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND type = ? AND used = 0 AND expires_at > NOW()',
      [userId, otp, 'register']
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    // Set password
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);
    
    // Get user data and generate token (same as login)
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      message: 'Registration complete',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        display_name: user.display_name, 
        email: user.email 
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login: Step 1 - Request OTP
router.post('/login', async (req, res) => {
  const { usernameOrEmail } = req.body;
  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_deleted = 0',
      [usernameOrEmail, usernameOrEmail]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = users[0];
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO otps (user_id, otp_code, expires_at, type) VALUES (?, ?, ?, ?)',
      [user.id, otp, expires, 'login']
    );
    await sendOTPEmail(user.email, otp);
    res.json({ userId: user.id, message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login: Step 2 - Verify OTP
router.post('/verify-login', async (req, res) => {
  const { userId, otp, twofa_token } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND type = ? AND used = 0 AND expires_at > NOW()',
      [userId, otp, 'login']
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    // Check if 2FA is enabled
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    if (user.twofa_enabled) {
      if (!twofa_token) {
        return res.status(206).json({ message: '2FA required' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twofa_secret,
        encoding: 'base32',
        token: twofa_token
      });
      if (!verified) return res.status(400).json({ message: 'Invalid 2FA code' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);
    res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 