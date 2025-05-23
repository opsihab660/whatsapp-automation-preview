import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const WhatsAppContext = createContext();

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};

export const WhatsAppProvider = ({ children, socket }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'disconnected',
    user: null,
    qrCode: null
  });
  const [messages, setMessages] = useState([]);
  const [autoReply, setAutoReply] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('connection-status', (data) => {
      setConnectionStatus(prev => ({
        ...prev,
        status: data.status,
        user: data.user || null
      }));

      if (data.status === 'connected') {
        toast.success('WhatsApp connected successfully!');
      } else if (data.status === 'disconnected') {
        toast.error('WhatsApp disconnected');
      }
    });

    socket.on('qr-code', (data) => {
      setConnectionStatus(prev => ({
        ...prev,
        qrCode: data.qrCode,
        status: 'qr_generated'
      }));
    });

    socket.on('new-message', (message) => {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg =>
          (msg.message_id === message.messageId) ||
          (msg.id === message.messageId)
        );

        if (!exists) {
          // Add new message to the beginning of the array
          const newMessage = {
            id: message.messageId,
            message_id: message.messageId,
            from_number: message.fromNumber,
            from_name: message.fromName,
            message_text: message.messageText,
            message_type: message.messageType,
            timestamp: message.timestamp,
            is_from_me: message.isFromMe ? 1 : 0
          };

          toast.success(`New message from ${message.fromName || 'User'}`);
          return [newMessage, ...prev];
        }

        return prev;
      });
    });

    socket.on('ai-response', (data) => {
      toast.success('AI response sent');

      // Add the AI response as a new message
      setMessages(prev => {
        // First update the original message with AI response if it exists
        const updatedMessages = prev.map(msg =>
          (msg.message_id === data.originalMessage.messageId || msg.id === data.originalMessage.messageId)
            ? { ...msg, ai_response: data.aiResponse, ai_response_timestamp: data.timestamp }
            : msg
        );

        // Also add the AI response as a separate bot message
        const aiMessage = {
          id: `ai_${data.timestamp}`,
          message_id: `ai_${data.timestamp}`,
          from_number: 'bot',
          from_name: 'AI Assistant',
          message_text: data.aiResponse,
          message_type: 'text',
          timestamp: data.timestamp,
          is_from_me: 1 // This is from the bot
        };

        // Check if this AI message already exists
        const aiExists = updatedMessages.some(msg => msg.id === aiMessage.id);

        if (!aiExists) {
          return [aiMessage, ...updatedMessages];
        }

        return updatedMessages;
      });
    });

    socket.on('auto-reply-status', (data) => {
      setAutoReply(data.enabled);
    });

    socket.on('connection-error', (data) => {
      toast.error(data.message || 'Connection error occurred');
    });

    // Cleanup
    return () => {
      socket.off('connection-status');
      socket.off('qr-code');
      socket.off('new-message');
      socket.off('ai-response');
      socket.off('auto-reply-status');
      socket.off('connection-error');
    };
  }, [socket]);

  // API functions
  const sendMessage = async (to, message) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, message }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Message sent successfully');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoReply = async (enabled) => {
    try {
      const response = await fetch('/api/whatsapp/toggle-auto-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();

      if (data.success) {
        setAutoReply(enabled);
        toast.success(`Auto-reply ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error(data.message || 'Failed to toggle auto-reply');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus({
          status: 'disconnected',
          user: null,
          qrCode: null
        });
        toast.success('Disconnected successfully');
      } else {
        throw new Error(data.message || 'Failed to disconnect');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (limit = 50, offset = 0) => {
    try {
      const response = await fetch(`/api/messages?limit=${limit}&offset=${offset}`);
      const data = await response.json();

      if (data.success) {
        // Sort messages by timestamp in descending order (newest first)
        const sortedMessages = data.data.sort((a, b) => b.timestamp - a.timestamp);
        setMessages(sortedMessages);
        return sortedMessages;
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const testAI = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('AI service is working correctly');
        return data.data;
      } else {
        throw new Error(data.message || 'AI service test failed');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    connectionStatus,
    messages,
    autoReply,
    isLoading,
    sendMessage,
    toggleAutoReply,
    disconnect,
    fetchMessages,
    testAI,
    setMessages
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
