import express from 'express';
import pool from '../db.js';
import webpush from 'web-push';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

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

// Set VAPID keys (generate with web-push generate-vapid-keys)
webpush.setVapidDetails(
  'mailto:admin@flick.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Register push subscription
router.post('/subscribe', authenticateToken, async (req, res) => {
  const { endpoint, keys } = req.body;
  try {
    await pool.query(
      'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE endpoint = VALUES(endpoint), p256dh = VALUES(p256dh), auth = VALUES(auth)',
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    res.json({ message: 'Subscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unregister push subscription
router.post('/unsubscribe', authenticateToken, async (req, res) => {
  const { endpoint } = req.body;
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', [req.user.id, endpoint]);
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send test notification (admin only)
router.post('/send', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) return res.status(403).json({ message: 'Admin only' });
  const { userId, title, body } = req.body;
  try {
    const [subs] = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]);
    if (subs.length === 0) return res.status(404).json({ message: 'No subscription' });
    const payload = JSON.stringify({ title, body });
    await Promise.all(subs.map(sub =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
    ));
    res.json({ message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 