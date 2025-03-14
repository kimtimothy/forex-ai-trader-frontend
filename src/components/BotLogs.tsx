import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Typography, Box, Alert } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/api';

interface LogMessage {
    message: string;
    level: string;
    timestamp?: string;
}

const BotLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const logsEndRef = useRef<null | HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    
    const connectSocket = useCallback(() => {
        if (socketRef.current?.connected) {
            console.log('Socket already connected, skipping connection attempt');
            return;
        }

        // Clear any existing reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        const backendUrl = getWebSocketUrl();
        console.log(`Attempting to connect to socket at ${backendUrl}...`);
        setConnectionAttempts(prev => prev + 1);

        const socket = io(backendUrl, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 60000,
            forceNew: true,
            path: '/socket.io/',
            withCredentials: true,
            auth: {
                timestamp: Date.now()
            },
            extraHeaders: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setError(null);
            setIsConnected(true);
            setConnectionAttempts(0);
            setLogs(prev => [...prev, { 
                message: `Connected to bot server (${connectionAttempts > 0 ? 'reconnected' : 'initial'})`, 
                level: 'INFO',
                timestamp: new Date().toISOString()
            }]);
        });

        socket.on('connection_status', (data) => {
            console.log('Connection status:', data);
            if (data.status === 'connected') {
                setIsConnected(true);
                setError(null);
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setIsConnected(false);
            setError(`Connection error: ${err.message}`);
            
            // Implement exponential backoff for reconnection
            const backoffDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 10000);
            reconnectTimeoutRef.current = setTimeout(() => {
                if (!socket.connected && connectionAttempts < 5) {
                    console.log(`Retrying connection after ${backoffDelay}ms...`);
                    socket.disconnect();
                    connectSocket();
                }
            }, backoffDelay);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            setError(`Disconnected: ${reason}`);
            
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect immediately
                socket.connect();
            } else if (reason === 'transport close' || reason === 'transport error') {
                // Transport issues, attempt reconnect with backoff
                const backoffDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 10000);
                reconnectTimeoutRef.current = setTimeout(connectSocket, backoffDelay);
            }
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            setError(`Socket error: ${typeof error === 'string' ? error : error.message}`);
        });

        socket.on('bot_log', (data: LogMessage) => {
            console.log('Received bot log:', data);
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString();
            }
            setLogs(prevLogs => [...prevLogs, data]);
        });

        // Ping to keep connection alive
        const pingInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('ping');
            }
        }, 25000); // Every 25 seconds

        return () => {
            clearInterval(pingInterval);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);
    
    useEffect(() => {
        connectSocket();
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connectSocket]);
    
    const scrollToBottom = useCallback(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [logs, scrollToBottom]);
    
    return (
        <Paper 
            elevation={3} 
            sx={{ 
                p: 2, 
                mt: 2, 
                height: '400px', 
                overflowY: 'auto',
                backgroundColor: '#1e1e1e'
            }}
        >
            <Typography variant="h6" gutterBottom color="white" sx={{ display: 'flex', alignItems: 'center' }}>
                Bot Logs
                <Box
                    sx={{
                        ml: 2,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: isConnected ? '#4caf50' : '#f44336'
                    }}
                />
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {logs.map((log, index) => (
                    <Box 
                        key={index} 
                        sx={{ 
                            color: log.level === 'ERROR' ? '#ff6b6b' : 
                                  log.level === 'WARNING' ? '#ffd93d' : '#98c379',
                            mb: 0.5
                        }}
                    >
                        {log.timestamp && (
                            <span style={{ color: '#666', marginRight: '8px' }}>
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                        )}
                        {log.message}
                    </Box>
                ))}
                <div ref={logsEndRef} />
            </Box>
        </Paper>
    );
};

export default BotLogs; 