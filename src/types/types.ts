export interface Position {
    pair: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    units: number;
    unrealizedPL: number;
    openTime: string;
}

export interface Trade {
    id: string;
    pair: string;
    type: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice?: number;
    profit?: number;
    status: 'OPEN' | 'CLOSED';
    timestamp: string;
    confidence: number;
}

export interface PairStats {
    pair: string;
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    averageProfit: number;
}

export interface BotStatus {
    running: boolean;
    status: string;
    lastTradeTime?: string;
    lastError?: string;
    uptime: string;
    initializationStatus?: string;
} 