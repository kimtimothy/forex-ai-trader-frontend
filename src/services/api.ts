import axios from 'axios';
import { getApiUrl } from '../utils/api';

const API_BASE_URL = getApiUrl();

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', {
            message: error.message,
            endpoint: error.config?.url,
            status: error.response?.status
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
            params: { pair, timeframe }
        });
        return response.data;
    },

    getBotStatus: async () => {
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
            const response = await api.post('/api/bot/start');
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

    modifyTrade: async (tradeId: string, modifications: { takeProfitPrice?: number, stopLossPrice?: number }) => {
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
    }
}; 