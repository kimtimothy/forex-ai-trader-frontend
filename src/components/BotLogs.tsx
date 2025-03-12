import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { io } from 'socket.io-client';

interface LogMessage {
    message: string;
    level: string;
    timestamp?: string;
}

const BotLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const logsEndRef = useRef<null | HTMLDivElement>(null);
    
    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
        
        socket.on('bot_log', (data: LogMessage) => {
            setLogs(prevLogs => [...prevLogs, data]);
        });
        
        return () => {
            socket.disconnect();
        };
    }, []);
    
    // Auto scroll to bottom when new logs arrive
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
                backgroundColor: '#1e1e1e'  // Dark background for logs
            }}
        >
            <Typography variant="h6" gutterBottom>
                Bot Logs
            </Typography>
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