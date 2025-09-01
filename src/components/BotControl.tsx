import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Stack,
    useTheme
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { tradingApi } from '../services/api';
import BotLogs from './BotLogs';
import { BotStatus } from '../types/types';

const BotControl: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initializationStatus, setInitializationStatus] = useState<string | null>(null);
    const theme = useTheme();

    const fetchBotStatus = async () => {
        try {
            const status: BotStatus = await tradingApi.getBotStatus();
            setIsRunning(status.running);
            setInitializationStatus(status.initializationStatus || null);
            setError(null);
        } catch (err) {
            console.error('Error fetching bot status:', err);
            setError('Failed to fetch bot status');
        } finally {
            setLoading(false);
        }
    };

    const handleStartBot = async () => {
        try {
            setLoading(true);
            await tradingApi.startBot();
            setIsRunning(true);
            setError(null);
        } catch (err) {
            console.error('Error starting bot:', err);
            setError('Failed to start trading bot');
        } finally {
            setLoading(false);
        }
    };

    const handleStopBot = async () => {
        try {
            setLoading(true);
            await tradingApi.stopBot();
            setIsRunning(false);
            setError(null);
        } catch (err) {
            console.error('Error stopping bot:', err);
            setError('Failed to stop trading bot');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBotStatus();
        const interval = setInterval(fetchBotStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight="500">
                        Trading Bot Control
                    </Typography>
                    <Chip
                        label={isRunning ? 'Running' : 'Stopped'}
                        color={isRunning ? 'success' : 'error'}
                        variant="outlined"
                    />
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                {initializationStatus && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>Initialization:</strong> {initializationStatus}
                        </Typography>
                    </Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleStartBot}
                        disabled={isRunning || loading}
                    >
                        Start Bot
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={handleStopBot}
                        disabled={!isRunning || loading}
                    >
                        Stop Bot
                    </Button>
                </Stack>

                {loading && (
                    <Box display="flex" justifyContent="center" mt={2}>
                        <CircularProgress size={24} />
                    </Box>
                )}
            </Paper>
            <BotLogs />
        </>
    );
};

export default BotControl; 