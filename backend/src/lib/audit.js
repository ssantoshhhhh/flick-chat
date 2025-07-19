import pool from '../db.js';

export async function logAudit(userId, action, details = null) {
  await pool.query(
    'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, action, details ? JSON.stringify(details) : null]
  );
} 