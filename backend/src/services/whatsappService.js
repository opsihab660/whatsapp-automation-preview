const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const database = require('../utils/database');
const mistralService = require('./mistralService');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.io = null;
    this.isConnected = false;
    this.qrCode = null;
    this.sessionPath = process.env.WHATSAPP_SESSION_PATH || './sessions';
    this.autoReply = process.env.WHATSAPP_AUTO_REPLY === 'true';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.processedMessages = new Set(); // Track processed message IDs
  }

  async initialize(io) {
    try {
      this.io = io;

      // Create sessions directory if it doesn't exist
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      // Initialize auto-reply status from database or environment
      try {
        const savedAutoReply = await database.getSetting('auto_reply');
        if (savedAutoReply !== null) {
          this.autoReply = savedAutoReply === 'true';
        } else {
          // Set default from environment variable
          this.autoReply = process.env.WHATSAPP_AUTO_REPLY === 'true';
          await database.setSetting('auto_reply', this.autoReply.toString());
        }
        logger.info('Auto-reply initialized', { enabled: this.autoReply });
      } catch (error) {
        logger.error('Failed to initialize auto-reply setting:', error);
        this.autoReply = true; // Default to enabled
      }

      await this.connect();
      logger.info('WhatsApp service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
      throw error;
    }
  }

  async connect() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      const { version, isLatest } = await fetchLatestBaileysVersion();

      logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

      this.sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: 30000,
        keepAliveIntervalMs: 10000,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        qrTimeout: 40000,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        fireInitQueries: true,
        emitOwnEvents: true,
        getMessage: async (key) => {
          // Return undefined to let Baileys handle message retrieval
          return undefined;
        }
      });

      this.setupEventHandlers(saveCreds);

    } catch (error) {
      logger.error('Error connecting to WhatsApp:', error);
      throw error;
    }
  }

  setupEventHandlers(saveCreds) {
    // Connection updates
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          this.qrCode = await QRCode.toDataURL(qr);
          logger.info('QR Code generated');

          // Save QR code to database
          await database.saveSession({
            sessionId: 'main',
            qrCode: this.qrCode,
            status: 'qr_generated'
          });

          // Emit QR code to frontend
          if (this.io) {
            this.io.emit('qr-code', { qrCode: this.qrCode });
          }
        } catch (error) {
          logger.error('Error generating QR code:', error);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;

        logger.info('Connection closed due to:', lastDisconnect?.error);

        this.isConnected = false;
        this.qrCode = null;

        // Update session status
        await database.saveSession({
          sessionId: 'main',
          qrCode: null,
          status: 'disconnected'
        });

        // Emit disconnection to frontend
        if (this.io) {
          this.io.emit('connection-status', {
            status: 'disconnected',
            reason: lastDisconnect?.error?.message
          });
        }

        if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          logger.info(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

          setTimeout(() => {
            this.connect();
          }, 5000);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('Max reconnection attempts reached');
          if (this.io) {
            this.io.emit('connection-error', {
              message: 'Max reconnection attempts reached. Please restart the application.'
            });
          }
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.qrCode = null;

        logger.info('WhatsApp connection opened successfully');

        // Update session status
        await database.saveSession({
          sessionId: 'main',
          qrCode: null,
          status: 'connected'
        });

        // Emit connection success to frontend
        if (this.io) {
          this.io.emit('connection-status', {
            status: 'connected',
            user: this.sock.user
          });
        }
      }
    });

    // Credentials update
    this.sock.ev.on('creds.update', saveCreds);

    // Message handling
    this.sock.ev.on('messages.upsert', async (m) => {
      try {
        await this.handleIncomingMessages(m);
      } catch (error) {
        logger.error('Error handling incoming messages:', error);
      }
    });

    // Handle message retry requests
    this.sock.ev.on('message-retry', (messageRetryEvent) => {
      logger.info('Message retry requested', messageRetryEvent);
    });

    // Handle decryption failures
    this.sock.ev.on('CB:call', async (node) => {
      logger.debug('Call event received:', node);
    });

    // Message receipt acknowledgment
    this.sock.ev.on('message-receipt.update', (updates) => {
      for (const update of updates) {
        logger.debug('Message receipt update:', update);
      }
    });

    // Presence updates
    this.sock.ev.on('presence.update', (presence) => {
      logger.debug('Presence update:', presence);
    });
  }

  async handleIncomingMessages(messageUpdate) {
    const { messages, type } = messageUpdate;

    logger.info('Received message update', { type, messageCount: messages.length });

    if (type !== 'notify') {
      logger.debug('Ignoring non-notify message type:', type);
      return;
    }

    for (const message of messages) {
      try {
        // Skip if message is from us
        if (message.key.fromMe) continue;

        // Skip if we've already processed this message
        const messageId = message.key.id;
        if (this.processedMessages.has(messageId)) {
          logger.debug('Skipping already processed message:', messageId);
          continue;
        }

        // Skip if message is too old (more than 5 minutes)
        const messageTime = message.messageTimestamp * 1000;
        const now = Date.now();
        if (now - messageTime > 5 * 60 * 1000) continue;

        // Mark message as processed
        this.processedMessages.add(messageId);

        // Clean up old processed messages (keep only last 1000)
        if (this.processedMessages.size > 1000) {
          const oldMessages = Array.from(this.processedMessages).slice(0, 500);
          oldMessages.forEach(id => this.processedMessages.delete(id));
        }

        // Handle decryption errors gracefully
        let messageData;
        try {
          messageData = await this.extractMessageData(message);
        } catch (decryptError) {
          logger.warn('Message decryption failed, attempting fallback processing', {
            messageId: message.key.id,
            from: message.key.remoteJid,
            error: decryptError.message
          });

          // Create basic message data even if decryption fails
          messageData = {
            messageId: message.key.id,
            fromNumber: message.key.remoteJid,
            fromName: message.pushName || 'Unknown',
            messageText: '[Message could not be decrypted]',
            messageType: 'text',
            timestamp: (message.messageTimestamp || Date.now() / 1000) * 1000,
            isFromMe: false
          };
        }

        if (!messageData) continue;

        // Save message to database
        try {
          const messageId = await database.saveMessage(messageData);
          logger.info('Message saved to database', { messageId, from: messageData.fromNumber });
        } catch (dbError) {
          logger.error('Failed to save message to database:', dbError);
        }

        // Emit message to frontend
        if (this.io) {
          this.io.emit('new-message', messageData);
        }

        // Generate and send AI response if auto-reply is enabled and message has text
        logger.info('Auto-reply check', {
          autoReply: this.autoReply,
          hasText: !!messageData.messageText,
          messageText: messageData.messageText?.substring(0, 50) + '...',
          willReply: this.autoReply && messageData.messageText && messageData.messageText !== '[Message could not be decrypted]'
        });

        if (this.autoReply && messageData.messageText && messageData.messageText !== '[Message could not be decrypted]') {
          try {
            logger.info('Attempting to generate AI response for message from:', messageData.fromNumber);
            await this.generateAndSendAIResponse(message, messageData);
          } catch (aiError) {
            logger.error('Failed to generate AI response:', aiError);

            // Send a simple fallback response
            try {
              logger.info('Sending fallback response');
              await this.sendMessage(messageData.fromNumber, "I received your message but I'm having trouble processing it right now. Please try again.");
            } catch (fallbackError) {
              logger.error('Failed to send fallback response:', fallbackError);
            }
          }
        } else {
          logger.info('Auto-reply skipped', {
            reason: !this.autoReply ? 'Auto-reply disabled' :
                   !messageData.messageText ? 'No message text' :
                   messageData.messageText === '[Message could not be decrypted]' ? 'Decryption failed' : 'Unknown'
          });
        }

        logger.info('Message processed successfully', {
          from: messageData.fromNumber,
          type: messageData.messageType,
          hasText: !!messageData.messageText,
          autoReplyAttempted: this.autoReply && !!messageData.messageText
        });

      } catch (error) {
        logger.error('Error processing message:', error);

        // Try to extract basic info for logging
        try {
          const basicInfo = {
            messageId: message.key?.id,
            from: message.key?.remoteJid,
            timestamp: message.messageTimestamp
          };
          logger.error('Failed message details:', basicInfo);
        } catch (logError) {
          logger.error('Could not extract message details for logging');
        }
      }
    }
  }

  async extractMessageData(message) {
    try {
      const messageContent = message.message;
      const fromNumber = message.key.remoteJid;
      const messageId = message.key.id;
      const timestamp = message.messageTimestamp * 1000;

      // Get sender name
      let fromName = 'Unknown';
      if (message.pushName) {
        fromName = message.pushName;
      } else if (message.verifiedBizName) {
        fromName = message.verifiedBizName;
      }

      let messageText = '';
      let messageType = 'unknown';

      // Extract text from different message types
      if (messageContent.conversation) {
        messageText = messageContent.conversation;
        messageType = 'text';
      } else if (messageContent.extendedTextMessage) {
        messageText = messageContent.extendedTextMessage.text;
        messageType = 'text';
      } else if (messageContent.imageMessage) {
        messageText = messageContent.imageMessage.caption || '';
        messageType = 'image';
      } else if (messageContent.videoMessage) {
        messageText = messageContent.videoMessage.caption || '';
        messageType = 'video';
      } else if (messageContent.documentMessage) {
        messageText = messageContent.documentMessage.caption || '';
        messageType = 'document';
      } else if (messageContent.audioMessage) {
        messageType = 'audio';
      } else if (messageContent.stickerMessage) {
        messageType = 'sticker';
      } else if (messageContent.locationMessage) {
        messageType = 'location';
        messageText = `Location: ${messageContent.locationMessage.degreesLatitude}, ${messageContent.locationMessage.degreesLongitude}`;
      } else if (messageContent.contactMessage) {
        messageType = 'contact';
        messageText = `Contact: ${messageContent.contactMessage.displayName}`;
      }

      return {
        messageId,
        fromNumber,
        fromName,
        messageText,
        messageType,
        timestamp,
        isFromMe: false
      };
    } catch (error) {
      logger.error('Error extracting message data:', error);
      return null;
    }
  }

  async generateAndSendAIResponse(originalMessage, messageData) {
    try {
      if (!messageData.messageText || messageData.messageText.trim() === '') {
        return;
      }

      // Get conversation context
      const previousMessages = await database.getMessagesByNumber(messageData.fromNumber, 5);

      const context = {
        senderName: messageData.fromName,
        timestamp: messageData.timestamp,
        previousMessages: previousMessages.map(msg => ({
          text: msg.message_text,
          isFromMe: msg.is_from_me === 1,
          timestamp: msg.timestamp
        }))
      };

      // Generate AI response
      const aiResponse = await mistralService.generateResponse(messageData.messageText, context);

      if (aiResponse) {
        // Send the response
        await this.sendMessage(messageData.fromNumber, aiResponse);

        // Update database with AI response
        await database.updateMessageWithAIResponse(messageData.messageId, aiResponse);

        // Emit AI response to frontend
        if (this.io) {
          this.io.emit('ai-response', {
            originalMessage: messageData,
            aiResponse,
            timestamp: Date.now()
          });
        }

        logger.info('AI response sent successfully', {
          to: messageData.fromNumber,
          responseLength: aiResponse.length
        });
      }
    } catch (error) {
      logger.error('Error generating/sending AI response:', error);
    }
  }

  async sendMessage(to, text) {
    try {
      if (!this.sock || !this.isConnected) {
        throw new Error('WhatsApp not connected');
      }

      const result = await this.sock.sendMessage(to, { text });

      // Save sent message to database
      await database.saveMessage({
        messageId: result.key.id,
        fromNumber: to,
        fromName: 'Bot',
        messageText: text,
        messageType: 'text',
        timestamp: Date.now(),
        isFromMe: true
      });

      return result;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendImageMessage(to, imagePath, caption = '') {
    try {
      if (!this.sock || !this.isConnected) {
        throw new Error('WhatsApp not connected');
      }

      const result = await this.sock.sendMessage(to, {
        image: { url: imagePath },
        caption
      });

      return result;
    } catch (error) {
      logger.error('Error sending image message:', error);
      throw error;
    }
  }

  async getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      qrCode: this.qrCode,
      user: this.sock?.user || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  async disconnect() {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.sock = null;
      }
      this.isConnected = false;
      this.qrCode = null;

      // Update session status
      await database.saveSession({
        sessionId: 'main',
        qrCode: null,
        status: 'disconnected'
      });

      logger.info('WhatsApp disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting WhatsApp:', error);
      throw error;
    }
  }

  async toggleAutoReply(enabled) {
    this.autoReply = enabled;
    await database.setSetting('auto_reply', enabled.toString());
    logger.info(`Auto-reply ${enabled ? 'enabled' : 'disabled'}`);

    if (this.io) {
      this.io.emit('auto-reply-status', { enabled });
    }
  }

  async getAutoReplyStatus() {
    const setting = await database.getSetting('auto_reply');
    return setting === 'true';
  }
}

module.exports = new WhatsAppService();