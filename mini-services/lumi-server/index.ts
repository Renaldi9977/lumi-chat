import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Database } from 'bun:sqlite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = 3030;
const JWT_SECRET = process.env.JWT_SECRET || 'lumi-secret-key-2024';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database setup with bun:sqlite
const dbPath = path.join(process.cwd(), 'data', 'lumi.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// Initialize database tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline',
    custom_status TEXT,
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT,
    group_id TEXT,
    content TEXT,
    message_type TEXT DEFAULT 'text',
    media_url TEXT,
    media_type TEXT,
    file_name TEXT,
    file_size INTEGER,
    sticker_id TEXT,
    reply_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(group_id, user_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    UNIQUE(user1_id, user2_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS message_reads (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(message_id, user_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS stickers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS call_sessions (
    id TEXT PRIMARY KEY,
    caller_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    call_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY (caller_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  )
`);

// Insert default stickers
const stickerCount = db.query('SELECT COUNT(*) as count FROM stickers').get() as { count: number };
if (stickerCount.count === 0) {
  const insertSticker = db.query('INSERT INTO stickers (id, name, url, category) VALUES (?, ?, ?, ?)');
  
  const defaultStickers = [
    // Emotions
    { id: uuidv4(), name: 'Happy', url: '😊', category: 'emotions' },
    { id: uuidv4(), name: 'Love', url: '😍', category: 'emotions' },
    { id: uuidv4(), name: 'Laugh', url: '😂', category: 'emotions' },
    { id: uuidv4(), name: 'Cool', url: '😎', category: 'emotions' },
    { id: uuidv4(), name: 'Sad', url: '😢', category: 'emotions' },
    { id: uuidv4(), name: 'Angry', url: '😠', category: 'emotions' },
    { id: uuidv4(), name: 'Surprised', url: '😲', category: 'emotions' },
    { id: uuidv4(), name: 'Thinking', url: '🤔', category: 'emotions' },
    // Animals
    { id: uuidv4(), name: 'Cat', url: '🐱', category: 'animals' },
    { id: uuidv4(), name: 'Dog', url: '🐕', category: 'animals' },
    { id: uuidv4(), name: 'Panda', url: '🐼', category: 'animals' },
    { id: uuidv4(), name: 'Fox', url: '🦊', category: 'animals' },
    { id: uuidv4(), name: 'Bunny', url: '🐰', category: 'animals' },
    { id: uuidv4(), name: 'Lion', url: '🦁', category: 'animals' },
    // Objects
    { id: uuidv4(), name: 'Heart', url: '❤️', category: 'objects' },
    { id: uuidv4(), name: 'Star', url: '⭐', category: 'objects' },
    { id: uuidv4(), name: 'Fire', url: '🔥', category: 'objects' },
    { id: uuidv4(), name: 'Sparkles', url: '✨', category: 'objects' },
    { id: uuidv4(), name: 'Party', url: '🎉', category: 'objects' },
    { id: uuidv4(), name: 'Gift', url: '🎁', category: 'objects' },
    // Food
    { id: uuidv4(), name: 'Pizza', url: '🍕', category: 'food' },
    { id: uuidv4(), name: 'Burger', url: '🍔', category: 'food' },
    { id: uuidv4(), name: 'Coffee', url: '☕', category: 'food' },
    { id: uuidv4(), name: 'Cake', url: '🎂', category: 'food' },
    { id: uuidv4(), name: 'Ice Cream', url: '🍦', category: 'food' },
  ];

  for (const sticker of defaultStickers) {
    insertSticker.run(sticker.id, sticker.name, sticker.url, sticker.category);
  }
}

// Upload configuration
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    const dir = path.join(uploadDir, fileType);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Serve static files
app.use('/uploads', express.static(uploadDir));

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, display_name } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    const existingUser = db.query('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.query('INSERT INTO users (id, email, username, password, display_name, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, email, username, hashedPassword, display_name || username, 'offline'
    );

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    const user = db.query('SELECT id, email, username, display_name, avatar_url, status FROM users WHERE id = ?').get(userId) as any;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.query('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    db.query('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('online', user.id);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        status: 'online',
        customStatus: user.custom_status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  try {
    const user = db.query('SELECT id, email, username, display_name, avatar_url, status, custom_status, last_seen FROM users WHERE id = ?').get(req.userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      status: user.status,
      customStatus: user.custom_status,
      lastSeen: user.last_seen,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
app.put('/api/auth/profile', authenticateToken, (req: any, res) => {
  try {
    const { display_name, username, custom_status } = req.body;

    if (username) {
      const existingUser = db.query('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.userId);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    db.query('UPDATE users SET display_name = COALESCE(?, display_name), username = COALESCE(?, username), custom_status = COALESCE(?, custom_status), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      display_name, username, custom_status, req.userId
    );

    const user = db.query('SELECT id, email, username, display_name, avatar_url, status, custom_status FROM users WHERE id = ?').get(req.userId) as any;

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      status: user.status,
      customStatus: user.custom_status,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar
app.post('/api/auth/avatar', authenticateToken, upload.single('avatar'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.mimetype.split('/')[0]}/${req.file.filename}`;
    
    db.query('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, req.userId);

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update status
app.put('/api/auth/status', authenticateToken, (req: any, res) => {
  try {
    const { status } = req.body;

    if (!['online', 'idle', 'dnd', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lastSeen = status === 'offline' ? new Date().toISOString() : null;
    
    db.query('UPDATE users SET status = ?, last_seen = COALESCE(?, last_seen), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, lastSeen, req.userId);

    io.emit('user-status-changed', { userId: req.userId, status, lastSeen });

    res.json({ message: 'Status updated', status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== USER ROUTES ====================

// Search users
app.get('/api/users/search', authenticateToken, (req: any, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const users = db.query('SELECT id, username, display_name, avatar_url, status FROM users WHERE (username LIKE ? OR display_name LIKE ?) AND id != ? LIMIT 20').all(`%${q}%`, `%${q}%`, req.userId) as any[];

    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      status: u.status,
    })));
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', authenticateToken, (req: any, res) => {
  try {
    const user = db.query('SELECT id, username, display_name, avatar_url, status, custom_status, last_seen FROM users WHERE id = ?').get(req.params.id) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      status: user.status,
      customStatus: user.custom_status,
      lastSeen: user.last_seen,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== MESSAGE ROUTES ====================

// Get conversations
app.get('/api/conversations', authenticateToken, (req: any, res) => {
  try {
    const conversations = db.query(`
      SELECT 
        c.id, c.user1_id, c.user2_id,
        u.id as other_user_id, u.username as other_username, u.display_name as other_display_name,
        u.avatar_url as other_avatar_url, u.status as other_status,
        m.content as last_message, m.created_at as last_message_time, m.message_type as last_message_type
      FROM conversations c
      JOIN users u ON (u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END)
      LEFT JOIN messages m ON m.id = (
        SELECT id FROM messages 
        WHERE (receiver_id = ? AND sender_id = u.id) OR (sender_id = ? AND receiver_id = u.id)
        ORDER BY created_at DESC LIMIT 1
      )
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `).all(req.userId, req.userId, req.userId, req.userId, req.userId) as any[];

    res.json(conversations.map(c => ({
      id: c.id,
      user: {
        id: c.other_user_id,
        username: c.other_username,
        displayName: c.other_display_name,
        avatarUrl: c.other_avatar_url,
        status: c.other_status,
      },
      lastMessage: c.last_message,
      lastMessageTime: c.last_message_time,
      lastMessageType: c.last_message_type,
    })));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages with a user
app.get('/api/messages/:userId', authenticateToken, (req: any, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    let query = `
      SELECT m.*, u.username as sender_username, u.display_name as sender_display_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
        AND m.group_id IS NULL
    `;
    
    const params: any[] = [req.userId, userId, userId, req.userId];

    if (before) {
      query += ' AND m.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const messages = db.query(query).all(...params) as any[];

    res.json(messages.reverse().map(m => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      content: m.content,
      messageType: m.message_type,
      mediaUrl: m.media_url,
      mediaType: m.media_type,
      fileName: m.file_name,
      fileSize: m.file_size,
      stickerId: m.sticker_id,
      replyTo: m.reply_to,
      createdAt: m.created_at,
      sender: {
        id: m.sender_id,
        username: m.sender_username,
        displayName: m.sender_display_name,
        avatarUrl: m.sender_avatar,
      },
    })));
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
app.post('/api/messages', authenticateToken, (req: any, res) => {
  try {
    const { receiverId, groupId, content, messageType = 'text', mediaUrl, mediaType, fileName, fileSize, stickerId, replyTo } = req.body;

    if (!content && !mediaUrl && !stickerId) {
      return res.status(400).json({ error: 'Message content, media, or sticker is required' });
    }

    if (!receiverId && !groupId) {
      return res.status(400).json({ error: 'Receiver or group is required' });
    }

    const messageId = uuidv4();

    db.query('INSERT INTO messages (id, sender_id, receiver_id, group_id, content, message_type, media_url, media_type, file_name, file_size, sticker_id, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      messageId, req.userId, receiverId, groupId, content, messageType, mediaUrl, mediaType, fileName, fileSize, stickerId, replyTo
    );

    if (receiverId) {
      const conv = db.query('SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)').get(req.userId, receiverId, receiverId, req.userId);

      if (!conv) {
        db.query('INSERT INTO conversations (id, user1_id, user2_id) VALUES (?, ?, ?)').run(uuidv4(), req.userId, receiverId);
      }
    }

    const message = db.query(`
      SELECT m.*, u.username as sender_username, u.display_name as sender_display_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?
    `).get(messageId) as any;

    const formattedMessage = {
      id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      groupId: message.group_id,
      content: message.content,
      messageType: message.message_type,
      mediaUrl: message.media_url,
      mediaType: message.media_type,
      fileName: message.file_name,
      fileSize: message.file_size,
      stickerId: message.sticker_id,
      replyTo: message.reply_to,
      createdAt: message.created_at,
      sender: {
        id: message.sender_id,
        username: message.sender_username,
        displayName: message.sender_display_name,
        avatarUrl: message.sender_avatar,
      },
    };

    if (receiverId) {
      io.to(`user:${receiverId}`).emit('new-message', formattedMessage);
      io.to(`user:${req.userId}`).emit('new-message', formattedMessage);
    } else if (groupId) {
      io.to(`group:${groupId}`).emit('new-message', formattedMessage);
    }

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload file
app.post('/api/messages/upload', authenticateToken, upload.single('file'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.mimetype.split('/')[0]}/${req.file.filename}`;
    const fileType = req.file.mimetype.split('/')[0];

    res.json({
      url: fileUrl,
      type: fileType,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== GROUP ROUTES ====================

// Create group
app.post('/api/groups', authenticateToken, (req: any, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const groupId = uuidv4();

    db.query('INSERT INTO groups (id, name, description, created_by) VALUES (?, ?, ?, ?)').run(groupId, name, description, req.userId);

    const memberId = uuidv4();
    db.query('INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)').run(memberId, groupId, req.userId, 'admin');

    if (memberIds && Array.isArray(memberIds)) {
      for (const userId of memberIds) {
        if (userId !== req.userId) {
          db.query('INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)').run(uuidv4(), groupId, userId, 'member');
        }
      }
    }

    const group = db.query('SELECT * FROM groups WHERE id = ?').get(groupId) as any;
    const members = db.query(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.status, gm.role
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
    `).all(groupId) as any[];

    res.status(201).json({
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatar_url,
      createdBy: group.created_by,
      createdAt: group.created_at,
      members: members.map(m => ({
        id: m.id,
        username: m.username,
        displayName: m.display_name,
        avatarUrl: m.avatar_url,
        status: m.status,
        role: m.role,
      })),
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get groups
app.get('/api/groups', authenticateToken, (req: any, res) => {
  try {
    const groups = db.query(`
      SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = ?
      ORDER BY g.created_at DESC
    `).all(req.userId) as any[];

    res.json(groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      avatarUrl: g.avatar_url,
      memberCount: g.member_count,
      createdAt: g.created_at,
    })));
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group messages
app.get('/api/groups/:id/messages', authenticateToken, (req: any, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    const member = db.query('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(id, req.userId);
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    let query = `
      SELECT m.*, u.username as sender_username, u.display_name as sender_display_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.group_id = ? AND m.deleted_at IS NULL
    `;
    
    const params: any[] = [id];

    if (before) {
      query += ' AND m.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const messages = db.query(query).all(...params) as any[];

    res.json(messages.reverse().map(m => ({
      id: m.id,
      senderId: m.sender_id,
      groupId: m.group_id,
      content: m.content,
      messageType: m.message_type,
      mediaUrl: m.media_url,
      mediaType: m.media_type,
      fileName: m.file_name,
      fileSize: m.file_size,
      stickerId: m.sticker_id,
      replyTo: m.reply_to,
      createdAt: m.created_at,
      sender: {
        id: m.sender_id,
        username: m.sender_username,
        displayName: m.sender_display_name,
        avatarUrl: m.sender_avatar,
      },
    })));
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to group
app.post('/api/groups/:id/members', authenticateToken, (req: any, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const admin = db.query('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?').get(id, req.userId) as any;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can add members' });
    }

    const existing = db.query('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(id, userId);
    if (existing) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    db.query('INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)').run(uuidv4(), id, userId, 'member');

    io.to(`user:${userId}`).emit('added-to-group', { groupId: id });

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from group
app.delete('/api/groups/:id/members/:userId', authenticateToken, (req: any, res) => {
  try {
    const { id, userId } = req.params;

    const admin = db.query('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?').get(id, req.userId) as any;
    if (!admin || (admin.role !== 'admin' && req.userId !== userId)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    db.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').run(id, userId);

    io.to(`user:${userId}`).emit('removed-from-group', { groupId: id });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== STICKERS ROUTES ====================

// Get stickers
app.get('/api/stickers', authenticateToken, (req: any, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM stickers';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, name';

    const stickers = db.query(query).all(...params) as any[];
    res.json(stickers.map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      category: s.category,
    })));
  } catch (error) {
    console.error('Get stickers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sticker categories
app.get('/api/stickers/categories', authenticateToken, (req: any, res) => {
  try {
    const categories = db.query('SELECT DISTINCT category FROM stickers ORDER BY category').all() as any[];
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CALL ROUTES ====================

// Initiate call
app.post('/api/calls', authenticateToken, (req: any, res) => {
  try {
    const { receiverId, callType } = req.body;

    if (!['voice', 'video'].includes(callType)) {
      return res.status(400).json({ error: 'Invalid call type' });
    }

    const callId = uuidv4();

    db.query('INSERT INTO call_sessions (id, caller_id, receiver_id, call_type, status, started_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').run(
      callId, req.userId, receiverId, callType, 'ringing'
    );

    const caller = db.query('SELECT id, username, display_name, avatar_url FROM users WHERE id = ?').get(req.userId) as any;

    io.to(`user:${receiverId}`).emit('incoming-call', {
      callId,
      callType,
      caller: {
        id: caller.id,
        username: caller.username,
        displayName: caller.display_name,
        avatarUrl: caller.avatar_url,
      },
    });

    res.status(201).json({ callId, status: 'ringing' });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End call
app.put('/api/calls/:id/end', authenticateToken, (req: any, res) => {
  try {
    const { id } = req.params;

    db.query('UPDATE call_sessions SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?').run('ended', id);

    const call = db.query('SELECT * FROM call_sessions WHERE id = ?').get(id) as any;

    io.to(`user:${call.caller_id}`).emit('call-ended', { callId: id });
    io.to(`user:${call.receiver_id}`).emit('call-ended', { callId: id });

    res.json({ message: 'Call ended' });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SOCKET.IO ====================

const userSockets = new Map<string, Set<string>>();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  console.log(`User connected: ${userId}`);

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socket.id);

  socket.join(`user:${userId}`);

  db.query('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('online', userId);
  io.emit('user-status-changed', { userId, status: 'online' });

  socket.on('typing', (data: { receiverId?: string; groupId?: string; isTyping: boolean }) => {
    if (data.receiverId) {
      socket.to(`user:${data.receiverId}`).emit('user-typing', {
        userId,
        isTyping: data.isTyping,
      });
    } else if (data.groupId) {
      socket.to(`group:${data.groupId}`).emit('user-typing', {
        userId,
        groupId: data.groupId,
        isTyping: data.isTyping,
      });
    }
  });

  socket.on('join-group', (groupId: string) => {
    socket.join(`group:${groupId}`);
  });

  socket.on('leave-group', (groupId: string) => {
    socket.leave(`group:${groupId}`);
  });

  socket.on('call-signal', (data: { callId: string; signal: any; targetUserId: string }) => {
    socket.to(`user:${data.targetUserId}`).emit('call-signal', {
      callId: data.callId,
      signal: data.signal,
      fromUserId: userId,
    });
  });

  socket.on('call-answer', (data: { callId: string; signal: any; targetUserId: string }) => {
    socket.to(`user:${data.targetUserId}`).emit('call-answer', {
      callId: data.callId,
      signal: data.signal,
    });
  });

  socket.on('call-ice-candidate', (data: { callId: string; candidate: any; targetUserId: string }) => {
    socket.to(`user:${data.targetUserId}`).emit('call-ice-candidate', {
      callId: data.callId,
      candidate: data.candidate,
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    
    userSockets.get(userId)?.delete(socket.id);
    
    if (userSockets.get(userId)?.size === 0) {
      userSockets.delete(userId);
      
      db.query('UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('offline', userId);
      io.emit('user-status-changed', { userId, status: 'offline', lastSeen: new Date().toISOString() });
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Lumi server running on port ${PORT}`);
});
