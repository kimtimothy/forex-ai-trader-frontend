// Backend API URL - Use local development URL
export const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// WebSocket configuration
export const WS_CONFIG = {
  transports: ['websocket', 'polling'], // Allow both transports for better compatibility
  reconnection: true,
  reconnectionAttempts: 5, // Increased from 3 to 5
  reconnectionDelay: 2000, // Increased from 1000 to 2000
  reconnectionDelayMax: 10000, // Increased from 5000 to 10000
  timeout: 60000, // 60 seconds
  autoConnect: true,
  path: '/socket.io',
  forceNew: true,
  secure: true, // Set to true for production (HTTPS)
  rejectUnauthorized: false,
  multiplex: false,
  upgrade: true, // Allow transport upgrades
  rememberUpgrade: false,
  perMessageDeflate: {
    threshold: 1024
  },
  withCredentials: true,
  pingTimeout: 60000, // Match backend ping timeout
  pingInterval: 25000, // Match backend ping interval
};

// API endpoints
export const API_ENDPOINTS = {
  bot: {
    status: '/api/bot/status',
    start: '/api/bot/start',
    stop: '/api/bot/stop'
  },
  trades: '/api/trades',
  positions: '/api/positions',
  config: '/api/config',
  stats: '/api/stats'
}; 