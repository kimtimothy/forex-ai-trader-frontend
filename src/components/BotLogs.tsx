import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Box, Paper, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { getApiUrl, getWebSocketUrl } from '../utils/api';
import { WS_CONFIG } from '../config';

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
}

interface ConnectionStatus {
  sid: string;
  timestamp: string;
  status: 'connected' | 'disconnected';
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
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
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
      const newSocket = io(getWebSocketUrl(), {
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
            try {
              // Update bot status with the response
              setBotStatus(prevStatus => ({
                ...prevStatus,
                isRunning: Boolean(response.isRunning),
                status: String(response.status || 'unknown'),
                lastTradeTime: response.lastTradeTime ? String(response.lastTradeTime) : undefined,
                lastError: response.lastError ? String(response.lastError) : undefined,
                uptime: response.uptime ? String(response.uptime) : undefined,
                lastUpdate: new Date().toISOString()
              }));
              console.log('Successfully updated bot status');
            } catch (err) {
              console.error('Error updating bot status:', err);
              setError('Error processing bot status data');
            }
          });
        };

        // Add a delay before requesting bot status
        setTimeout(requestBotStatus, 1000);
      });

      newSocket.on('connect_error', (err: Error) => {
        console.error('Socket connection error:', err);
        setIsConnected(false);
        setIsLoading(false);
        
        // Log error message
        console.error('Connection error message:', err.message);
        
        // Handle connection limit reached
        if (err.message.includes('Connection limit reached')) {
          console.log('Connection limit reached, waiting before retry...');
          setError('Server connection limit reached. Waiting to retry...');
          
          // Increment connection attempts
          setConnectionAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= MAX_CONNECTION_ATTEMPTS) {
              setError('Maximum connection attempts reached. Please try again later.');
              return newAttempts;
            }
            
            // Calculate delay with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, prev), 10000); // Max 10 second delay
            console.log(`Will retry in ${delay}ms (attempt ${newAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
            
            // Schedule new connection attempt
            setTimeout(() => {
              console.log('Attempting new connection after delay');
              newSocket.close();
              initializeSocket();
            }, delay);
            
            return newAttempts;
          });
        } else {
          setError(`Connection error: ${err.message}`);
          // For other errors, try immediate reconnection if within retry limits
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              console.log('Attempting immediate reconnection for non-limit error');
              newSocket.connect();
            }, RETRY_DELAY);
          }
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        // Handle different disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          // Server initiated disconnect or transport closed
          if (retryCount < MAX_RETRIES) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            console.log(`Server disconnected, retrying in ${delay}ms (${retryCount + 1}/${MAX_RETRIES})`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              newSocket.connect();
            }, delay);
          }
        }
      });

      newSocket.on('error', (err: Error) => {
        console.error('Socket error:', err);
        setError(`Socket error: ${err.message}`);
        
        // Log error message
        console.error('Error message:', err.message);
      });

      newSocket.on('connection_status', (status: ConnectionStatus) => {
        try {
          console.log('Connection status:', status);
          setIsConnected(status.status === 'connected');
          if (status.status === 'connected') {
            setError(null);
            // Request bot status when connection is established
            setTimeout(() => {
              newSocket.emit('get_bot_status');
            }, 1000);
          }
        } catch (err) {
          console.error('Error handling connection status:', err);
        }
      });

      newSocket.on('bot_log', (log: BotLog) => {
        try {
          console.log('Received bot log:', log);
          if (log && typeof log === 'object') {
            setLogs(prevLogs => [...prevLogs, log].slice(-100));
          } else {
            console.error('Invalid log format received:', log);
          }
        } catch (err) {
          console.error('Error handling bot log:', err);
        }
      });

      newSocket.on('bot_status', (status: any) => {
        try {
          console.log('Received bot status event:', status);
          if (!status || typeof status !== 'object') {
            console.error('Invalid status format received:', status);
            return;
          }

          // Update bot status with the received data
          setBotStatus(prevStatus => ({
            ...prevStatus,
            isRunning: Boolean(status.isRunning),
            status: String(status.status || 'unknown'),
            lastTradeTime: status.lastTradeTime ? String(status.lastTradeTime) : undefined,
            lastError: status.lastError ? String(status.lastError) : undefined,
            uptime: status.uptime ? String(status.uptime) : undefined,
            lastUpdate: new Date().toISOString()
          }));
          console.log('Successfully updated bot status from event');
        } catch (err) {
          console.error('Error handling bot status event:', err);
          setError('Error processing bot status data');
        }
      });

      // Add bot_status_change event handler
      newSocket.on('bot_status_change', (data: { status: string }) => {
        try {
          console.log('Received bot status change:', data);
          if (data && typeof data.status === 'string') {
            setBotStatus(prevStatus => ({
              ...prevStatus,
              status: data.status,
              isRunning: data.status === 'running',
              lastUpdate: new Date().toISOString()
            }));
          }
        } catch (err) {
          console.error('Error handling bot status change:', err);
        }
      });

      // Add error event handler for parse errors
      newSocket.on('parse_error', (err) => {
        console.error('Socket parse error:', err);
        setError('Error parsing server response');
        
        // Log the raw data that caused the parse error
        if (err.data) {
          console.error('Raw data that caused parse error:', err.data);
        }
        
        // Don't reconnect immediately on parse errors
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
          console.log(`Will retry after parse error in ${delay}ms (${retryCount + 1}/${MAX_RETRIES})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            newSocket.connect();
          }, delay);
        }
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleReconnect}>
              Retry Connection
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bot Status: {botStatus.status || (botStatus.isRunning ? 'Running' : 'Stopped')}
        </Typography>
        {botStatus.uptime && (
          <Typography variant="body2" color="text.secondary">
            Uptime: {botStatus.uptime}
          </Typography>
        )}
        {botStatus.lastError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Error: {botStatus.lastError}
          </Typography>
        )}
        {!isConnected && connectionAttempts > 0 && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            Connection attempts: {connectionAttempts}/{MAX_CONNECTION_ATTEMPTS}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2, maxHeight: '400px', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Bot Logs
        </Typography>
        {logs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No logs available yet
          </Typography>
        ) : (
          logs.map((log, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="body2" component="span" color="text.secondary">
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                component="span"
                sx={{
                  ml: 1,
                  color: log.level === 'ERROR' ? 'error.main' : 
                         log.level === 'WARNING' ? 'warning.main' : 
                         'text.primary'
                }}
              >
                [{log.level}]
              </Typography>
              <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                {log.message}
              </Typography>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default BotLogs;
 