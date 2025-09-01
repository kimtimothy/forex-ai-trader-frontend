// Backend API URL - Use local development URL
export const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

// WebSocket configuration
export const WS_CONFIG = {
  transports: ['websocket', 'polling'], // Allow both transports for better compatibility
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000,
  autoConnect: true,
  path: '/socket.io',
  forceNew: true,
  secure: false, // Set to false for local development
  rejectUnauthorized: false,
  multiplex: false,
  upgrade: true, // Allow transport upgrades
  rememberUpgrade: false,
  perMessageDeflate: {
    threshold: 1024
  },
  withCredentials: true,

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