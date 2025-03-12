import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Box, Alert } from '@mui/material';
import { io, Socket } from 'socket.io-client';

interface LogMessage {
    message: string;
    level: string;
    timestamp?: string;
}

const BotLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const logsEndRef = useRef<null | HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    
    const connectSocket = () => {
        if (socketRef.current?.connected) {
            console.log('Socket already connected, skipping connection attempt');
            return;
        }

        console.log('Attempting to connect to socket...');
        setConnectionAttempts(prev => prev + 1);

        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            transports: connectionAttempts < 2 ? ['websocket'] : ['polling', 'websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 60000,
            forceNew: true,
            path: '/socket.io'
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setError(null);
            setLogs(prev => [...prev, { 
                message: `Connected to bot server (${connectionAttempts > 0 ? 'reconnected' : 'initial'})`, 
                level: 'INFO' 
            }]);
        });

        socket.on('connection_status', (data) => {
            console.log('Connection status:', data);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError(`Connection error: ${err.message}`);
            
            if (connectionAttempts < 2) {
                console.log('Retrying connection with different transport...');
                socket.disconnect();
                setTimeout(connectSocket, 1000);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setError(`Disconnected: ${reason}`);
            
            if (reason === 'transport close' || reason === 'transport error') {
                console.log('Transport issue, attempting reconnect...');
                setTimeout(connectSocket, 1000);
            }
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            setError(`Socket error: ${error.message}`);
        });

        socket.on('bot_log', (data: LogMessage) => {
            console.log('Received bot log:', data);
            setLogs(prevLogs => [...prevLogs, data]);
        });
        
        return () => {
            console.log('Cleaning up socket connection');
            socket.disconnect();
            socketRef.current = null;
        };
    };
    
    useEffect(() => {
        connectSocket();
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);
    
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);
    
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
            <Typography variant="h6" gutterBottom color="white">
                Bot Logs
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
                        {log.message}
                    </Box>
                ))}
                <div ref={logsEndRef} />
            </Box>
        </Paper>
    );
};

export default BotLogs; 