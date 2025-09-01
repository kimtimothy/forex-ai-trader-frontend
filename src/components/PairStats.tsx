import React, { useEffect, useState } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    useTheme,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { tradingApi } from '../services/api';
import { TrendingDown, Warning } from '@mui/icons-material';

interface TradeStats {
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    averageProfit: number;
    lastTradeTime: string | null;
    totalProfit: number;
    maxDrawdown: number;
}

interface Stats {
    [pair: string]: TradeStats;
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; color?: string }> = ({ 
    icon, 
    label, 
    value,
    color 
}) => (
    <Box display="flex" alignItems="center" mb={1.5}>
        <Box sx={{ mr: 1, color: color }}>{icon}</Box>
        <Box>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body1" fontWeight="500">
                {value}
            </Typography>
        </Box>
    </Box>
);

const PairStats: React.FC = () => {
    const [stats, setStats] = useState<Stats>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await tradingApi.getStats();
            setStats(data);
            setError(null);
        } catch (err) {
            console.error('PairStats: Error details:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Set up polling every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom fontWeight="500" sx={{ mb: 3 }}>
                    Pair Statistics
                </Typography>
                
                <Box display="flex" alignItems="center" color="error.main">
                    <Warning sx={{ mr: 1 }} />
                    <Typography>{error}</Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="500" sx={{ mb: 3 }}>
                Pair Statistics
            </Typography>
            
            <Grid container spacing={3}>
                {Object.entries(stats).map(([pair, pairStats]) => (
                    <Grid item xs={12} sm={6} md={4} key={pair}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                '&:hover': {
                                    boxShadow: theme.shadows[6],
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary" fontWeight="500">
                                    {pair.replace('_', '/')}
                                </Typography>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Box sx={{ mt: 2 }}>
                                    <StatItem 
                                        icon={<TrendingUpIcon />}
                                        label="Win Rate"
                                        value={`${pairStats.winRate.toFixed(2)}%`}
                                        color={pairStats.winRate >= 50 ? theme.palette.success.main : theme.palette.error.main}
                                    />
                                    
                                    <StatItem 
                                        icon={<ShowChartIcon />}
                                        label="Profit Factor"
                                        value={pairStats.profitFactor === Infinity ? '∞' : pairStats.profitFactor.toFixed(2)}
                                        color={theme.palette.info.main}
                                    />
                                    
                                    <StatItem 
                                        icon={<TimelineIcon />}
                                        label="Total Trades"
                                        value={pairStats.totalTrades.toString()}
                                        color={theme.palette.warning.main}
                                    />
                                    
                                    <StatItem 
                                        icon={<AttachMoneyIcon />}
                                        label="Average Profit"
                                        value={pairStats.averageProfit.toFixed(2)}
                                        color={pairStats.averageProfit >= 0 
                                            ? theme.palette.success.main 
                                            : theme.palette.error.main}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default PairStats; 