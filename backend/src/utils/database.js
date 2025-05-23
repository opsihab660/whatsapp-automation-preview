const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './data/messages.db';
  }

  init() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error opening database:', err);
          throw err;
        }
        logger.info('Connected to SQLite database');
      });

      this.createTables();
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE,
        from_number TEXT NOT NULL,
        from_name TEXT,
        message_text TEXT,
        message_type TEXT DEFAULT 'text',
        timestamp INTEGER NOT NULL,
        is_from_me BOOLEAN DEFAULT 0,
        ai_response TEXT,
        ai_response_timestamp INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE,
        qr_code TEXT,
        status TEXT DEFAULT 'disconnected',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Create tables first
    const createTablesPromises = tables.map((sql) => {
      return new Promise((resolve, reject) => {
        this.db.run(sql, (err) => {
          if (err) {
            logger.error('Error creating table:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    // Wait for all tables to be created before creating indexes
    Promise.all(createTablesPromises).then(() => {
      // Create indexes for better performance
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
        'CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)'
      ];

      indexes.forEach((sql) => {
        this.db.run(sql, (err) => {
          if (err) {
            logger.error('Error creating index:', err);
          }
        });
      });
    }).catch((err) => {
      logger.error('Error creating tables:', err);
    });
  }

  // Message operations
  saveMessage(messageData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR IGNORE INTO messages
        (message_id, from_number, from_name, message_text, message_type, timestamp, is_from_me)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        messageData.messageId,
        messageData.fromNumber,
        messageData.fromName,
        messageData.messageText,
        messageData.messageType || 'text',
        messageData.timestamp,
        messageData.isFromMe ? 1 : 0
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Error saving message:', err);
          reject(err);
        } else {
          if (this.changes === 0) {
            logger.debug('Message already exists, skipping duplicate');
          }
          resolve(this.lastID || 'existing');
        }
      });
    });
  }

  updateMessageWithAIResponse(messageId, aiResponse) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE messages
        SET ai_response = ?, ai_response_timestamp = ?
        WHERE message_id = ?`;

      this.db.run(sql, [aiResponse, Date.now(), messageId], function(err) {
        if (err) {
          logger.error('Error updating message with AI response:', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  getMessages(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM messages
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?`;

      this.db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          logger.error('Error fetching messages:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getMessagesByNumber(fromNumber, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM messages
        WHERE from_number = ?
        ORDER BY timestamp DESC
        LIMIT ?`;

      this.db.all(sql, [fromNumber, limit], (err, rows) => {
        if (err) {
          logger.error('Error fetching messages by number:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Session operations
  saveSession(sessionData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO sessions
        (session_id, qr_code, status, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;

      this.db.run(sql, [sessionData.sessionId, sessionData.qrCode, sessionData.status], function(err) {
        if (err) {
          logger.error('Error saving session:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  getLatestSession() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM sessions
        ORDER BY updated_at DESC
        LIMIT 1`;

      this.db.get(sql, (err, row) => {
        if (err) {
          logger.error('Error fetching latest session:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Settings operations
  setSetting(key, value) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO settings
        (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)`;

      this.db.run(sql, [key, value], function(err) {
        if (err) {
          logger.error('Error setting configuration:', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  getSetting(key) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT value FROM settings WHERE key = ?`;

      this.db.get(sql, [key], (err, row) => {
        if (err) {
          logger.error('Error getting configuration:', err);
          reject(err);
        } else {
          resolve(row ? row.value : null);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
        } else {
          logger.info('Database connection closed');
        }
      });
    }
  }
}

module.exports = new Database();
