import pool from './db.js';

export async function deliverScheduledMessages(io) {
  const [messages] = await pool.query(
    'SELECT * FROM scheduled_messages WHERE delivered = 0 AND scheduled_for <= NOW()'
  );
  for (const msg of messages) {
    // Deliver message (insert into messages table)
    await pool.query(
      'INSERT INTO messages (chat_id, sender_id, encrypted_content, type, status) VALUES (?, ?, ?, ?, ?)',
      [msg.chat_id, msg.sender_id, msg.encrypted_content, msg.type, 'sent']
    );
    await pool.query('UPDATE scheduled_messages SET delivered = 1 WHERE id = ?', [msg.id]);
    // Emit real-time event
    io.to(`chat_${msg.chat_id}`).emit('message', { chatId: msg.chat_id });
  }
} 