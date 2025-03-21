import axios from 'axios';

const API_BASE_URL = 'https://forex-ai-trader-backend-0b07293d3688.herokuapp.com';

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
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

export const api = {
    getPositions: async () => {
        try {
            const response = await axiosInstance.get('/api/positions');
            return response.data;
        } catch (error) {
            console.error('Error fetching positions:', error);
            throw error;
        }
    },
    
    getTrades: async () => {
        try {
            const response = await axiosInstance.get('/api/trades');
            console.log('getTrades response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in getTrades:', error);
            throw error;
        }
    },
    
    getStats: async () => {
        try {
            const response = await axiosInstance.get('/api/stats');
            console.log('getStats response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in getStats:', error);
            throw error;
        }
    },
    
    getPerformance: async (pair: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/performance/${pair}`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getPerformance');
        }
    },

    getPairTrades: async (pair: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/trades/${pair}`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getPairTrades');
        }
    },

    getChartData: async (pair: string, timeframe: string) => {
        const response = await axios.get(`${API_BASE_URL}/api/chart-data`, {
            params: { pair, timeframe }
        });
        return response.data;
    },

    getBotStatus: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/bot/status`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getBotStatus');
        }
    },

    startBot: async () => {
        try {
            console.log('API: Starting bot...');
            const response = await axios.post(`${API_BASE_URL}/api/bot/start`);
            console.log('API: Bot start response:', response.data);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'startBot');
        }
    },

    stopBot: async () => {
        try {
            console.log('API: Stopping bot...');
            const response = await axios.post(`${API_BASE_URL}/api/bot/stop`);
            console.log('API: Bot stop response:', response.data);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'stopBot');
        }
    },

    modifyTrade: async (tradeId: string, modifications: { takeProfitPrice?: number, stopLossPrice?: number }) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/api/trades/${tradeId}`, modifications);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'modifyTrade');
        }
    },

    closeTrade: async (tradeId: string) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/trades/${tradeId}`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'closeTrade');
        }
    }
}; 