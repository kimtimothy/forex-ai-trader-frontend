import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Paper,
    TableContainer,
    useTheme,
    Chip,
    TablePagination
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { tradingApi } from '../services/api';

interface Trade {
    id: string;
    pair: string;
    type: string;
    entryPrice: number;
    exitPrice: number;
    profit: number;
    status: string;
    timestamp: string;
    confidence: number;
}

const TradeHistory: React.FC = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const theme = useTheme();

    const fetchTrades = async () => {
        try {
            console.log('TradeHistory: Starting fetch...');
            const data = await tradingApi.getTrades();
            
            // Ensure all required fields are present and properly formatted
            const formattedTrades = data.map((trade: any, index: number) => ({
                id: trade.id || `trade-${index}-${Date.now()}`,
                pair: trade.pair || 'UNKNOWN',
                type: trade.type || 'UNKNOWN',
                entryPrice: Number(trade.entry_price || trade.entryPrice || 0),
                exitPrice: Number(trade.exit_price || trade.exitPrice || 0),
                profit: Number(trade.profit || 0),
                status: trade.status || 'UNKNOWN',
                timestamp: trade.timestamp || new Date().toISOString(),
                confidence: Number(trade.confidence || 0)
            }));

            setTrades(formattedTrades);
            setError(null);
        } catch (err) {
            console.error('TradeHistory: Error details:', err);
            setError('Failed to fetch trade history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrades();
        const interval = setInterval(fetchTrades, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

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
                Trade History
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Pair</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Entry</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Exit</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>P/L</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Confidence</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {trades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No trade history available
                                </TableCell>
                            </TableRow>
                        ) : (
                            trades
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((trade, index) => (
                                    <TableRow 
                                        key={`${trade.id}-${index}`}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: theme.palette.action.hover
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            {new Date(trade.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight="500">
                                                {trade.pair.replace('_', '/')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {trade.type === 'LONG' ? (
                                                    <TrendingUpIcon 
                                                        fontSize="small" 
                                                        sx={{ color: theme.palette.success.main }} 
                                                    />
                                                ) : (
                                                    <TrendingDownIcon 
                                                        fontSize="small" 
                                                        sx={{ color: theme.palette.error.main }} 
                                                    />
                                                )}
                                                {trade.type}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{trade.entryPrice.toFixed(5)}</TableCell>
                                        <TableCell>{trade.exitPrice.toFixed(5)}</TableCell>
                                        <TableCell
                                            sx={{
                                                color: trade.profit >= 0 
                                                    ? theme.palette.success.main 
                                                    : theme.palette.error.main,
                                                fontWeight: '500'
                                            }}
                                        >
                                            {trade.profit.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${(trade.confidence * 100).toFixed(1)}%`}
                                                size="small"
                                                color={trade.confidence >= 0.7 ? "success" : "warning"}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={trade.status}
                                                size="small"
                                                color={trade.status === 'CLOSED' ? "default" : "primary"}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={trades.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
};

export default TradeHistory;