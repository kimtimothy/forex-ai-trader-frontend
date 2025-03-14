import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';  // Changed from localhost to 127.0.0.1

const handleApiError = (error: any, endpoint: string) => {
    console.error(`Error in ${endpoint}:`, error);
    throw error;
};

export const tradingApi = {
    getPositions: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/positions`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getPositions');
        }
    },
    
    getTrades: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/trades`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getTrades');
        }
    },
    
    getStats: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/stats`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getStats');
        }
    },
    
    getPerformance: async (pair: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/performance/${pair}`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getPerformance');
        }
    },

    getPairTrades: async (pair: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/trades/${pair}`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getPairTrades');
        }
    },

    getChartData: async (pair: string, timeframe: string) => {
        const response = await axios.get(`${API_BASE_URL}/chart-data`, {
            params: { pair, timeframe }
        });
        return response.data;
    },

    getBotStatus: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/bot/status`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'getBotStatus');
        }
    },

    startBot: async () => {
        try {
            console.log('API: Starting bot...');
            const response = await axios.post(`${API_BASE_URL}/bot/start`);
            console.log('API: Bot start response:', response.data);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'startBot');
        }
    },

    stopBot: async () => {
        try {
            console.log('API: Stopping bot...');
            const response = await axios.post(`${API_BASE_URL}/bot/stop`);
            console.log('API: Bot stop response:', response.data);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'stopBot');
        }
    },

    modifyTrade: async (tradeId: string, modifications: { takeProfitPrice?: number, stopLossPrice?: number }) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/trades/${tradeId}`, modifications);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'modifyTrade');
        }
    },

    closeTrade: async (tradeId: string) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/trades/${tradeId}`);
            return response.data;
        } catch (error) {
            return handleApiError(error, 'closeTrade');
        }
    }
}; 