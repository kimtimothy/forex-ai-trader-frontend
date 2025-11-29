import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/api';
import { WS_CONFIG } from '../config';

// Extend Socket interface to include our custom property
interface ExtendedSocket extends Socket {
  statusInterval?: NodeJS.Timeout;
}

interface BotLog {
  timestamp: string;
  level: string;
  message: string;
}

interface BotStatus {
  isRunning: boolean;
  lastUpdate: string;
  error?: string;
  status: string;
  lastTradeTime?: string;
  lastError?: string;
  uptime?: string;
  bot_enabled_since?: string;
}


const BotLogs: React.FC = () => {
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    lastUpdate: new Date().toISOString(),
    status: 'stopped'
  });
  const [displayUptime, setDisplayUptime] = useState<string>('0:00:00');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<ExtendedSocket | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const RETRY_DELAY = 2000; // 2 seconds
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_CONNECTION_ATTEMPTS = 5;

  const initializeSocket = useCallback(() => {
    try {
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        setError('Maximum connection attempts reached. Please refresh the page.');
        setIsLoading(false);
        return undefined;
      }

      console.log(`Initializing socket connection to: ${getWebSocketUrl()} (Attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS})`);
      const newSocket: ExtendedSocket = io(getWebSocketUrl(), {
        ...WS_CONFIG,
        reconnection: false, // Disable auto-reconnection to handle it manually
        autoConnect: true,
        forceNew: true,
        transports: ['websocket'],
        upgrade: false,
        query: {
          clientId: `client_${Date.now()}`,
          attempt: connectionAttempts + 1
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
        setRetryCount(0);
        setConnectionAttempts(0);
        
        // Request initial bot status with proper error handling
        console.log('Requesting initial bot status');
        const requestBotStatus = () => {
          newSocket.emit('get_bot_status', (response: any) => {
            console.log('Received bot status response:', response);
            
            // Handle error response
            if (response && response.error) {
              console.error('Error getting bot status:', response.error);
              setError(`Failed to get bot status: ${response.error}`);
              // Retry after error with exponential backoff
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
              console.log(`Retrying bot status request in ${delay}ms`);
              setTimeout(requestBotStatus, delay);
              return;
            }
            
            // Handle no response
            if (!response) {
              console.error('No response received from get_bot_status');
              setError('No response received from server');
              // Retry after no response with exponential backoff
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
              console.log(`Retrying bot status request in ${delay}ms`);
              setTimeout(requestBotStatus, delay);
              return;
            }
            
            // Handle successful response
            console.log('Bot status received successfully:', response);
            setBotStatus(response);
            setError(null);
          });
        };
        
        // Initial request
        requestBotStatus();
        
        // Set up periodic status updates
        const statusInterval = setInterval(() => {
          newSocket.emit('get_bot_status', (response: any) => {
            if (response && !response.error) {
              setBotStatus(response);
            }
          });
        }, 10000); // Update every 10 seconds
        
        // Store interval for cleanup
        newSocket.statusInterval = statusInterval;
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        setError('WebSocket connection lost');
        
        // Clear status interval
        if (newSocket.statusInterval) {
          clearInterval(newSocket.statusInterval);
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnectionAttempts(prev => prev + 1);
        setError(`Connection failed: ${err.message}`);
        
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS - 1) {
          setTimeout(() => {
            console.log(`Retrying connection in ${RETRY_DELAY}ms...`);
            newSocket.connect();
          }, RETRY_DELAY);
        } else {
          setIsLoading(false);
        }
      });

      newSocket.on('bot_log', (log: BotLog) => {
        setLogs(prevLogs => {
          const newLogs = [...prevLogs, log].slice(-100);
          return newLogs;
        });
      });

      newSocket.on('bot_status', (status: BotStatus) => {
        setBotStatus(status);
      });

      newSocket.on('bot_status_update', (status: BotStatus) => {
        console.log('Received bot status update:', status);
        setBotStatus(status);
      });

      setSocket(newSocket);
      
      return () => {
        if (newSocket.statusInterval) {
          clearInterval(newSocket.statusInterval);
        }
        newSocket.disconnect();
      };
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError('Failed to initialize socket connection');
      setIsLoading(false);
      return undefined;
    }
  }, [retryCount, connectionAttempts]);

  useEffect(() => {
    const cleanup = initializeSocket();
    return () => {
      if (cleanup) cleanup();
    };
  }, [initializeSocket]);

  // Update uptime display every second
  useEffect(() => {
    if (!botStatus.isRunning || !botStatus.bot_enabled_since) {
      setDisplayUptime('0:00:00');
      return;
    }

    const updateUptime = () => {
      const enabledSince = new Date(botStatus.bot_enabled_since!);
      const now = new Date();
      const diffMs = now.getTime() - enabledSince.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      
      setDisplayUptime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateUptime(); // Update immediately
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [botStatus.isRunning, botStatus.bot_enabled_since]);

  // Add a manual reconnect button
  const handleReconnect = () => {
    if (socket) {
      console.log('Manual reconnection attempt');
      setRetryCount(0);
      setConnectionAttempts(0);
      socket.connect();
    }
  };

  if (isLoading) {
    return (
      <div className="modern-card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(99, 102, 241, 0.3)',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#fca5a5',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {error}</span>
          <button
            className="modern-button"
            onClick={handleReconnect}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              minWidth: 'auto',
              backgroundColor: 'rgba(239, 68, 68, 0.2)'
            }}
            aria-label="Retry connection"
          >
            🔄 Retry
          </button>
        </div>
      )}
      
      <div className="modern-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#ffffff'
        }}>
          🔌 Connection Status
        </h3>
        <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Status:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Bot Status:</strong> {botStatus.status || (botStatus.isRunning ? 'Running' : 'Stopped')}
          </div>
          {botStatus.isRunning && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Uptime:</strong> {displayUptime}
            </div>
          )}
          {botStatus.lastError && (
            <div style={{ marginBottom: '8px', color: '#fca5a5' }}>
              <strong>Error:</strong> {botStatus.lastError}
            </div>
          )}
          {!isConnected && connectionAttempts > 0 && (
            <div style={{ color: '#f59e0b' }}>
              <strong>Connection attempts:</strong> {connectionAttempts}/{MAX_CONNECTION_ATTEMPTS}
            </div>
          )}
        </div>
      </div>

      <div className="modern-card" style={{ maxHeight: '400px', overflow: 'auto' }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#ffffff'
        }}>
          📝 Bot Logs ({logs.length})
        </h3>
        <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {logs.length === 0 && (
            <div style={{ color: '#cbd5e1', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No logs available yet
            </div>
          )}
          {logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '8px', 
                padding: '8px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ color: '#cbd5e1', marginRight: '12px' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                <span style={{
                  marginRight: '12px',
                  color: log.level === 'error' ? '#ef4444' : 
                         log.level === 'warning' ? '#f59e0b' : 
                         '#10b981',
                  fontWeight: '600'
                }}>
                  [{log.level.toUpperCase()}]
                </span>
                <span style={{ color: '#ffffff' }}>
                  {log.message}
                </span>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BotLogs;
 