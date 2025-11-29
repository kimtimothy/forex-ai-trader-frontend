import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { tradingApi } from '../services/api';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/api';
import { WS_CONFIG } from '../config';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

interface MLInsight {
  timestamp: string;
  pair: string;
  prediction: string;
  confidence: number;
  trade_quality: number;
  market_regime: string;
  volatility: number;
  volume_ratio: number;
  rsi: number;
  macd: number;
  sma_cross: string;
  ensemble_agreement: number;
}

interface LearningProgress {
  total_trades: number;
  total_retrains: number;
  last_retrain: string | null;
  best_accuracy: number;
  current_win_rate: number;
  performance_improvement: number;
  retrain_frequency: number;
  next_retrain_in: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  category: string;
  description: string;
}

interface ModelPerformance {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  last_updated: string;
}

const MLInsightsDashboard: React.FC = () => {
  const [mlInsights, setMlInsights] = useState<MLInsight[]>([]);
  const [learningProgress, setLearningProgress] =
    useState<LearningProgress | null>(null);
  const [featureImportance, setFeatureImportance] = useState<
    FeatureImportance[]
  >([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [evMetrics, setEvMetrics] = useState<{
    p?: number;
    p_min?: number;
    R?: number;
    R_target?: number;
    threshold?: number;
  } | null>(null);
  const [mtfContext, setMtfContext] = useState<{
    ltf_direction?: string;
    mtf_direction?: string;
    htf_direction?: string;
    alignment_score?: number;
    style?: string;
  } | null>(null);
  const [driftScore, setDriftScore] = useState<number | null>(null);
  const [modelWeights, setModelWeights] = useState<Record<
    string,
    number
  > | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [lastPromotion, setLastPromotion] = useState<any>(null);
  const [lastRetrainAttempt, setLastRetrainAttempt] = useState<any>(null);
  const [sessionSnapshot, setSessionSnapshot] = useState<any>(null);
  const [selectedPair, setSelectedPair] = useState('EUR_USD');
  const [activeTab, setActiveTab] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const currencyPairs = [
    'EUR_USD',
    'GBP_USD',
    'USD_JPY',
    'USD_CHF',
    'AUD_USD',
    'USD_CAD',
    'EUR_JPY',
    'GBP_JPY',
    'EUR_GBP',
    'EUR_CHF',
    'GBP_CHF',
    'EUR_AUD',
    'EUR_CAD',
    'EUR_NZD',
    'NZD_JPY',
    'GBP_CAD',
    'GBP_NZD',
    'NZD_CAD',
    'CAD_JPY',
  ];

  const fetchMLData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await tradingApi.getMLDashboardData(selectedPair);

      if (response.success && response.data) {
        const data = response.data;

        // Set the data from the comprehensive response
        setMlInsights(data.ml_insights || []);
        setLearningProgress(
          data.learning_summary || {
            total_trades: data.total_trades || 0,
            total_retrains: 0,
            last_retrain: null,
            best_accuracy: 0.0,
            current_win_rate: 0.0,
            performance_improvement: 0.0,
            retrain_frequency: 10,
            next_retrain_in: 10,
          }
        );
        setFeatureImportance(data.feature_importance || []);
        setModelPerformance(data.model_performance || []);
        setEvMetrics(data.ev_metrics || null);
        setMtfContext(data.mtf_context || null);
        setDriftScore(
          typeof data.drift_score === 'number' ? data.drift_score : null
        );
        setModelWeights(data.model_weights || null);
        setLastUpdated(
          typeof data.timestamp === 'string' ? data.timestamp : null
        );
        setLastPromotion(data.last_model_promotion || null);
        setLastRetrainAttempt(data.last_retrain_attempt || null);
        setSessionSnapshot(data.session_snapshot || null);

        console.log('ML Dashboard data loaded successfully:', {
          insights: data.ml_insights?.length || 0,
          learning: data.learning_summary,
          features: data.feature_importance?.length || 0,
          models: data.model_performance?.length || 0,
          modelStatus: data.model_status,
          isTrained: data.is_trained,
        });
      } else {
        console.warn(
          'ML Dashboard API returned unsuccessful response:',
          response
        );
        // Set default values when API fails
        setMlInsights([]);
        setLearningProgress({
          total_trades: 0,
          total_retrains: 0,
          last_retrain: null,
          best_accuracy: 0.0,
          current_win_rate: 0.0,
          performance_improvement: 0.0,
          retrain_frequency: 10,
          next_retrain_in: 10,
        });
        setFeatureImportance([]);
        setModelPerformance([]);
        setEvMetrics(null);
        setMtfContext(null);
        setDriftScore(null);
        setModelWeights(null);
        setLastUpdated(null);
        setLastPromotion(null);
        setLastRetrainAttempt(null);
        setSessionSnapshot(null);
      }
    } catch (error) {
      console.error('Error fetching ML dashboard data:', error);
      // Set default values when API fails
      setMlInsights([]);
      setLearningProgress({
        total_trades: 0,
        total_retrains: 0,
        last_retrain: null,
        best_accuracy: 0.0,
        current_win_rate: 0.0,
        performance_improvement: 0.0,
        retrain_frequency: 10,
        next_retrain_in: 10,
      });
      setFeatureImportance([]);
      setModelPerformance([]);
      setEvMetrics(null);
      setMtfContext(null);
      setDriftScore(null);
      setModelWeights(null);
      setLastUpdated(null);
      setLastPromotion(null);
      setLastRetrainAttempt(null);
      setSessionSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPair]);

  useEffect(() => {
    fetchMLData();
    // Refresh every 30 seconds to reduce server load
    const interval = setInterval(fetchMLData, 30000);
    // Real-time updates via Socket.IO
    try {
      const socket = io(getWebSocketUrl(), {
        ...WS_CONFIG,
        transports: ['websocket'],
        upgrade: false,
        autoConnect: true,
        forceNew: true,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('subscribe_ml_dashboard', { pair: selectedPair });
      });

      socket.on('ml_dashboard_update', (payload: any) => {
        if (!payload || payload.pair !== selectedPair) return;
        const data = payload.data || {};
        setMlInsights(data.ml_insights || []);
        setLearningProgress(
          data.learning_summary || {
            total_trades: data.total_trades || 0,
            total_retrains: 0,
            last_retrain: null,
            best_accuracy: 0.0,
            current_win_rate: 0.0,
            performance_improvement: 0.0,
            retrain_frequency: 10,
            next_retrain_in: 10,
          }
        );
        setFeatureImportance(data.feature_importance || []);
        setModelPerformance(data.model_performance || []);
      });

      return () => {
        clearInterval(interval);
        if (socketRef.current) {
          socketRef.current.emit('unsubscribe_ml_dashboard', {
            pair: selectedPair,
          });
          socketRef.current.disconnect();
        }
      };
    } catch (e) {
      // If socket fails, fallback to polling only
      return () => clearInterval(interval);
    }
  }, [fetchMLData, selectedPair]);

  // Re-subscribe when selectedPair changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe_ml_dashboard', { pair: selectedPair });
    }
  }, [selectedPair]);

  // Chart data preparation
  const confidenceChartData = {
    labels: mlInsights
      .slice(-10)
      .map((insight) => new Date(insight.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Prediction Confidence',
        data: mlInsights.slice(-10).map((insight) => insight.confidence),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const marketRegimeData = {
    labels: [
      'TRENDING_STABLE',
      'TRENDING_VOLATILE',
      'RANGING_STABLE',
      'RANGING_VOLATILE',
    ],
    datasets: [
      {
        data: [30, 25, 25, 20],
        backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#f44336'],
      },
    ],
  };

  const qualityDistributionData = {
    labels: ['80-100', '60-79', '40-59', '20-39', '0-19'],
    datasets: [
      {
        label: 'Trade Quality Distribution',
        data: [25, 35, 25, 10, 5],
        backgroundColor: [
          '#4caf50',
          '#8bc34a',
          '#ffc107',
          '#ff9800',
          '#f44336',
        ],
      },
    ],
  };

  const featureImportanceData = {
    labels: featureImportance.slice(0, 10).map((f) => f.feature),
    datasets: [
      {
        label: 'Feature Importance',
        data: featureImportance.slice(0, 10).map((f) => f.importance),
        backgroundColor: '#1976d2',
      },
    ],
  };

  const modelPerformanceData = {
    labels: modelPerformance.map((m) => m.model),
    datasets: [
      {
        label: 'Accuracy',
        data: modelPerformance.map((m) => m.accuracy * 100),
        backgroundColor: '#4caf50',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div
          style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <p>Loading ML Insights...</p>
      </div>
    );
  }

  return (
    <div className="modern-card fade-in-up">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                margin: '0 0 12px 0',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              🧠 ML Insights Dashboard
            </h2>
            {driftScore !== null && driftScore >= 0.3 && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#fecaca',
                  borderRadius: '4px',
                  fontSize: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                ⚠️ High feature drift detected (PSI≈{driftScore.toFixed(2)}).
                Consider retraining.
              </div>
            )}
            {lastUpdated && (
              <div
                style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}
              >
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </div>
            )}
            <p
              style={{
                margin: '0',
                color: '#cbd5e1',
                fontSize: '16px',
                fontWeight: '400',
              }}
            >
              Real-time machine learning analysis and learning progress
            </p>
            {!isLoading && mlInsights.length === 0 && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  color: '#856404',
                  borderRadius: '4px',
                  fontSize: '12px',
                  border: '1px solid #ffeaa7',
                }}
              >
                ⚠️ No ML data available. Check if backend is running.
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="modern-input"
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                minWidth: '120px',
              }}
            >
              {currencyPairs.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>

            <button
              onClick={fetchMLData}
              className="modern-button"
              style={{
                padding: '12px 20px',
                fontSize: '14px',
              }}
            >
              🔄 Refresh
            </button>
       </div>

        </div>

        {/* Tab Navigation */}
        <div className="modern-tabs">
          {['Overview', 'Predictions', 'Learning', 'Features', 'Models'].map(
            (tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`modern-tab ${activeTab === index ? 'active' : ''}`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 0 && (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Overview</h3>

            {/* Key Metrics */}
            <div className="modern-grid">
              <div className="stats-card">
                <div className="stats-value" style={{ color: '#6366f1' }}>
                  {mlInsights.length}
                </div>
                <div className="stats-label">Total Predictions</div>
              </div>
              <div className="stats-card">
                <div className="stats-value" style={{ color: '#10b981' }}>
                  {learningProgress?.current_win_rate !== undefined &&
                  learningProgress.current_win_rate !== null
                    ? (learningProgress.current_win_rate * 100).toFixed(1) + '%'
                    : 'N/A'}
                </div>
                <div className="stats-label">Current Win Rate</div>
              </div>
              <div className="stats-card">
                <div className="stats-value" style={{ color: '#f59e0b' }}>
                  {learningProgress?.best_accuracy !== undefined &&
                  learningProgress.best_accuracy !== null
                    ? (learningProgress.best_accuracy * 100).toFixed(1) + '%'
                    : 'N/A'}
                </div>
                <div className="stats-label">Best Accuracy</div>
              </div>
              <div className="stats-card">
                <div className="stats-value" style={{ color: '#8b5cf6' }}>
                  {learningProgress?.total_retrains || 0}
                </div>
              <div className="stats-label">Total Retrains</div>
              </div>
            </div>

            {/* Charts */}
            <div className="modern-grid" style={{ marginTop: '32px' }}>
              <div className="modern-card">
                <h4
                  style={{
                    marginBottom: '16px',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: '600',
                  }}
                >
                  Recent Prediction Confidence
                </h4>
                <div style={{ height: '300px' }}>
                  <Line data={confidenceChartData} options={chartOptions} />
                </div>
              </div>
              <div className="modern-card">
                <h4
                  style={{
                    marginBottom: '16px',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: '600',
                  }}
                >
                  Market Regime Distribution
                </h4>
                <div style={{ height: '300px' }}>
                  <Pie data={marketRegimeData} options={chartOptions} />
                </div>
              </div>
              <div className="modern-card">
                <h4
                  style={{
                    marginBottom: '16px',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: '600',
                  }}
                >
                  Trade Quality Distribution
                </h4>
                <div style={{ height: '300px' }}>
                  <Bar data={qualityDistributionData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* EV/MTF/Drift Diagnostics */}
            {(evMetrics || mtfContext) && (
              <div className="modern-grid" style={{ marginTop: '20px' }}>
                {evMetrics && (
                  <div className="modern-card">
                    <h4
                      style={{
                        marginBottom: '12px',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: '600',
                      }}
                    >
                      EV Gate
                    </h4>
                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: '14px',
                        lineHeight: 1.8,
                      }}
                    >
                      <div>
                        p:{' '}
                        {evMetrics.p !== undefined
                          ? (evMetrics.p * 100).toFixed(2) + '%'
                          : 'N/A'}
                      </div>
                      <div>
                        p_min:{' '}
                        {evMetrics.p_min !== undefined
                          ? (evMetrics.p_min * 100).toFixed(2) + '%'
                          : 'N/A'}
                      </div>
                      <div>
                        R:{' '}
                        {evMetrics.R !== undefined
                          ? evMetrics.R.toFixed(2)
                          : 'N/A'}
                      </div>
                      <div>
                        R*:{' '}
                        {evMetrics.R_target !== undefined
                          ? evMetrics.R_target.toFixed(2)
                          : 'N/A'}
                      </div>
                      <div>
                        threshold:{' '}
                        {evMetrics.threshold !== undefined
                          ? (evMetrics.threshold * 100).toFixed(2) + '%'
                          : 'N/A'}
                      </div>
                      {typeof evMetrics.p === 'number' &&
                        typeof evMetrics.threshold === 'number' && (
                          <div style={{ marginTop: '6px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                color:
                                  evMetrics.p >= evMetrics.threshold
                                    ? '#10b981'
                                    : '#ef4444',
                                backgroundColor:
                                  evMetrics.p >= evMetrics.threshold
                                    ? 'rgba(16,185,129,0.15)'
                                    : 'rgba(239,68,68,0.15)',
                                border:
                                  evMetrics.p >= evMetrics.threshold
                                    ? '1px solid rgba(16,185,129,0.3)'
                                    : '1px solid rgba(239,68,68,0.3)',
                              }}
                            >
                              {evMetrics.p >= evMetrics.threshold
                                ? 'Pass'
                                : 'Rejected'}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                )}
                {mtfContext && (
                  <div className="modern-card">
                    <h4
                      style={{
                        marginBottom: '12px',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: '600',
                      }}
                    >
                      MTF Alignment
                    </h4>
                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: '14px',
                        lineHeight: 1.8,
                      }}
                    >
                      <div>LTF: {mtfContext.ltf_direction || 'N/A'}</div>
                      <div>MTF: {mtfContext.mtf_direction || 'N/A'}</div>
                      <div>HTF: {mtfContext.htf_direction || 'N/A'}</div>
                      <div>
                        Alignment:{' '}
                        {mtfContext.alignment_score !== undefined
                          ? mtfContext.alignment_score.toFixed(2)
                          : 'N/A'}
                      </div>
                      <div>Style: {mtfContext.style || 'N/A'}</div>
                    </div>
                  </div>
                )}
                {sessionSnapshot && (
                  <div className="modern-card">
                    <h4
                      style={{
                        marginBottom: '12px',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: '600',
                      }}
                    >
                      Session
                    </h4>
                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: '14px',
                        lineHeight: 1.8,
                      }}
                    >
                      <div>
                        Name: {sessionSnapshot.session?.session_name ?? 'N/A'}
                      </div>
                      <div>
                        London Open:{' '}
                        {String(
                          sessionSnapshot.session?.is_london_open ?? false
                        )}
                      </div>
                      <div>
                        NY Open:{' '}
                        {String(sessionSnapshot.session?.is_ny_open ?? false)}
                      </div>
                      <div>
                        Spread:{' '}
                        {sessionSnapshot.spread_pips !== undefined
                          ? `${sessionSnapshot.spread_pips.toFixed(2)} pips`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}
                {driftScore !== null && (
                  <div className="modern-card">
                    <h4
                      style={{
                        marginBottom: '12px',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: '600',
                      }}
                    >
                      Drift
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                      PSI≈{driftScore.toFixed(2)}{' '}
                      {driftScore >= 0.3
                        ? '⚠️ High'
                        : driftScore >= 0.2
                        ? 'ℹ️ Moderate'
                        : '✅ Low'}
                    </div>
                  </div>
                )}
                {modelWeights && (
                  <div className="modern-card">
                    <h4
                      style={{
                        marginBottom: '12px',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: '600',
                      }}
                    >
                      Model Weights
                    </h4>
                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: '14px',
                        lineHeight: 1.8,
                      }}
                    >
                      {Object.entries(modelWeights).map(([name, w]) => (
                        <div
                          key={name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div style={{ minWidth: '110px' }}>{name}</div>
                          <div
                            style={{
                              flex: 1,
                              height: '8px',
                              backgroundColor: 'rgba(99,102,241,0.2)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${(w * 100).toFixed(1)}%`,
                                height: '100%',
                                backgroundColor: '#6366f1',
                              }}
                            />
                          </div>
                          <div style={{ minWidth: '56px', textAlign: 'right' }}>
                            {(w * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lastPromotion && (
                  <div className="modern-card">
                    <h4
                      style={{
                        marginBottom: '12px',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: '600',
                      }}
                    >
                      Last Model Promotion
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                      <div>
                        Time:{' '}
                        {new Date(lastPromotion.timestamp).toLocaleString()}
                      </div>
                      <div>
                        Current LL:{' '}
                        {lastPromotion.current?.log_loss?.toFixed?.(3) ?? 'N/A'}{' '}
                        → Candidate LL:{' '}
                        {lastPromotion.candidate?.log_loss?.toFixed?.(3) ??
                          'N/A'}
                      </div>
                      <div>
                        Current Acc:{' '}
                        {lastPromotion.current?.accuracy?.toFixed?.(3) ?? 'N/A'}{' '}
                        → Candidate Acc:{' '}
                        {lastPromotion.candidate?.accuracy?.toFixed?.(3) ??
                          'N/A'}
                      </div>
                    </div>
                  </div>
                )}
                {!lastPromotion && lastRetrainAttempt && (
                  <div className="modern-card">
                    <h4
                      style={{
                        marginBottom: '12px',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: '600',
                      }}
                    >
                      Last Retrain Attempt
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                      <div>
                        Time:{' '}
                        {new Date(
                          lastRetrainAttempt.timestamp
                        ).toLocaleString()}
                      </div>
                      <div>
                        Current LL:{' '}
                        {lastRetrainAttempt.current?.log_loss?.toFixed?.(3) ??
                          'N/A'}{' '}
                        vs Candidate LL:{' '}
                        {lastRetrainAttempt.candidate?.log_loss?.toFixed?.(3) ??
                          'N/A'}
                      </div>
                      <div>Promoted: {String(lastRetrainAttempt.promoted)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              Recent Predictions
            </h3>
            <div
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Prediction
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Confidence
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Quality
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Market Regime
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      RSI
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      MACD
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mlInsights.slice(0, 10).map((insight, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        {new Date(insight.timestamp).toLocaleTimeString()}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor:
                              insight.prediction === 'BUY'
                                ? '#d4edda'
                                : '#f8d7da',
                            color:
                              insight.prediction === 'BUY'
                                ? '#155724'
                                : '#721c24',
                          }}
                        >
                          {insight.prediction}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${insight.confidence}%`,
                              height: '20px',
                              backgroundColor:
                                insight.confidence >= 70
                                  ? '#4caf50'
                                  : insight.confidence >= 50
                                  ? '#ff9800'
                                  : '#f44336',
                            }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {insight.confidence !== null &&
                          insight.confidence !== undefined
                            ? insight.confidence.toFixed(1) + '%'
                            : 'N/A'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${insight.trade_quality}%`,
                              height: '20px',
                              backgroundColor:
                                insight.trade_quality >= 80
                                  ? '#4caf50'
                                  : insight.trade_quality >= 60
                                  ? '#ff9800'
                                  : '#f44336',
                            }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {insight.trade_quality !== null &&
                          insight.trade_quality !== undefined
                            ? insight.trade_quality.toFixed(1)
                            : 'N/A'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                          }}
                        >
                          {insight.market_regime}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        {insight.rsi !== null && insight.rsi !== undefined
                          ? insight.rsi.toFixed(2)
                          : 'N/A'}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        {insight.macd !== null && insight.macd !== undefined
                          ? insight.macd.toFixed(4)
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              Learning Progress
            </h3>

            {learningProgress && (
              <div className="modern-card">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#1976d2',
                      }}
                    >
                      {learningProgress.total_trades}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#cbd5e1',
                        fontWeight: '500',
                      }}
                    >
                      Total Trades
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#10b981',
                      }}
                    >
                      {learningProgress.total_retrains || 0}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#cbd5e1',
                        fontWeight: '500',
                      }}
                    >
                      Total Retrains
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#f59e0b',
                      }}
                    >
                      {learningProgress.next_retrain_in}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#cbd5e1',
                        fontWeight: '500',
                      }}
                    >
                      Next Retrain In
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#4caf50',
                      }}
                    >
                      {learningProgress.best_accuracy !== undefined &&
                      learningProgress.best_accuracy !== null
                        ? (learningProgress.best_accuracy * 100).toFixed(1)
                        : '0.0'}
                      %
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#cbd5e1',
                        fontWeight: '500',
                      }}
                    >
                      Best Accuracy
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#f59e0b',
                      }}
                    >
                      {learningProgress.current_win_rate !== undefined &&
                      learningProgress.current_win_rate !== null
                        ? (learningProgress.current_win_rate * 100).toFixed(1)
                        : '0.0'}
                      %
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Current Win Rate
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#8b5cf6',
                      }}
                    >
                      {learningProgress.performance_improvement !== undefined &&
                      learningProgress.performance_improvement !== null
                        ? (
                            learningProgress.performance_improvement * 100
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#cbd5e1',
                        fontWeight: '500',
                      }}
                    >
                      Performance Improvement
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="modern-card">
              <h4
                style={{
                  marginBottom: '16px',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                }}
              >
                Learning Status
              </h4>
              <div
                style={{
                  fontSize: '14px',
                  color: '#cbd5e1',
                  lineHeight: '1.6',
                }}
              >
                <p>
                  <strong>Last Retrain:</strong>{' '}
                  {learningProgress?.last_retrain || 'Never'}
                </p>
                <p>
                  <strong>Retrain Frequency:</strong> Every{' '}
                  {learningProgress?.retrain_frequency || 10} trades
                </p>
                <p>
                  <strong>Learning Status:</strong>{' '}
                  {(learningProgress?.total_retrains || 0) > 0
                    ? 'Active Learning'
                    : 'Initial Training'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              Feature Importance
            </h3>

            <div className="modern-card">
              <h4
                style={{
                  marginBottom: '16px',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                }}
              >
                Top 10 Most Important Features
              </h4>
              <div style={{ height: '400px' }}>
                <Bar data={featureImportanceData} options={chartOptions} />
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Feature
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Importance
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Category
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #dee2e6',
                      }}
                    >
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureImportance.map((feature, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                          fontWeight: '600',
                        }}
                      >
                        {feature.feature}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                          }}
                        >
                          {feature.importance !== null &&
                          feature.importance !== undefined
                            ? feature.importance.toFixed(4)
                            : 'N/A'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            backgroundColor: '#f3e5f5',
                            color: '#9c27b0',
                          }}
                        >
                          {feature.category}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                          fontSize: '14px',
                        }}
                      >
                        {feature.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              Model Performance
            </h3>

            <div className="modern-card">
              <h4
                style={{
                  marginBottom: '16px',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                }}
              >
                Model Performance Comparison
              </h4>
              <div style={{ height: '400px' }}>
                <Bar data={modelPerformanceData} options={chartOptions} />
              </div>
            </div>

            <div className="modern-grid">
              {modelPerformance.map((model, index) => (
                <div
                  key={index}
                  className="modern-card"
                  style={{
                    padding: '20px',
                  }}
                >
                  <h4
                    style={{
                      marginBottom: '12px',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                  >
                    {model.model}
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                      gap: '8px',
                      fontSize: 'clamp(13px, 2.5vw, 14px)',
                      color: '#cbd5e1',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>Accuracy:</strong>{' '}
                      {model.accuracy !== null && model.accuracy !== undefined
                        ? (model.accuracy * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                    <div>
                      <strong style={{ color: '#ffffff' }}>Precision:</strong>{' '}
                      {model.precision !== null && model.precision !== undefined
                        ? (model.precision * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                    <div>
                      <strong style={{ color: '#ffffff' }}>Recall:</strong>{' '}
                      {model.recall !== null && model.recall !== undefined
                        ? (model.recall * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                    <div>
                      <strong style={{ color: '#ffffff' }}>F1 Score:</strong>{' '}
                      {model.f1_score !== null && model.f1_score !== undefined
                        ? (model.f1_score * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#cbd5e1',
                    }}
                  >
                    Last Updated:{' '}
                    {new Date(model.last_updated).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MLInsightsDashboard;
