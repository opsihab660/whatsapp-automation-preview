const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/auth');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WhatsApp routes
router.get('/whatsapp/status', whatsappController.getStatus);
router.post('/whatsapp/connect', whatsappController.connect);
router.post('/whatsapp/disconnect', whatsappController.disconnect);
router.post('/whatsapp/send-message', whatsappController.sendMessage);
router.post('/whatsapp/toggle-auto-reply', whatsappController.toggleAutoReply);
router.get('/whatsapp/auto-reply-status', whatsappController.getAutoReplyStatus);

// Message routes
router.get('/messages', messageController.getMessages);
router.get('/messages/:number', messageController.getMessagesByNumber);
router.post('/messages/send', messageController.sendMessage);
router.delete('/messages/:id', messageController.deleteMessage);

// AI routes
router.post('/ai/test', messageController.testAI);
router.post('/ai/generate-response', messageController.generateAIResponse);

// Settings routes
router.get('/settings', messageController.getSettings);
router.post('/settings', messageController.updateSettings);

module.exports = router;
