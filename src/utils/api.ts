/**
 * Get the base API URL based on the environment
 */
export const getApiUrl = (): string => {
    console.log('getApiUrl called - NODE_ENV:', process.env.NODE_ENV);
    console.log('getApiUrl called - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('getApiUrl called - window.location.hostname:', window.location.hostname);
    
    // In development, use localhost backend (separate server)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('getApiUrl returning development URL: http://localhost:5002');
        return 'http://localhost:5002';
    }
    
    // In production, use environment variable or fallback
    const url = process.env.REACT_APP_API_URL || 'https://forex-ai-trader-backend-0b07293d3688.herokuapp.com';
    console.log('getApiUrl returning production URL:', url);
    return url;
};

/**
 * Get the WebSocket URL for Socket.IO
 */
export const getWebSocketUrl = (): string => {
    const apiUrl = getApiUrl();
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    console.log('getWebSocketUrl called - apiUrl:', apiUrl, 'wsUrl:', wsUrl);
    // Ensure WebSocket URL uses the correct protocol
    return wsUrl;
};