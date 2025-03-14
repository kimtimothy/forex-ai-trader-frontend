const API_BASE_URL = process.env.REACT_APP_API_URL;

async function fetchJSON(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

export const getPositions = () => fetchJSON('/api/positions');
export const getTrades = () => fetchJSON('/api/trades');
export const getStats = () => fetchJSON('/api/stats');
export const getBotStatus = () => fetchJSON('/api/bot/status');