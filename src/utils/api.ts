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
 * Get the WebSocket URL for Socket.IO
 */
export const getWebSocketUrl = (): string => {
    return getApiUrl();
};