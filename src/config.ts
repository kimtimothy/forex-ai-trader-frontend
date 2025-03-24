// Backend API URL
export const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://forex-ai-trader-backend-0b07293d3688.herokuapp.com';

// WebSocket configuration
export const WS_CONFIG = {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000,
  autoConnect: true,
  path: '/socket.io',
  forceNew: true,
  secure: true,
  rejectUnauthorized: false,
  multiplex: false,
  upgrade: false,
  rememberUpgrade: false,
  perMessageDeflate: {
    threshold: 1024
  },
  withCredentials: true,
  extraHeaders: {
    'Access-Control-Allow-Origin': '*'
  }
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