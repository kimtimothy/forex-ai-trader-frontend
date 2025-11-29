import React, { useState, useEffect } from 'react';
import { tradingApi } from '../services/api';
import BotLogs from './BotLogs';
import { BotStatus } from '../types/types';

const BotControl: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initializationStatus, setInitializationStatus] = useState<string | null>(null);

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
            // Refresh status to get the new bot_enabled_since timestamp
            await fetchBotStatus();
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
            // Refresh status to ensure uptime is reset
            await fetchBotStatus();
        } catch (err) {
            console.error('Error stopping bot:', err);
            setError('Failed to stop trading bot');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBotStatus();
        const interval = setInterval(fetchBotStatus, 30000); // Reduced from 10s to 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <div className="modern-card">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '24px' 
                }}>
                    <h2 style={{ 
                        margin: 0, 
                        fontSize: '24px', 
                        fontWeight: '600',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        🤖 Trading Bot Control
                    </h2>
                    <span className={`modern-badge ${isRunning ? 'badge-success' : 'badge-danger'}`}>
                        {isRunning ? '🟢 Running' : '🔴 Stopped'}
                    </span>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        color: '#fca5a5',
                        fontSize: '14px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
                
                {initializationStatus && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        color: '#93c5fd',
                        fontSize: '14px'
                    }}>
                        ℹ️ <strong>Initialization:</strong> {initializationStatus}
                    </div>
                )}

                <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        className="modern-button"
                        onClick={handleStartBot}
                        disabled={isRunning || loading}
                        style={{
                            backgroundColor: isRunning || loading ? 'rgba(255, 255, 255, 0.1)' : undefined,
                            cursor: isRunning || loading ? 'not-allowed' : 'pointer',
                            opacity: isRunning || loading ? 0.6 : 1
                        }}
                        aria-label="Start the trading bot"
                        title="Start the trading bot"
                    >
                        ▶️ Start Bot
                    </button>
                    <button
                        className="modern-button"
                        onClick={handleStopBot}
                        disabled={!isRunning || loading}
                        style={{
                            backgroundColor: !isRunning || loading ? 'rgba(255, 255, 255, 0.1)' : undefined,
                            cursor: !isRunning || loading ? 'not-allowed' : 'pointer',
                            opacity: !isRunning || loading ? 0.6 : 1
                        }}
                        aria-label="Stop the trading bot"
                        title="Stop the trading bot"
                    >
                        ⏹️ Stop Bot
                    </button>
                </div>

                {loading && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        marginTop: '16px' 
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '2px solid rgba(99, 102, 241, 0.3)',
                            borderTop: '2px solid #6366f1',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>
                )}
            </div>
            <BotLogs />
        </>
    );
};

export default BotControl; 