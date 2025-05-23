const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

class WhatsAppController {
  async getStatus(req, res) {
    try {
      const status = await whatsappService.getConnectionStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting WhatsApp status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get WhatsApp status',
        message: error.message
      });
    }
  }

  async connect(req, res) {
    try {
      // WhatsApp service is automatically initialized on server start
      // This endpoint can be used to trigger reconnection if needed
      const status = await whatsappService.getConnectionStatus();
      
      if (status.isConnected) {
        res.json({
          success: true,
          message: 'WhatsApp is already connected',
          data: status
        });
      } else {
        // If not connected, the service will automatically try to connect
        // and emit events via Socket.IO
        res.json({
          success: true,
          message: 'Connection process initiated. Check for QR code or connection status updates.',
          data: status
        });
      }
    } catch (error) {
      logger.error('Error connecting to WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect to WhatsApp',
        message: error.message
      });
    }
  }

  async disconnect(req, res) {
    try {
      await whatsappService.disconnect();
      res.json({
        success: true,
        message: 'WhatsApp disconnected successfully'
      });
    } catch (error) {
      logger.error('Error disconnecting WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect WhatsApp',
        message: error.message
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, message'
        });
      }

      // Validate phone number format
      const phoneRegex = /^\d{10,15}@s\.whatsapp\.net$/;
      if (!phoneRegex.test(to) && !to.includes('@g.us')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use format: 1234567890@s.whatsapp.net'
        });
      }

      const result = await whatsappService.sendMessage(to, message);
      
      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: result.key.id,
          to,
          message,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        message: error.message
      });
    }
  }

  async toggleAutoReply(req, res) {
    try {
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'enabled field must be a boolean'
        });
      }

      await whatsappService.toggleAutoReply(enabled);
      
      res.json({
        success: true,
        message: `Auto-reply ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: { enabled }
      });
    } catch (error) {
      logger.error('Error toggling auto-reply:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle auto-reply',
        message: error.message
      });
    }
  }

  async getAutoReplyStatus(req, res) {
    try {
      const enabled = await whatsappService.getAutoReplyStatus();
      
      res.json({
        success: true,
        data: { enabled }
      });
    } catch (error) {
      logger.error('Error getting auto-reply status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get auto-reply status',
        message: error.message
      });
    }
  }
}

module.exports = new WhatsAppController();
