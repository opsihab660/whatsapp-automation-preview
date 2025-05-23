const database = require('../utils/database');
const mistralService = require('../services/mistralService');
const logger = require('../utils/logger');

class MessageController {
  async getMessages(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const messages = await database.getMessages(parseInt(limit), parseInt(offset));
      
      res.json({
        success: true,
        data: messages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: messages.length
        }
      });
    } catch (error) {
      logger.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
        message: error.message
      });
    }
  }

  async getMessagesByNumber(req, res) {
    try {
      const { number } = req.params;
      const { limit = 50 } = req.query;
      
      if (!number) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      const messages = await database.getMessagesByNumber(number, parseInt(limit));
      
      res.json({
        success: true,
        data: messages,
        pagination: {
          limit: parseInt(limit),
          total: messages.length
        }
      });
    } catch (error) {
      logger.error('Error fetching messages by number:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
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

      // This will be handled by the WhatsApp controller
      // Redirect to WhatsApp controller
      const whatsappController = require('./whatsappController');
      return whatsappController.sendMessage(req, res);
    } catch (error) {
      logger.error('Error in message controller sendMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        message: error.message
      });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      // Note: This would require implementing a delete method in the database
      // For now, we'll return a not implemented response
      res.status(501).json({
        success: false,
        error: 'Message deletion not implemented yet'
      });
    } catch (error) {
      logger.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete message',
        message: error.message
      });
    }
  }

  async testAI(req, res) {
    try {
      const result = await mistralService.testConnection();
      
      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'AI service is working correctly' : 'AI service test failed'
      });
    } catch (error) {
      logger.error('Error testing AI service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test AI service',
        message: error.message
      });
    }
  }

  async generateAIResponse(req, res) {
    try {
      const { message, context = {} } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const aiResponse = await mistralService.generateResponse(message, context);
      
      res.json({
        success: true,
        data: {
          originalMessage: message,
          aiResponse,
          context,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      logger.error('Error generating AI response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI response',
        message: error.message
      });
    }
  }

  async getSettings(req, res) {
    try {
      const autoReply = await database.getSetting('auto_reply');
      const aiModel = await database.getSetting('ai_model');
      
      res.json({
        success: true,
        data: {
          autoReply: autoReply === 'true',
          aiModel: aiModel || 'mistral-large-latest',
          // Add more settings as needed
        }
      });
    } catch (error) {
      logger.error('Error fetching settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settings',
        message: error.message
      });
    }
  }

  async updateSettings(req, res) {
    try {
      const { autoReply, aiModel } = req.body;
      const updates = [];

      if (typeof autoReply === 'boolean') {
        await database.setSetting('auto_reply', autoReply.toString());
        updates.push('autoReply');
      }

      if (aiModel && typeof aiModel === 'string') {
        await database.setSetting('ai_model', aiModel);
        mistralService.updateSettings({ model: aiModel });
        updates.push('aiModel');
      }

      res.json({
        success: true,
        message: `Settings updated: ${updates.join(', ')}`,
        data: { autoReply, aiModel }
      });
    } catch (error) {
      logger.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settings',
        message: error.message
      });
    }
  }
}

module.exports = new MessageController();
