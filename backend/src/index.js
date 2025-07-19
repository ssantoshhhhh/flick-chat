import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';
import orgRoutes from './routes/org.js';
import taskRoutes from './routes/task.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mediaRoutes from './routes/media.js';
import path from 'path';
import pushRoutes from './routes/push.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import { deliverScheduledMessages } from './scheduler.js';
import whiteboardRoutes from './routes/whiteboard.js';
import wikiRoutes from './routes/wiki.js';
import workflowRoutes from './routes/workflow.js';
import onboardingRoutes from './routes/onboarding.js';
import analyticsRoutes from './routes/analytics.js';
import pool from './db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whiteboard', whiteboardRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/media', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/media', mediaRoutes);

app.get('/', (req, res) => {
  res.send('Flick backend is running!');
});

// Test DB connection and log message
pool.getConnection()
  .then(conn => {
    console.log('Database connected successfully!');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  // User authentication for socket (optional, for demo: userId in query)
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(`user_${userId}`);
  }
  // Join chat room
  socket.on('join', (chatId) => {
    socket.join(`chat_${chatId}`);
  });

  // Leave chat room
  socket.on('leave', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  // Send message
  socket.on('message', (data) => {
    // data: { chatId, message }
    io.to(`chat_${data.chatId}`).emit('message', data);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    // data: { chatId, userId, isTyping }
    socket.to(`chat_${data.chatId}`).emit('typing', data);
  });

  // Message status update
  socket.on('status', (data) => {
    // data: { chatId, messageId, status }
    io.to(`chat_${data.chatId}`).emit('status', data);
  });

  // Group call: join call room
  socket.on('call:join', ({ roomId, userId }) => {
    socket.join(`call_${roomId}`);
    socket.to(`call_${roomId}`).emit('call:user-joined', { userId, socketId: socket.id });
  });

  // Group call: leave call room
  socket.on('call:leave', ({ roomId, userId }) => {
    socket.leave(`call_${roomId}`);
    socket.to(`call_${roomId}`).emit('call:user-left', { userId, socketId: socket.id });
  });

  // WebRTC offer
  socket.on('call:offer', (data) => {
    // data: { roomId, offer, from, to }
    socket.to(data.to).emit('call:offer', data);
  });

  // WebRTC answer
  socket.on('call:answer', (data) => {
    // data: { roomId, answer, from, to }
    socket.to(data.to).emit('call:answer', data);
  });

  // WebRTC ICE candidate
  socket.on('call:ice-candidate', (data) => {
    // data: { roomId, candidate, from, to }
    socket.to(data.to).emit('call:ice-candidate', data);
  });

  // Video call: join/leave room
  socket.on('video:join', ({ roomId, userId }) => {
    socket.join(`video_${roomId}`);
    socket.to(`video_${roomId}`).emit('video:user-joined', { userId, socketId: socket.id });
  });
  socket.on('video:leave', ({ roomId, userId }) => {
    socket.leave(`video_${roomId}`);
    socket.to(`video_${roomId}`).emit('video:user-left', { userId, socketId: socket.id });
  });

  // Screen sharing events
  socket.on('video:screen-share-start', ({ roomId, userId }) => {
    socket.to(`video_${roomId}`).emit('video:screen-share-start', { userId });
  });
  socket.on('video:screen-share-stop', ({ roomId, userId }) => {
    socket.to(`video_${roomId}`).emit('video:screen-share-stop', { userId });
  });

  // WebRTC signaling for multi-party
  socket.on('video:signal', (data) => {
    // data: { roomId, signal, to }
    if (data.to) {
      socket.to(data.to).emit('video:signal', data);
    } else {
      // Broadcast to all in room except sender
      socket.to(`video_${data.roomId}`).emit('video:signal', data);
    }
  });
});

setInterval(() => deliverScheduledMessages(io), 60000); // every 60 seconds

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
