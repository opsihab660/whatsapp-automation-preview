import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const ConnectionStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status.status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-whatsapp-600',
          bgColor: 'bg-whatsapp-100 dark:bg-whatsapp-900',
          dotColor: 'bg-whatsapp-500'
        };
      case 'connecting':
      case 'qr_generated':
        return {
          icon: RefreshCw,
          text: 'Connecting',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          dotColor: 'bg-yellow-500',
          animate: true
        };
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900',
          dotColor: 'bg-red-500'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${config.bgColor}`}
    >
      <div className="relative">
        <Icon 
          className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} 
        />
        <div 
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${config.dotColor} ${
            config.animate ? 'animate-pulse' : ''
          }`} 
        />
      </div>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    </motion.div>
  );
};

export default ConnectionStatus;
