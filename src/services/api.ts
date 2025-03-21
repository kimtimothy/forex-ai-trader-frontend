import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://forex-ai-trader-backend-0b07293d3688.herokuapp.com';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Access-Control-Allow-Origin'] = 'https://forex-ai-trader-frontend-7951b3342477.herokuapp.com';

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
            const response = await axios.get(`${API_BASE_URL}/api/positions`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching positions:', error);
            throw error;
        }
    },
    
    getTrades: async () => {
        try {
            const response = await  axios.get(`${API_BASE_URL}/api/trades`);
            console.log('getTrades response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in getTrades:', error);
            throw error;
        }
    },
    
    getStats: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/stats`);
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