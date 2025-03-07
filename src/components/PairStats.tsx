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

interface PairStatistics {
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    averageProfit: number;
}

interface Stats {
    [pair: string]: PairStatistics;
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
            const data = await tradingApi.getStats();
            console.log('PairStats: Received data:', data);
            if (data && typeof data === 'object') {
                setStats(data);
                setError(null);
            } else {
                console.error('PairStats: Invalid data format:', data);
                setError('Received invalid data format');
            }
        } catch (err) {
            console.error('PairStats: Error details:', err);
            setError('Failed to fetch pair statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="500" sx={{ mb: 3 }}>
                Pair Statistics
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
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
                                        value={`${(pairStats.winRate * 100).toFixed(1)}%`}
                                        color={theme.palette.success.main}
                                    />
                                    
                                    <StatItem 
                                        icon={<ShowChartIcon />}
                                        label="Profit Factor"
                                        value={pairStats.profitFactor.toFixed(2)}
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