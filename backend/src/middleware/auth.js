const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Simple authentication middleware
// In a production environment, you would implement proper user authentication
class AuthMiddleware {
  // Generate a simple session token (for demo purposes)
  generateToken(payload = {}) {
    return jwt.sign(
      { 
        ...payload, 
        timestamp: Date.now(),
        sessionId: Math.random().toString(36).substring(7)
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Verify token middleware
  verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1]; // Bearer token
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access token required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  }

  // Optional authentication (doesn't fail if no token)
  optionalAuth(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = decoded;
      }
      
      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  }

  // Simple session creation endpoint
  createSession(req, res) {
    try {
      const { deviceId, userAgent } = req.body;
      
      const token = this.generateToken({
        deviceId: deviceId || 'unknown',
        userAgent: userAgent || req.headers['user-agent'] || 'unknown'
      });

      res.json({
        success: true,
        data: {
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        },
        message: 'Session created successfully'
      });
    } catch (error) {
      logger.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create session',
        message: error.message
      });
    }
  }

  // Rate limiting by IP
  createRateLimiter(windowMs = 15 * 60 * 1000, max = 100) {
    const requests = new Map();

    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (!requests.has(ip)) {
        requests.set(ip, []);
      }

      const userRequests = requests.get(ip);
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= max) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`
        });
      }

      validRequests.push(now);
      requests.set(ip, validRequests);
      
      next();
    };
  }
}

module.exports = new AuthMiddleware();
