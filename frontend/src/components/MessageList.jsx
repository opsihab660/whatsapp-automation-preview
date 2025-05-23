import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Bot, User, Image, Video, FileText, MapPin, Phone } from 'lucide-react';

const MessageList = ({ messages }) => {
  const messagesTopRef = useRef(null);

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    if (messagesTopRef.current) {
      messagesTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const getMessageIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'contact':
        return <Phone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatDate = (timestamp) => {
    return format(new Date(timestamp), 'MMM dd, yyyy');
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No messages yet</p>
          <p className="text-sm">Messages will appear here when received</p>
        </div>
      </div>
    );
  }

  // Group messages by date and reverse order (newest first)
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedGroupedMessages = Object.entries(groupedMessages).sort(([dateA], [dateB]) => {
    return new Date(dateB) - new Date(dateA);
  });

  return (
    <div className="p-4 space-y-6">
      {/* Invisible element to scroll to - at the top */}
      <div ref={messagesTopRef} />

      <AnimatePresence>
        {sortedGroupedMessages.map(([date, dateMessages]) => {
          // Reverse the messages within each date group (newest first)
          const reversedMessages = [...dateMessages].reverse();

          return (
            <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-200 dark:bg-dark-600 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {date}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-4">
              {reversedMessages.map((message, index) => {
                // Determine if this is a bot message (sent by us) or user message (received)
                const isBotMessage = message.is_from_me === 1 || message.is_from_me === true;

                return (
                  <motion.div
                    key={message.id || message.message_id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {/* User Message - Right Side */}
                    {!isBotMessage && (
                      <div className="flex justify-end">
                        <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                          {/* User Message Bubble */}
                          <div className="message-sent">
                            {/* Sender name */}
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-white/70">
                                {message.from_name || 'User'}
                              </span>
                            </div>

                            {/* Message content */}
                            <div className="space-y-2">
                              {/* Message type indicator */}
                              {message.message_type !== 'text' && (
                                <div className="flex items-center space-x-2 text-xs opacity-75">
                                  {getMessageIcon(message.message_type)}
                                  <span className="capitalize">{message.message_type}</span>
                                </div>
                              )}

                              {/* Message text */}
                              {message.message_text && (
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.message_text}
                                </p>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="flex justify-end mt-2">
                              <span className="text-xs text-white/70">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* User Avatar */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bot Message - Left Side */}
                    {isBotMessage && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                          {/* Bot Avatar */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-whatsapp-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>

                          {/* Bot Message Bubble */}
                          <div className="message-received">
                            {/* Bot label */}
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                AI Assistant
                              </span>
                            </div>

                            {/* Message content */}
                            <div className="space-y-2">
                              {/* Message type indicator */}
                              {message.message_type !== 'text' && (
                                <div className="flex items-center space-x-2 text-xs opacity-75">
                                  {getMessageIcon(message.message_type)}
                                  <span className="capitalize">{message.message_type}</span>
                                </div>
                              )}

                              {/* Message text */}
                              {message.message_text && (
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.message_text}
                                </p>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="flex justify-end mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Response (if exists for user messages) */}
                    {!isBotMessage && message.ai_response && (
                      <div className="flex justify-start mt-2">
                        <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                          {/* AI Avatar */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-whatsapp-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>

                          {/* AI Response Bubble */}
                          <div className="message-ai">
                            <div className="flex items-center space-x-2 mb-1">
                              <Bot className="w-3 h-3" />
                              <span className="text-xs font-medium">AI Response</span>
                            </div>

                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.ai_response}
                            </p>

                            <div className="flex justify-end mt-2">
                              <span className="text-xs text-whatsapp-600 dark:text-whatsapp-400">
                                {message.ai_response_timestamp &&
                                  formatTime(message.ai_response_timestamp)
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
