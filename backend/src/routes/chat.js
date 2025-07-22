import express from 'express';
import pool from '../db.js';
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

// List all chats for the user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [chats] = await pool.query(
      `SELECT c.id, c.type, c.name, c.created_at
       FROM chats c
       JOIN chat_members m ON c.id = m.chat_id
       WHERE m.user_id = ?`,
      [req.user.id]
    );
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Alias: /list -> /my
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const [chats] = await pool.query(
      `SELECT c.id, c.type, c.name, c.created_at
       FROM chats c
       JOIN chat_members m ON c.id = m.chat_id
       WHERE m.user_id = ?`,
      [req.user.id]
    );
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enhanced /create to support both formats
router.post('/create', authenticateToken, async (req, res) => {
  let type = req.body.type;
  let name = req.body.name;
  let members = req.body.members;
  // Support { participantIds, name }
  if (req.body.participantIds) {
    members = req.body.participantIds;
    if (!type) {
      type = members.length === 1 ? 'personal' : 'group';
    }
  }
  try {
    // For personal chat, check if already exists
    if (type === 'personal' && members && members.length === 1) {
      const [existing] = await pool.query(
        `SELECT c.id FROM chats c
         JOIN chat_members m1 ON c.id = m1.chat_id
         JOIN chat_members m2 ON c.id = m2.chat_id
         WHERE c.type = 'personal' AND m1.user_id = ? AND m2.user_id = ?`,
        [req.user.id, members[0]]
      );
      if (existing.length > 0) {
        return res.json({ chatId: existing[0].id, message: 'Chat already exists' });
      }
    }
    // Create chat
    const [result] = await pool.query(
      'INSERT INTO chats (type, name, created_by) VALUES (?, ?, ?)',
      [type, name || null, req.user.id]
    );
    const chatId = result.insertId;
    // Add members
    await pool.query('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', [chatId, req.user.id]);
    if (members && Array.isArray(members)) {
      for (const memberId of members) {
        if (memberId !== req.user.id) {
          await pool.query('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', [chatId, memberId]);
        }
      }
    }
    res.json({ chatId, message: 'Chat created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  try {
    // Check membership
    const [members] = await pool.query('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (members.length === 0) return res.status(403).json({ message: 'Not a member of this chat' });
    const [messages] = await pool.query(
      `SELECT m.id, m.sender_id, m.content, m.type, m.status, m.created_at, u.username, u.display_name, u.profile_pic
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = ?
       ORDER BY m.created_at ASC`,
      [chatId]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper: Parse mentions from message content
async function handleMentions(content, messageId, io) {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  let match;
  const mentionedUsernames = [];
  while ((match = mentionRegex.exec(content)) !== null) {
    mentionedUsernames.push(match[1]);
  }
  if (mentionedUsernames.length === 0) return;
  // Find user IDs for mentioned usernames
  const [users] = await pool.query(
    `SELECT id, username FROM users WHERE username IN (${mentionedUsernames.map(() => '?').join(',')})`,
    mentionedUsernames
  );
  for (const user of users) {
    await pool.query('INSERT INTO message_mentions (message_id, mentioned_user_id) VALUES (?, ?)', [messageId, user.id]);
    // Notify via Socket.IO
    io.to(`user_${user.id}`).emit('message:mention', { messageId, mentionedUserId: user.id });
  }
}

// Set E2EE public key
router.post('/e2ee/key', authenticateToken, async (req, res) => {
  const { publicKey } = req.body;
  try {
    await pool.query(
      'INSERT INTO key_exchange (user_id, public_key) VALUES (?, ?) ON DUPLICATE KEY UPDATE public_key = VALUES(public_key)',
      [req.user.id, publicKey]
    );
    res.json({ message: 'Public key set' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get E2EE public key for a user
router.get('/e2ee/key/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query('SELECT public_key FROM key_exchange WHERE user_id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'No key found' });
    res.json({ publicKey: rows[0].public_key });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message (E2EE: store encrypted_content, ignore plaintext content, support threads)
router.post('/:chatId/message', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { encrypted_content, type, parent_message_id } = req.body; // parent_message_id for threads
  try {
    // Check membership
    const [members] = await pool.query('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (members.length === 0) return res.status(403).json({ message: 'Not a member of this chat' });
    const [result] = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, encrypted_content, type, status, parent_message_id) VALUES (?, ?, ?, ?, ?, ?)',
      [chatId, req.user.id, encrypted_content, type || 'text', 'sent', parent_message_id || null]
    );
    res.json({ messageId: result.insertId, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch all replies (thread) for a message
router.get('/message/:messageId/thread', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  try {
    const [replies] = await pool.query(
      'SELECT * FROM messages WHERE parent_message_id = ? ORDER BY created_at ASC',
      [messageId]
    );
    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update message status (received/seen)
router.put('/message/:messageId/status', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body; // 'received'|'seen'
  try {
    await pool.query('UPDATE messages SET status = ? WHERE id = ?', [status, messageId]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to group/project chat
router.post('/:chatId/add-member', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  try {
    // Only allow for group/project chats
    const [chats] = await pool.query('SELECT * FROM chats WHERE id = ? AND type IN ("group", "project")', [chatId]);
    if (chats.length === 0) return res.status(400).json({ message: 'Not a group/project chat' });
    // Only allow if user is a member
    const [members] = await pool.query('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (members.length === 0) return res.status(403).json({ message: 'Not a member of this chat' });
    // Add member
    await pool.query('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', [chatId, userId]);
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from group/project chat
router.post('/:chatId/remove-member', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  try {
    // Only allow for group/project chats
    const [chats] = await pool.query('SELECT * FROM chats WHERE id = ? AND type IN ("group", "project")', [chatId]);
    if (chats.length === 0) return res.status(400).json({ message: 'Not a group/project chat' });
    // Only allow if user is a member
    const [members] = await pool.query('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (members.length === 0) return res.status(403).json({ message: 'Not a member of this chat' });
    // Remove member
    await pool.query('DELETE FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start a call (record in call_history)
router.post('/:chatId/start-call', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { type, participants } = req.body; // type: 'voice'|'video'|'screen', participants: [userId]
  try {
    const started_at = new Date();
    const [result] = await pool.query(
      'INSERT INTO call_history (chat_id, started_by, type, started_at, participants) VALUES (?, ?, ?, ?, ?)',
      [chatId, req.user.id, type, started_at, participants.join(',')]
    );
    res.json({ callId: result.insertId, message: 'Call started' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// End a call (update ended_at)
router.put('/end-call/:callId', authenticateToken, async (req, res) => {
  const { callId } = req.params;
  try {
    const ended_at = new Date();
    await pool.query('UPDATE call_history SET ended_at = ? WHERE id = ?', [ended_at, callId]);
    res.json({ message: 'Call ended' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get call history for a chat
router.get('/:chatId/call-history', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  try {
    const [calls] = await pool.query('SELECT * FROM call_history WHERE chat_id = ? ORDER BY started_at DESC', [chatId]);
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get call history for a user
router.get('/user/call-history', authenticateToken, async (req, res) => {
  try {
    const [calls] = await pool.query('SELECT * FROM call_history WHERE FIND_IN_SET(?, participants) ORDER BY started_at DESC', [req.user.id]);
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a reaction to a message
router.post('/message/:messageId/react', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  try {
    await pool.query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP',
      [messageId, req.user.id, emoji]
    );
    // Emit reaction event
    req.app.get('io').to(`chat_${req.body.chatId}`).emit('message:reaction', { messageId, userId: req.user.id, emoji });
    res.json({ message: 'Reaction added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a reaction from a message
router.delete('/message/:messageId/react', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  try {
    await pool.query(
      'DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [messageId, req.user.id, emoji]
    );
    req.app.get('io').to(`chat_${req.body.chatId}`).emit('message:reaction-removed', { messageId, userId: req.user.id, emoji });
    res.json({ message: 'Reaction removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit a message
router.put('/message/:messageId/edit', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  try {
    // Only sender can edit
    const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Message not found' });
    if (rows[0].sender_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    await pool.query('UPDATE messages SET content = ?, edited_at = NOW() WHERE id = ?', [content, messageId]);
    req.app.get('io').to(`chat_${rows[0].chat_id}`).emit('message:edited', { messageId, content });
    res.json({ message: 'Message edited' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message (soft delete)
router.delete('/message/:messageId', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  try {
    // Only sender can delete
    const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Message not found' });
    if (rows[0].sender_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    await pool.query('UPDATE messages SET is_deleted = 1 WHERE id = ?', [messageId]);
    req.app.get('io').to(`chat_${rows[0].chat_id}`).emit('message:deleted', { messageId });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.post('/message/:messageId/read', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  try {
    await pool.query(
      'INSERT INTO message_reads (message_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP',
      [messageId, req.user.id]
    );
    // Emit read receipt event
    req.app.get('io').emit('message:read', { messageId, userId: req.user.id });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get read receipts for a message
router.get('/message/:messageId/reads', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  try {
    const [reads] = await pool.query(
      'SELECT user_id, read_at FROM message_reads WHERE message_id = ?',
      [messageId]
    );
    res.json(reads);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update last seen for a chat
router.post('/:chatId/last-seen', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  try {
    await pool.query(
      'UPDATE chat_members SET last_seen = NOW() WHERE chat_id = ? AND user_id = ?',
      [chatId, req.user.id]
    );
    req.app.get('io').to(`chat_${chatId}`).emit('chat:last-seen', { chatId, userId: req.user.id, lastSeen: new Date() });
    res.json({ message: 'Last seen updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get last seen for all members in a chat
router.get('/:chatId/last-seen', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  try {
    const [members] = await pool.query(
      'SELECT user_id, last_seen FROM chat_members WHERE chat_id = ?',
      [chatId]
    );
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Pin an item (message, file, task)
router.post('/pin', authenticateToken, async (req, res) => {
  const { itemType, itemId } = req.body; // itemType: 'message'|'file'|'task'
  try {
    await pool.query(
      'INSERT INTO pinned_items (user_id, item_type, item_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE pinned_at = CURRENT_TIMESTAMP',
      [req.user.id, itemType, itemId]
    );
    res.json({ message: 'Item pinned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unpin an item
router.post('/unpin', authenticateToken, async (req, res) => {
  const { itemType, itemId } = req.body;
  try {
    await pool.query(
      'DELETE FROM pinned_items WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [req.user.id, itemType, itemId]
    );
    res.json({ message: 'Item unpinned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pinned/starred items for the user
router.get('/pinned', authenticateToken, async (req, res) => {
  try {
    const [items] = await pool.query(
      'SELECT * FROM pinned_items WHERE user_id = ? ORDER BY pinned_at DESC',
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Schedule a message
router.post('/:chatId/schedule', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { encrypted_content, type, scheduled_for } = req.body;
  try {
    // Check membership
    const [members] = await pool.query('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (members.length === 0) return res.status(403).json({ message: 'Not a member of this chat' });
    await pool.query(
      'INSERT INTO scheduled_messages (chat_id, sender_id, encrypted_content, type, scheduled_for) VALUES (?, ?, ?, ?, ?)',
      [chatId, req.user.id, encrypted_content, type || 'text', scheduled_for]
    );
    res.json({ message: 'Message scheduled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List scheduled messages for a user
router.get('/scheduled', authenticateToken, async (req, res) => {
  try {
    const [messages] = await pool.query(
      'SELECT * FROM scheduled_messages WHERE sender_id = ? AND delivered = 0 ORDER BY scheduled_for ASC',
      [req.user.id]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a scheduled message
router.delete('/scheduled/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM scheduled_messages WHERE id = ? AND sender_id = ?', [id, req.user.id]);
    res.json({ message: 'Scheduled message cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Batch-send messages (offline sync)
router.post('/:chatId/batch', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { messages } = req.body; // [{ encrypted_content, type, parent_message_id, created_at }]
  try {
    // Check membership
    const [members] = await pool.query('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (members.length === 0) return res.status(403).json({ message: 'Not a member of this chat' });
    for (const msg of messages) {
      await pool.query(
        'INSERT INTO messages (chat_id, sender_id, encrypted_content, type, status, parent_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [chatId, req.user.id, msg.encrypted_content, msg.type || 'text', 'sent', msg.parent_message_id || null, msg.created_at || new Date()]
      );
    }
    res.json({ message: 'Messages synced' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch new messages since a timestamp (offline sync)
router.get('/:chatId/since', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { since } = req.query; // ISO timestamp
  try {
    // Check membership
    const [members] = await pool.query('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (members.length === 0) return res.status(403).json({ message: 'Not a member of this chat' });
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE chat_id = ? AND created_at > ? ORDER BY created_at ASC',
      [chatId, since]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 