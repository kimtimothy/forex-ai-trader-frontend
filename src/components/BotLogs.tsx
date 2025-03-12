import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Box, Alert } from '@mui/material';
import { io } from 'socket.io-client';

interface LogMessage {
    message: string;
    level: string;
    timestamp?: string;
}

const BotLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const logsEndRef = useRef<null | HTMLDivElement>(null);
    
    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 60000,
            forceNew: true
        });
        
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setError(null);
            setLogs(prev => [...prev, { message: 'Connected to bot server', level: 'INFO' }]);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError(`Connection error: ${err.message}`);
            
            // If WebSocket fails, try polling
            if (socket.io?.opts?.transports?.[0] === 'websocket') {
                console.log('Falling back to polling transport');
                socket.io.opts.transports = ['polling', 'websocket'];
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setError(`Disconnected: ${reason}`);
        });

        socket.on('bot_log', (data: LogMessage) => {
            console.log('Received bot log:', data);
            setLogs(prevLogs => [...prevLogs, data]);
        });
        
        return () => {
            console.log('Cleaning up socket connection');
            socket.disconnect();
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