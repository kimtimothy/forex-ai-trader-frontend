import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Paper, Grid, Typography, Box, CircularProgress } from '@mui/material';
import { tradingApi } from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModelPerformance {
  accuracy: number;
  correct: number;
  total: number;
}

interface Performance {
  total_trades: number;
  win_rate: number;
  total_profit: number;
  profit_factor: number;
  model_performance: {
    random_forest?: ModelPerformance;
    xgboost?: ModelPerformance;
    lightgbm?: ModelPerformance;
    [key: string]: ModelPerformance | undefined;
  };
}

interface Trade {
  timestamp: string;
  profit_loss: number;
  model_predictions: {
    [key: string]: {
      prediction: number;
      confidence: number;
      was_correct: boolean;
    };
  };
}

const calculatePerformanceFromTrades = (trades: Trade[]) => {
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.profit_loss > 0).length;
  const totalProfit = trades.reduce((sum, t) => sum + t.profit_loss, 0);
  
  // Calculate model performance
  const modelPerformance: { [key: string]: ModelPerformance } = {
    random_forest: { accuracy: 0, correct: 0, total: 0 },
    xgboost: { accuracy: 0, correct: 0, total: 0 },
    lightgbm: { accuracy: 0, correct: 0, total: 0 }
  };
  
  trades.forEach(trade => {
    if (trade.model_predictions) {
      Object.entries(trade.model_predictions).forEach(([model, data]) => {
        if (!modelPerformance[model]) {
          modelPerformance[model] = { accuracy: 0, correct: 0, total: 0 };
        }
        modelPerformance[model].total += 1;
        if (data.was_correct) {
          modelPerformance[model].correct += 1;
        }
      });
    }
  });

  // Calculate accuracy for each model
  Object.keys(modelPerformance).forEach(model => {
    modelPerformance[model].accuracy = 
      modelPerformance[model].total > 0 
        ? modelPerformance[model].correct / modelPerformance[model].total 
        : 0;
  });
  
  return {
    total_trades: totalTrades,
    win_rate: totalTrades ? winningTrades / totalTrades : 0,
    total_profit: totalProfit,
    profit_factor: 1,
    model_performance: modelPerformance
  };
};

const TradingDashboard: React.FC = () => {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      console.log('TradingDashboard: Starting fetch...');
      const tradesData = await tradingApi.getTrades();
      
      const formattedTrades = tradesData.map((trade: any) => ({
        timestamp: trade.timestamp || new Date().toISOString(),
        profit_loss: Number(trade.profit || 0),
        model_predictions: trade.model_predictions || {
          'default_model': {
            prediction: 0,
            confidence: 0,
            was_correct: false
          }
        }
      }));

      console.log('Formatted trades:', formattedTrades); // Debug log
      const performance = calculatePerformanceFromTrades(formattedTrades);
      console.log('Calculated performance:', performance); // Debug log
      
      setPerformance(performance);
      setTrades(formattedTrades);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff'  // Light text for dark theme
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'  // Lighter grid lines
        },
        ticks: {
          color: '#fff'  // Light text
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      }
    }
  };

  const pnlChartData = {
    labels: trades.map(t => new Date(t.timestamp).toLocaleDateString()),
    datasets: [{
      label: 'Profit/Loss',
      data: trades.map(t => t.profit_loss),
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      tension: 0.1
    }]
  };

  const modelChartData = performance ? {
    labels: Object.keys(performance.model_performance),
    datasets: [{
      label: 'Model Accuracy (%)',
      data: Object.values(performance.model_performance).map(m => (m?.accuracy || 0) * 100),
      backgroundColor: '#2196F3',
      borderColor: '#1976D2',
      borderWidth: 1
    }]
  } : null;

  // Add debug logging
  console.log('Model Chart Data:', modelChartData);
  console.log('Performance model data:', performance?.model_performance);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Trading Performance
      </Typography>
      
      {/* Key Metrics */}
      {performance && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                Total Trades
              </Typography>
              <Typography variant="h4">
                {performance.total_trades}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                Win Rate
              </Typography>
              <Typography variant="h4">
                {(performance.win_rate * 100).toFixed(2)}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                Total Profit
              </Typography>
              <Typography variant="h4">
                ${performance.total_profit.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                Profit Factor
              </Typography>
              <Typography variant="h4">
                {performance.profit_factor.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Profit/Loss Over Time
            </Typography>
            {trades.length > 0 && (
              <Box sx={{ height: 300 }}>
                <Line data={pnlChartData} options={chartOptions} />
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Model Performance
            </Typography>
            {modelChartData && Object.keys(performance?.model_performance || {}).length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Bar data={modelChartData} options={chartOptions} />
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center">
                No model performance data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingDashboard; 