/**
 * Get the base API URL based on the environment
 */
export const getApiUrl = (): string => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        return 'http://localhost:5001';
    }
    // Use HTTPS for production
    return process.env.REACT_APP_API_URL || 'https://forex-ai-trader-backend-0b07293d3688.herokuapp.com';
};

/**
 * Get the full API URL for a specific endpoint
 */
export const getApiEndpoint = (endpoint: string): string => {
    const baseUrl = getApiUrl().replace(/\/$/, ''); // Remove trailing slash if present
    const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash if present
    return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Get the WebSocket URL for Socket.IO
 */
export const getWebSocketUrl = (): string => {
    return getApiUrl();
};

const API_URL = process.env.REACT_APP_API_URL;

async function fetchJSON(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

export const getPositions = () => fetchJSON('/api/positions');
export const getTrades = () => fetchJSON('/api/trades');
export const getStats = () => fetchJSON('/api/stats');
export const getBotStatus = () => fetchJSON('/api/bot/status');