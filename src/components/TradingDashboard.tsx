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
import { Paper, Grid, Typography, Box } from '@mui/material';

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

interface Performance {
  total_trades: number;
  win_rate: number;
  total_profit: number;
  profit_factor: number;
  model_performance: {
    [key: string]: {
      accuracy: number;
      correct: number;
      total: number;
    };
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

const TradingDashboard: React.FC = () => {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfResponse, tradesResponse] = await Promise.all([
          fetch('/api/performance/BTC/USD'),
          fetch('/api/trades/BTC/USD')
        ]);

        const perfData = await perfResponse.json();
        const tradesData = await tradesResponse.json();

        setPerformance(perfData);
        setTrades(tradesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
      data: Object.values(performance.model_performance).map(m => m.accuracy * 100),
      backgroundColor: '#2196F3',
      borderColor: '#1976D2',
      borderWidth: 1
    }]
  } : null;

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
            {modelChartData && (
              <Box sx={{ height: 300 }}>
                <Bar data={modelChartData} options={chartOptions} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingDashboard; 