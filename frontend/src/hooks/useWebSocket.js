import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getBaseUrl } from '../utils/config';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connectSocket = () => {
      const socketUrl = getBaseUrl();

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setSocket(newSocket);
        reconnectAttempts.current = 0;

        // Request current status when connected
        newSocket.emit('request-status');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);

        // Attempt to reconnect if disconnection was not intentional
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect automatically
          return;
        }

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

          setTimeout(() => {
            newSocket.connect();
          }, Math.pow(2, reconnectAttempts.current) * 1000); // Exponential backoff
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('connection-status', (status) => {
        setConnectionStatus(status);
      });

      return newSocket;
    };

    const socketInstance = connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const reconnect = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  };

  const requestStatus = () => {
    if (socket && socket.connected) {
      socket.emit('request-status');
    }
  };

  return {
    socket,
    isConnected,
    connectionStatus,
    reconnect,
    requestStatus
  };
};
