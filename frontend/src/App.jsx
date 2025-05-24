import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useWebSocket } from './hooks/useWebSocket';
import { ThemeProvider } from './contexts/ThemeContext';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import { getApiUrl } from './utils/config';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize WebSocket connection
  const { socket, connectionStatus } = useWebSocket();

  useEffect(() => {
    // Check initial connection status
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/whatsapp/status`);
        const data = await response.json();

        if (data.success) {
          setIsConnected(data.data.isConnected);
        }
      } catch (error) {
        console.error('Failed to check connection status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnectionStatus();
  }, []);

  useEffect(() => {
    if (connectionStatus) {
      const isConnectedNow = connectionStatus.status === 'connected';
      console.log('Connection status update:', connectionStatus.status, 'isConnected:', isConnectedNow);
      setIsConnected(isConnectedNow);
    }
  }, [connectionStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading WhatsApp Bot...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <WhatsAppProvider socket={socket}>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
            <Routes>
              <Route
                path="/login"
                element={
                  isConnected ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />
              <Route
                path="/dashboard"
                element={
                  isConnected ? <Dashboard /> : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/"
                element={
                  <Navigate to={isConnected ? "/dashboard" : "/login"} replace />
                }
              />
            </Routes>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </WhatsAppProvider>
    </ThemeProvider>
  );
}

export default App;
