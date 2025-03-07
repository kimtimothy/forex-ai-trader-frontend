import React, { useEffect, useState } from 'react';
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Box,
    CircularProgress,
    Alert,
    Chip,
    useTheme,
    TableContainer,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tabs,
    Tab,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { tradingApi } from '../services/api';

interface Trade {
    id: string;
    pair: string;
    type: string;
    entryPrice: number;
    currentPrice: number;
    units: number;
    unrealizedPL: number;
    openTime: string;
    takeProfitPrice: number;
    stopLossPrice: number;
}

interface Position {
    pair: string;
    units: number;
    averagePrice: number;
    unrealizedPL: number;
    currentPrice: number;
    trades: Trade[];
}

interface ModifyTradeForm {
    takeProfitPrice: number;
    stopLossPrice: number;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ActivePositions: React.FC = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [modifyForm, setModifyForm] = useState<ModifyTradeForm>({
        takeProfitPrice: 0,
        stopLossPrice: 0
    });
    const theme = useTheme();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const fetchTrades = async () => {
        try {
            const data = await tradingApi.getPositions();
            const formattedTrades = data.map((trade: any) => ({
                id: trade.id || `trade-${Date.now()}`,
                pair: trade.pair,
                type: trade.type || trade.direction,
                entryPrice: Number(trade.entryPrice),
                currentPrice: Number(trade.currentPrice),
                units: Number(trade.units),
                unrealizedPL: Number(trade.unrealizedPL),
                openTime: trade.openTime,
                takeProfitPrice: Number(trade.takeProfitPrice),
                stopLossPrice: Number(trade.stopLossPrice)
            }));
            setTrades(formattedTrades);

            // Calculate positions
            const groupedTrades = formattedTrades.reduce((acc: { [key: string]: Position }, trade: Trade) => {
                const pair = trade.pair;
                if (!acc[pair]) {
                    acc[pair] = {
                        pair,
                        units: 0,
                        averagePrice: 0,
                        unrealizedPL: 0,
                        currentPrice: trade.currentPrice,
                        trades: []
                    };
                }
                acc[pair].trades.push(trade);
                acc[pair].units += trade.units * (trade.type === 'LONG' ? 1 : -1);
                acc[pair].unrealizedPL += trade.unrealizedPL;
                acc[pair].currentPrice = trade.currentPrice;
                
                // Calculate weighted average price
                const totalUnits = acc[pair].trades.reduce((sum, t) => sum + Math.abs(t.units), 0);
                acc[pair].averagePrice = acc[pair].trades.reduce((sum, t) => 
                    sum + (t.entryPrice * Math.abs(t.units)), 0) / totalUnits;
                
                return acc;
            }, {});

            setPositions(Object.values(groupedTrades));
            setError(null);
        } catch (err) {
            console.error('Error fetching trades:', err);
            setError('Failed to fetch active trades');
        } finally {
            setLoading(false);
        }
    };

    const handleModifyTrade = (trade: Trade) => {
        setSelectedTrade(trade);
        setModifyForm({
            takeProfitPrice: trade.takeProfitPrice,
            stopLossPrice: trade.stopLossPrice
        });
        setModifyDialogOpen(true);
    };

    const handleCloseTrade = async (tradeId: string) => {
        try {
            await tradingApi.closeTrade(tradeId);
            fetchTrades();
        } catch (err) {
            console.error('Error closing trade:', err);
            setError('Failed to close trade');
        }
    };

    const handleModifySubmit = async () => {
        if (!selectedTrade) return;
        
        try {
            await tradingApi.modifyTrade(selectedTrade.id, {
                takeProfitPrice: modifyForm.takeProfitPrice,
                stopLossPrice: modifyForm.stopLossPrice
            });
            setModifyDialogOpen(false);
            fetchTrades();
        } catch (err) {
            console.error('Error modifying trade:', err);
            setError('Failed to modify trade');
        }
    };

    useEffect(() => {
        fetchTrades();
        const interval = setInterval(fetchTrades, 5000);
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
                Active Trades
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Positions" />
                <Tab label="Individual Trades" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Pair</TableCell>
                                <TableCell>Net Units</TableCell>
                                <TableCell>Avg. Entry</TableCell>
                                <TableCell>Current</TableCell>
                                <TableCell>P/L</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {positions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No active positions
                                    </TableCell>
                                </TableRow>
                            ) : (
                                positions.map((position) => (
                                    <TableRow 
                                        key={position.pair}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: theme.palette.action.hover
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body1" fontWeight="500">
                                                {position.pair.replace('_', '/')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{position.units.toLocaleString()}</TableCell>
                                        <TableCell>{position.averagePrice.toFixed(5)}</TableCell>
                                        <TableCell>{position.currentPrice.toFixed(5)}</TableCell>
                                        <TableCell
                                            sx={{
                                                color: position.unrealizedPL >= 0 
                                                    ? theme.palette.success.main 
                                                    : theme.palette.error.main,
                                                fontWeight: '500'
                                            }}
                                        >
                                            {position.unrealizedPL.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Time</TableCell>
                                <TableCell>Pair</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Entry</TableCell>
                                <TableCell>Current</TableCell>
                                <TableCell>TP</TableCell>
                                <TableCell>SL</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell>P/L</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trades.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center">
                                        No active trades
                                    </TableCell>
                                </TableRow>
                            ) : (
                                trades.map((trade, index) => (
                                    <TableRow 
                                        key={`${trade.id}-${index}-${trade.openTime}`}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: theme.palette.action.hover
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            {new Date(trade.openTime).toLocaleString()}
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
                                                <Chip
                                                    label={trade.type}
                                                    size="small"
                                                    color={trade.type === 'LONG' ? "success" : "error"}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>{trade.entryPrice.toFixed(5)}</TableCell>
                                        <TableCell>{trade.currentPrice.toFixed(5)}</TableCell>
                                        <TableCell>
                                            {trade.takeProfitPrice ? (
                                                <Typography color="success.main">
                                                    {trade.takeProfitPrice.toFixed(5)}
                                                </Typography>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {trade.stopLossPrice ? (
                                                <Typography color="error.main">
                                                    {trade.stopLossPrice.toFixed(5)}
                                                </Typography>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>{trade.units.toLocaleString()}</TableCell>
                                        <TableCell
                                            sx={{
                                                color: trade.unrealizedPL >= 0 
                                                    ? theme.palette.success.main 
                                                    : theme.palette.error.main,
                                                fontWeight: '500'
                                            }}
                                        >
                                            {trade.unrealizedPL.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                <Tooltip title="Modify Trade">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleModifyTrade(trade)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Close Trade">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleCloseTrade(trade.id)}
                                                        color="error"
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <Dialog open={modifyDialogOpen} onClose={() => setModifyDialogOpen(false)}>
                <DialogTitle>Modify Trade</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Take Profit"
                            type="number"
                            value={modifyForm.takeProfitPrice}
                            onChange={(e) => setModifyForm({
                                ...modifyForm,
                                takeProfitPrice: Number(e.target.value)
                            })}
                        />
                        <TextField
                            label="Stop Loss"
                            type="number"
                            value={modifyForm.stopLossPrice}
                            onChange={(e) => setModifyForm({
                                ...modifyForm,
                                stopLossPrice: Number(e.target.value)
                            })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModifyDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleModifySubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ActivePositions;