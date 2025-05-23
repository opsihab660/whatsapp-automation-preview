const { Mistral } = require('@mistralai/mistralai');
const logger = require('../utils/logger');

class MistralService {
  constructor() {
    this.client = null;
    this.model = process.env.MISTRAL_MODEL || 'mistral-large-latest';
    this.lastRequestTime = 0;
    this.minRequestInterval = 2000; // 2 seconds between requests
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.MISTRAL_API_KEY) {
        throw new Error('MISTRAL_API_KEY environment variable is required');
      }

      this.client = new Mistral({
        apiKey: process.env.MISTRAL_API_KEY
      });

      logger.info('Mistral AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Mistral AI service:', error);
      throw error;
    }
  }

  async generateResponse(message, context = {}) {
    return new Promise((resolve, reject) => {
      // Add to queue for rate limiting
      this.requestQueue.push({
        message,
        context,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Wait if we need to respect rate limiting
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        logger.debug(`Rate limiting: waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      try {
        const response = await this.makeAPIRequest(request.message, request.context);
        this.lastRequestTime = Date.now();
        request.resolve(response);
      } catch (error) {
        logger.error('Error in queued request:', error);
        request.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  async makeAPIRequest(message, context = {}) {
    try {
      if (!this.client) {
        throw new Error('Mistral client not initialized');
      }

      // Build conversation context
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = this.formatUserMessage(message, context);

      const response = await this.client.chat.complete({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response generated from Mistral AI');
      }

      const aiResponse = response.choices[0].message.content.trim();

      logger.info('AI response generated successfully', {
        inputLength: message.length,
        outputLength: aiResponse.length,
        model: this.model
      });

      return aiResponse;
    } catch (error) {
      logger.error('Error generating AI response:', error);

      // Return a fallback response
      return this.getFallbackResponse(error);
    }
  }

  buildSystemPrompt(context) {
    const basePrompt = `You are a helpful WhatsApp AI assistant. Your responses should be:
- Friendly and conversational
- Concise but informative
- Appropriate for WhatsApp messaging
- Helpful and engaging
- Professional yet approachable

Guidelines:
- Keep responses under 200 words when possible
- Use emojis sparingly and appropriately
- Be respectful and inclusive
- If you don't know something, admit it honestly
- Avoid controversial topics unless specifically asked
- Respond in the same language as the user's message when possible`;

    // Add context-specific information
    if (context.senderName) {
      return `${basePrompt}\n\nYou are chatting with ${context.senderName}.`;
    }

    if (context.previousMessages && context.previousMessages.length > 0) {
      const recentContext = context.previousMessages
        .slice(-3)
        .map(msg => `${msg.isFromMe ? 'You' : 'User'}: ${msg.text}`)
        .join('\n');

      return `${basePrompt}\n\nRecent conversation context:\n${recentContext}`;
    }

    return basePrompt;
  }

  formatUserMessage(message, context) {
    let formattedMessage = message;

    // Add timestamp context if available
    if (context.timestamp) {
      const date = new Date(context.timestamp);
      formattedMessage = `[${date.toLocaleString()}] ${message}`;
    }

    return formattedMessage;
  }

  getFallbackResponse(error) {
    const fallbackResponses = [
      "I'm sorry, I'm having trouble processing your message right now. Could you please try again?",
      "I apologize, but I'm experiencing some technical difficulties. Please try sending your message again.",
      "Sorry, I couldn't understand that. Could you rephrase your message?",
      "I'm currently having some issues. Please try again in a moment.",
      "Apologies for the inconvenience. I'm having trouble responding right now. Please try again."
    ];

    // Log the error type for debugging
    if (error.message.includes('API key')) {
      logger.error('Mistral API key issue detected');
      return "I'm sorry, there's a configuration issue. Please contact support.";
    }

    if (error.message.includes('rate limit')) {
      logger.error('Mistral API rate limit exceeded');
      return "I'm receiving too many messages right now. Please try again in a few minutes.";
    }

    if (error.message.includes('network') || error.message.includes('timeout')) {
      logger.error('Network issue with Mistral API');
      return "I'm having connectivity issues. Please try again in a moment.";
    }

    // Return a random fallback response
    const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
    return fallbackResponses[randomIndex];
  }

  async testConnection() {
    try {
      const testResponse = await this.generateResponse("Hello, this is a test message.");
      logger.info('Mistral AI connection test successful');
      return { success: true, response: testResponse };
    } catch (error) {
      logger.error('Mistral AI connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to customize AI behavior based on settings
  updateSettings(settings) {
    if (settings.model && settings.model !== this.model) {
      this.model = settings.model;
      logger.info(`Mistral model updated to: ${this.model}`);
    }
  }

  // Method to get available models (for future use)
  async getAvailableModels() {
    try {
      // This would require the Mistral API to support listing models
      // For now, return the known models
      return [
        'mistral-large-latest',
        'mistral-medium-latest',
        'mistral-small-latest'
      ];
    } catch (error) {
      logger.error('Error fetching available models:', error);
      return ['mistral-large-latest']; // fallback
    }
  }
}

module.exports = new MistralService();
