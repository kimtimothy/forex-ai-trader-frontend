import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Typography, Box, Alert } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/api';

interface LogMessage {
    message: string;
    level: string;
    timestamp?: string;
    data?: {
        pair?: string;
        current_price?: number;
        indicators?: any;
        analysis?: {
            trend?: {
                direction: string;
                strength: number;
                support_levels: number[];
                resistance_levels: number[];
            };
            momentum?: {
                rsi: number;
                macd: any;
                stochastic: any;
            };
            volatility?: {
                atr: number;
                bollinger_bands: any;
                volatility_level: string;
            };
        };
        market_conditions?: {
            spread: number;
            liquidity: string;
            volatility_level: string;
        };
        risk_metrics?: {
            position_size: number;
            stop_loss: number;
            take_profit: number;
        };
    };
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

        const backendUrl = 'https://forex-ai-trader-backend-0b07293d3688.herokuapp.com';
        console.log(`Attempting to connect to socket at ${backendUrl}...`);
        setConnectionAttempts(prev => prev + 1);

        const socket = io(backendUrl, {
            transports: ['polling', 'websocket'],  // Try polling first, then upgrade to WebSocket
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 60000,
            forceNew: true,
            path: '/socket.io',
            withCredentials: true,
            auth: {
                timestamp: Date.now()
            },
            extraHeaders: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            upgrade: true,  // Allow transport upgrade
            rememberUpgrade: true,  // Remember successful upgrades
            secure: true,
            rejectUnauthorized: false,
            autoConnect: true,
            multiplex: false
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            console.log('Transport:', socket.io.engine.transport.name);
            setError(null);
            setIsConnected(true);
            setConnectionAttempts(0);
            setLogs(prev => [...prev, { 
                message: `Connected to bot server (${connectionAttempts > 0 ? 'reconnected' : 'initial'}) via ${socket.io.engine.transport.name}`, 
                level: 'INFO',
                timestamp: new Date().toISOString()
            }]);
        });

        socket.on('connection_status', (data) => {
            console.log('Connection status:', data);
            if (data.status === 'connected') {
                setIsConnected(true);
                setError(null);
                setConnectionAttempts(0);
                if (data.transport) {
                    console.log('Connected via transport:', data.transport);
                }
            }
        });

        socket.on('connect_error', (err: any) => {
            console.error('Socket connection error:', err);
            console.error('Error details:', {
                message: err.message,
                description: err.description || 'No description',
                type: err.type || 'Unknown type',
                context: err.context || 'No context'
            });
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
            console.log('Transport:', socket.io.engine.transport.name);
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

        socket.on('transport_error', (error) => {
            console.error('Transport error:', error);
            setError(`Transport error: ${typeof error === 'string' ? error : error.message}`);
        });

        socket.on('upgrade', (transport) => {
            console.log('Transport upgraded to:', transport.name);
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
    }, [connectionAttempts]);
    
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
    
    const formatAnalysisData = (data: LogMessage['data']) => {
        if (!data) return '';

        let formattedMessage = '';
        
        // Format technical analysis
        if (data.analysis) {
            formattedMessage += '\nTechnical Analysis:\n';
            if (data.analysis.trend) {
                formattedMessage += `  Trend: ${data.analysis.trend.direction} (Strength: ${data.analysis.trend.strength})\n`;
                formattedMessage += `  Support Levels: ${data.analysis.trend.support_levels.join(', ')}\n`;
                formattedMessage += `  Resistance Levels: ${data.analysis.trend.resistance_levels.join(', ')}\n`;
            }
            if (data.analysis.momentum) {
                formattedMessage += `  RSI: ${data.analysis.momentum.rsi}\n`;
            }
            if (data.analysis.volatility) {
                formattedMessage += `  ATR: ${data.analysis.volatility.atr}\n`;
                formattedMessage += `  Volatility Level: ${data.analysis.volatility.volatility_level}\n`;
            }
        }

        // Format market conditions
        if (data.market_conditions) {
            formattedMessage += '\nMarket Conditions:\n';
            formattedMessage += `  Spread: ${data.market_conditions.spread}\n`;
            formattedMessage += `  Liquidity: ${data.market_conditions.liquidity}\n`;
            formattedMessage += `  Volatility: ${data.market_conditions.volatility_level}\n`;
        }

        // Format risk metrics
        if (data.risk_metrics) {
            formattedMessage += '\nRisk Assessment:\n';
            formattedMessage += `  Position Size: ${data.risk_metrics.position_size.toFixed(2)}\n`;
            formattedMessage += `  Stop Loss: ${data.risk_metrics.stop_loss.toFixed(5)}\n`;
            formattedMessage += `  Take Profit: ${data.risk_metrics.take_profit.toFixed(5)}\n`;
        }

        return formattedMessage;
    };

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
                Bot Analysis Logs
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
                            mb: 1,
                            borderBottom: '1px solid #333',
                            pb: 1
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            {log.timestamp && (
                                <span style={{ color: '#666', marginRight: '8px' }}>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                            )}
                            <span style={{ fontWeight: 'bold' }}>{log.message}</span>
                        </Box>
                        {log.data && (
                            <Box sx={{ ml: 2, color: '#98c379' }}>
                                {formatAnalysisData(log.data)}
                            </Box>
                        )}
                    </Box>
                ))}
                <div ref={logsEndRef} />
            </Box>
        </Paper>
    );
};

export default BotLogs; 