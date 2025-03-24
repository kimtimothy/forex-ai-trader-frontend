/**
 * Get the base API URL based on the environment
 */
export const getApiUrl = (): string => {
    // In production, use the environment variable or fallback to production URL
    if (process.env.NODE_ENV === 'production') {
        return process.env.REACT_APP_API_URL || 'https://forex-ai-trader-backend-0b07293d3688.herokuapp.com';
    }
    // In development, use localhost
    return 'http://localhost:5001';
};

/**
 * Get the WebSocket URL for Socket.IO
 */
export const getWebSocketUrl = (): string => {
    const apiUrl = getApiUrl();
    // Ensure WebSocket URL uses the correct protocol
    return apiUrl.replace(/^http/, 'ws');
};