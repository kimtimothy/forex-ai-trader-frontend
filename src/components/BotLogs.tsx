import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { BACKEND_URL, WS_CONFIG } from '../config';

interface BotLog {
  message: string;
  level: string;
  timestamp: string;
  data?: any;
}

interface BotStatus {
  status: string;
  lastTradeTime: string | null;
  lastError: string | null;
  isRunning: boolean;
  uptime: string;
}

const BotLogs: React.FC = () => {
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, WS_CONFIG);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
      setIsLoading(false);
      // Request initial bot status
      newSocket.emit('get_bot_status');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to server');
      setIsConnected(false);
      setIsLoading(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      setIsLoading(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('Socket error occurred');
      setIsLoading(false);
    });

    newSocket.on('bot_log', (data: BotLog) => {
      console.log('Received bot log:', data);
      setLogs(prevLogs => [...prevLogs, data]);
    });

    newSocket.on('bot_status', (status: BotStatus) => {
      console.log('Received bot status:', status);
      setBotStatus(status);
    });

    newSocket.on('bot_status_change', (data: { status: string }) => {
      console.log('Bot status changed:', data);
      if (botStatus) {
        setBotStatus({
          ...botStatus,
          status: data.status,
          isRunning: data.status === 'running'
        });
      }
    });

    setSocket(newSocket);

    // Set up ping interval
    const pingInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      newSocket.close();
    };
  }, []);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Bot Logs</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            width={10}
            height={10}
            borderRadius="50%"
            bgcolor={isConnected ? 'success.main' : 'error.main'}
          />
          <Typography variant="body2" color="text.secondary">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
      </Box>

      {botStatus && (
        <Box mb={2}>
          <Typography variant="subtitle2">
            Bot Status: {botStatus.status}
          </Typography>
          <Typography variant="body2">Uptime: {botStatus.uptime}</Typography>
          {botStatus.lastError && (
            <Typography variant="body2" color="error">
              Last Error: {botStatus.lastError}
            </Typography>
          )}
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'grey.100',
          p: 1,
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        }}
      >
        {logs.map((log, index) => (
          <Box
            key={index}
            sx={{
              mb: 1,
              p: 1,
              borderRadius: 1,
              bgcolor: 'background.paper',
              borderLeft: 4,
              borderColor:
                log.level === 'ERROR' ? 'error.main' : 'primary.main',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {new Date(log.timestamp).toLocaleString()}
            </Typography>
            <Typography
              variant="body2"
              color={log.level === 'ERROR' ? 'error.main' : 'text.primary'}
            >
              {log.message}
            </Typography>
            {log.data && (
              <Typography variant="body2" color="text.secondary">
                {JSON.stringify(log.data, null, 2)}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default BotLogs;
