import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Settings,
  Users,
  Bot,
  Activity,
  Send,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import MessageList from '../components/MessageList';
import ThemeToggle from '../components/ThemeToggle';
import ConnectionStatus from '../components/ConnectionStatus';
import StatsCard from '../components/StatsCard';

const Dashboard = () => {
  const {
    connectionStatus,
    messages,
    autoReply,
    toggleAutoReply,
    disconnect,
    fetchMessages,
    isLoading,
    requestStatusUpdate
  } = useWhatsApp();

  const [activeTab, setActiveTab] = useState('messages');
  const [sendMessageForm, setSendMessageForm] = useState({
    to: '',
    message: ''
  });

  useEffect(() => {
    // Fetch initial messages when component mounts
    const loadInitialMessages = async () => {
      try {
        await fetchMessages();
      } catch (error) {
        console.error('Failed to load initial messages:', error);
      }
    };

    loadInitialMessages();

    // Set up periodic refresh every 30 seconds as backup
    const interval = setInterval(() => {
      if (connectionStatus.status === 'connected') {
        fetchMessages();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionStatus.status]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    // Implementation would go here
    console.log('Send message:', sendMessageForm);
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect from WhatsApp?')) {
      await disconnect();
    }
  };

  const stats = {
    totalMessages: messages.length,
    todayMessages: messages.filter(msg => {
      const today = new Date().toDateString();
      const msgDate = new Date(msg.timestamp).toDateString();
      return today === msgDate;
    }).length,
    aiResponses: messages.filter(msg => msg.ai_response).length,
    uniqueContacts: new Set(messages.map(msg => msg.from_number)).size
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-whatsapp-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                WhatsApp AI Bot
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <ConnectionStatus status={connectionStatus} />
              <ThemeToggle />
              <button
                onClick={handleDisconnect}
                className="btn-danger text-sm"
                disabled={isLoading}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Messages"
            value={stats.totalMessages}
            icon={MessageSquare}
            color="blue"
          />
          <StatsCard
            title="Today's Messages"
            value={stats.todayMessages}
            icon={Activity}
            color="green"
          />
          <StatsCard
            title="AI Responses"
            value={stats.aiResponses}
            icon={Bot}
            color="purple"
          />
          <StatsCard
            title="Unique Contacts"
            value={stats.uniqueContacts}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Panel */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Messages
                  </h2>
                  <button
                    onClick={() => fetchMessages()}
                    className="btn-secondary text-sm"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="h-96 overflow-y-auto custom-scrollbar">
                <MessageList messages={messages} />
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Auto-Reply Toggle */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Auto-Reply Settings
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    AI Auto-Reply
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically respond to incoming messages
                  </p>
                </div>

                <button
                  onClick={() => toggleAutoReply(!autoReply)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoReply ? 'bg-whatsapp-500' : 'bg-gray-300 dark:bg-dark-600'
                  }`}
                  disabled={isLoading}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoReply ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Send Message */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Send Message
              </h3>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234567890@s.whatsapp.net"
                    className="input"
                    value={sendMessageForm.to}
                    onChange={(e) => setSendMessageForm(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Type your message..."
                    className="input resize-none"
                    value={sendMessageForm.message}
                    onChange={(e) => setSendMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={!sendMessageForm.to || !sendMessageForm.message || isLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Connection Info */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connection Info
                </h3>
                <button
                  onClick={requestStatusUpdate}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh connection status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-medium ${
                    connectionStatus.status === 'connected' ? 'text-whatsapp-600' : 'text-red-600'
                  }`}>
                    {connectionStatus.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {connectionStatus.user && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {connectionStatus.user.id?.split('@')[0]}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {connectionStatus.user.name || 'Unknown'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
