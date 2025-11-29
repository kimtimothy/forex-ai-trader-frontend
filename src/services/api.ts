import axios from 'axios';
import { getApiUrl } from '../utils/api';
import { BotStatus } from '../types/types';
// import { queuedRequest } from '../utils/requestQueue';

const API_BASE_URL = getApiUrl();

// Configure axios defaults
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for bot operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      endpoint: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 503) {
      console.error('Backend service is unavailable. Retrying...');
      // Optional: Implement retry logic here
    }

    return Promise.reject(error);
  }
);

const handleApiError = (error: any, endpoint: string) => {
  console.error(`Error in ${endpoint}:`, error);
  throw error;
};

export const tradingApi = {
  getPositions: async () => {
    try {
      const response = await api.get('/api/positions');
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  },

  getTrades: async () => {
    try {
      const response = await api.get('/api/trades');
      console.log('getTrades response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getTrades:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/api/stats');
      console.log('getStats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  },

  // Config (bot thresholds/settings)
  getConfig: async () => {
    try {
      const response = await api.get('/api/config');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getConfig');
    }
  },

  updateConfig: async (config: {
    risk_per_trade?: number;
    max_positions?: number;
    min_confluence_score?: number; // 0-100
    min_model_confidence?: number; // 0-1
    max_spread_pips?: number; // Maximum spread in pips
  }) => {
    try {
      const response = await api.put('/api/config', config);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'updateConfig');
    }
  },

  getPerformance: async (pair: string) => {
    try {
      const response = await api.get(`/api/performance/${pair}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getPerformance');
    }
  },

  getPairTrades: async (pair: string) => {
    try {
      const response = await api.get(`/api/trades/${pair}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getPairTrades');
    }
  },

  getChartData: async (pair: string, timeframe: string) => {
    const response = await api.get('/api/chart-data', {
      params: { pair, timeframe },
    });
    return response.data;
  },

  getBotStatus: async (): Promise<BotStatus> => {
    try {
      const response = await api.get('/api/bot/status');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getBotStatus');
    }
  },

  startBot: async () => {
    try {
      console.log('API: Starting bot...');
      const response = await api.post('/api/bot/start', {}, { timeout: 60000 }); // 60 second timeout for bot start
      console.log('API: Bot start response:', response.data);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'startBot');
    }
  },

  stopBot: async () => {
    try {
      console.log('API: Stopping bot...');
      const response = await api.post('/api/bot/stop');
      console.log('API: Bot stop response:', response.data);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'stopBot');
    }
  },

  modifyTrade: async (
    tradeId: string,
    modifications: { takeProfitPrice?: number; stopLossPrice?: number }
  ) => {
    try {
      const response = await api.put(`/api/trades/${tradeId}`, modifications);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'modifyTrade');
    }
  },

  closeTrade: async (tradeId: string) => {
    try {
      const response = await api.delete(`/api/trades/${tradeId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'closeTrade');
    }
  },

  // ML Insights API methods
  getMLInsights: async (pair: string) => {
    try {
      const response = await api.get(`/api/ml_insights/${pair}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ML insights:', error);
      return { insights: [] };
    }
  },

  getLearningProgress: async (pair: string) => {
    try {
      const response = await api.get(`/api/learning_progress/${pair}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching learning progress:', error);
      return null;
    }
  },

  getFeatureImportance: async (pair: string) => {
    try {
      const response = await api.get(`/api/feature_importance/${pair}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feature importance:', error);
      return { features: [] };
    }
  },

  getModelPerformance: async (pair: string) => {
    try {
      const response = await api.get(`/api/model_performance/${pair}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching model performance:', error);
      return { models: [] };
    }
  },

  getMLDashboardData: async (pair: string) => {
    try {
      const response = await api.get(`/api/ml_dashboard/${pair}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ML dashboard data:', error);
      return {
        success: false,
        data: {
          ml_insights: [],
          model_performance: [],
          feature_importance: [],
          learning_summary: {},
          recent_predictions: [],
          current_insights: {},
          total_trades: 0,
          current_confidence: 0.0,
          model_status: 'Error',
          last_confidence: 0.0,
          is_trained: false,
          pair: pair,
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
};
