const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const logger = require('./src/utils/logger');
const database = require('./src/utils/database');
const whatsappService = require('./src/services/whatsappService');
const apiRoutes = require('./src/routes/api');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database
database.init();

// Socket.IO connection handling
io.on('connection', async (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Send current connection status to newly connected client
  try {
    const currentStatus = await whatsappService.getConnectionStatus();
    socket.emit('connection-status', {
      status: currentStatus.isConnected ? 'connected' : 'disconnected',
      user: currentStatus.user,
      qrCode: currentStatus.qrCode
    });

    // Send current auto-reply status
    const autoReplyStatus = await whatsappService.getAutoReplyStatus();
    socket.emit('auto-reply-status', { enabled: autoReplyStatus });

    logger.info(`Sent initial status to client ${socket.id}:`, {
      connected: currentStatus.isConnected,
      autoReply: autoReplyStatus
    });
  } catch (error) {
    logger.error('Error sending initial status to client:', error);
  }

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Handle client requesting current status
  socket.on('request-status', async () => {
    try {
      const currentStatus = await whatsappService.getConnectionStatus();
      socket.emit('connection-status', {
        status: currentStatus.isConnected ? 'connected' : 'disconnected',
        user: currentStatus.user,
        qrCode: currentStatus.qrCode
      });
    } catch (error) {
      logger.error('Error handling status request:', error);
    }
  });
});

// Make io available to other modules
app.set('io', io);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await whatsappService.disconnect();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await whatsappService.disconnect();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);

  // Initialize WhatsApp service
  whatsappService.initialize(io);
});
