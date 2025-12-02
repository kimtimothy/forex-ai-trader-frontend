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
    bot_enabled_since?: string;
    initializationStatus?: string;
}

// ==================== PHASE 2: TRADE MANAGEMENT ====================

export interface PartialProfit {
    r_multiple: number;
    profit: number;
    timestamp: string;
    percentage: number;
}

export interface ScaleIn {
    r_multiple: number;
    size: number;
    price: number;
    timestamp: string;
}

export interface TradeManagementDetails {
    trade_id: string;
    partial_profits_taken: PartialProfit[];
    scale_ins: ScaleIn[];
    trailing_stop_updates: number;
    current_r_multiple: number;
    breakeven_moved?: boolean;
}

export interface TradeAction {
    type: 'partial_profit' | 'trailing_stop' | 'scale_in' | 'breakeven' | 'model_promotion';
    trade_id?: string;
    pair?: string;
    message: string;
    timestamp: string;
    data?: any;
}

// Enhanced Position with Phase 2 data
export interface EnhancedPosition extends Position {
    partial_profits_taken?: {
        count: number;
        total_profit: number;
        levels: PartialProfit[];
    };
    trailing_stop_active?: boolean;
    trailing_stop_updates?: number;
    scale_ins?: ScaleIn[];
    current_r_multiple?: number;
}

// ==================== PHASE 3: ANALYTICS ====================

export interface ConfluencePerformance {
    [bracket: string]: {
        win_rate: number;
        trades: number;
        avg_profit: number;
        avg_r_multiple: number;
    };
}

export interface PairRecommendation {
    action: 'ENABLE' | 'DISABLE' | 'INCREASE' | 'MONITOR';
    win_rate: number;
    total_trades: number;
    reason: string;
    avg_profit: number;
}

export interface SessionPerformance {
    [pair: string]: {
        [session: string]: {
            win_rate: number;
            trades: number;
            avg_profit: number;
        };
    };
}

export interface RegimePerformance {
    [regime: string]: {
        win_rate: number;
        trades: number;
        avg_profit: number;
        avg_r_multiple: number;
    };
}

export interface RegimeSettings {
    stop_multiplier: number;
    target_multiplier: number;
    size_multiplier: number;
    min_confluence: number;
}

export interface ComprehensiveAnalytics {
    confluence_performance: ConfluencePerformance;
    optimal_confluence_threshold: number;
    threshold_reason: string;
    pair_recommendations: { [pair: string]: PairRecommendation };
    session_performance: SessionPerformance;
    optimal_sessions?: { [pair: string]: string[] };
    regime_performance: { [regime: string]: RegimeSettings };
    last_updated: string;
}

// ==================== PHASE 4: ML ENHANCEMENTS ====================

export interface Phase4MLStatus {
    phase4_enabled: boolean;
    advanced_features_count: number;
    regime_ensemble_active: boolean;
    confidence_calibration_active: boolean;
    online_learning_active: boolean;
}

export interface RegimeWeights {
    [regime: string]: {
        [model: string]: number;
    };
}

export interface RegimeEnsembleData {
    pair: string;
    current_regime: string;
    regime_weights: RegimeWeights;
    regime_performance: {
        [regime: string]: {
            accuracy: number;
            trades: number;
        };
    };
}

export interface CalibrationBin {
    bin: string;
    avg_confidence: number;
    actual_accuracy: number;
    error: number;
    count: number;
}

export interface CalibrationMetrics {
    [model: string]: {
        [regime: string]: {
            calibration_error: number;
            total_predictions: number;
            bins?: CalibrationBin[];
        };
    };
}

export interface ABTestResults {
    old_accuracy: number;
    new_accuracy: number;
    improvement: number;
    decision: 'PROMOTE' | 'ROLLBACK' | 'NEUTRAL';
    trades_tested?: number;
}

export interface OnlineLearningStatus {
    pair: string;
    total_retrains: number;
    last_retrain: string;
    ab_test_active: boolean;
    ab_test_results?: ABTestResults;
    model_versions: string[];
    promotions: number;
    rollbacks: number;
} 