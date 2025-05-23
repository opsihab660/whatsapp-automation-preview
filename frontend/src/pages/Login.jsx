import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const { connectionStatus, testAI } = useWhatsApp();
  const { isDark } = useTheme();
  const [isTestingAI, setIsTestingAI] = useState(false);

  const handleTestAI = async () => {
    setIsTestingAI(true);
    try {
      await testAI();
    } catch (error) {
      console.error('AI test failed:', error);
    } finally {
      setIsTestingAI(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <Wifi className="w-6 h-6 text-whatsapp-500" />;
      case 'connecting':
      case 'qr_generated':
        return <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-6 h-6 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'Connected to WhatsApp';
      case 'connecting':
        return 'Connecting to WhatsApp...';
      case 'qr_generated':
        return 'Scan QR Code with WhatsApp';
      default:
        return 'Disconnected from WhatsApp';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-whatsapp-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-whatsapp-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Smartphone className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            WhatsApp AI Bot
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your WhatsApp to start using AI-powered auto-replies
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          {/* Connection Status */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <span className="font-medium text-gray-900 dark:text-white">
                {getStatusText()}
              </span>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus.status === 'connected' ? 'status-connected' :
              connectionStatus.status === 'connecting' || connectionStatus.status === 'qr_generated' ? 'status-connecting' :
              'status-disconnected'
            }`} />
          </div>

          {/* QR Code Section */}
          {connectionStatus.qrCode ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6"
            >
              <div className="qr-container p-6 rounded-xl mb-4">
                <img
                  src={connectionStatus.qrCode}
                  alt="WhatsApp QR Code"
                  className="w-48 h-48 mx-auto bg-white p-4 rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Scan with WhatsApp
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>1. Open WhatsApp on your phone</p>
                  <p>2. Go to Settings → Linked Devices</p>
                  <p>3. Tap "Link a Device"</p>
                  <p>4. Scan this QR code</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {connectionStatus.status === 'connected' 
                  ? 'WhatsApp is connected and ready!'
                  : 'Waiting for QR code...'
                }
              </p>
            </motion.div>
          )}

          {/* AI Test Section */}
          <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                AI Service Status
              </h4>
              <button
                onClick={handleTestAI}
                disabled={isTestingAI}
                className="btn-secondary text-sm"
              >
                {isTestingAI ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test AI'
                )}
              </button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 p-3 rounded-lg">
              <p>• Model: Mistral Large Latest</p>
              <p>• Auto-reply: Enabled</p>
              <p>• Response time: ~2-3 seconds</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400"
        >
          <p>Powered by Mistral AI • Secure & Private</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
