import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { ComprehensiveAnalytics, PairRecommendation, RegimePerformance } from '../types/types';

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/comprehensive');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading && !analytics) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#e74c3c' }}>
        <p>⚠️ {error}</p>
        <p style={{ fontSize: '0.9em', color: '#95a5a6' }}>
          Phase 3 Analytics will be available once trades are recorded.
        </p>
      </div>
    );
  }

  if (!analytics) return null;

  // Prepare confluence chart data
  const confluenceBrackets = Object.keys(analytics.confluence_performance || {}).sort();
  const confluenceChartData = {
    labels: confluenceBrackets,
    datasets: [
      {
        label: 'Win Rate (%)',
        data: confluenceBrackets.map(
          bracket => (analytics.confluence_performance[bracket]?.win_rate || 0) * 100
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'ENABLE': return '#27ae60';
      case 'INCREASE': return '#f39c12';
      case 'MONITOR': return '#3498db';
      case 'DISABLE': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  // Get action emoji
  const getActionEmoji = (action: string) => {
    switch (action) {
      case 'ENABLE': return '✅';
      case 'INCREASE': return '📈';
      case 'MONITOR': return '👀';
      case 'DISABLE': return '🚫';
      default: return '❓';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
        📊 Phase 3: Performance Analytics & Optimization
      </h2>

      {/* Confluence Performance */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ marginBottom: '15px', color: '#34495e' }}>
          🎯 Confluence Performance
        </h3>
        {confluenceBrackets.length > 0 ? (
          <>
            <Bar
              data={confluenceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: (value) => value + '%',
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const bracket = context.label;
                        const perf = analytics.confluence_performance[bracket];
                        return [
                          `Win Rate: ${context.parsed.y.toFixed(1)}%`,
                          `Trades: ${perf?.trades || 0}`,
                          `Avg Profit: $${(perf?.avg_profit || 0).toFixed(2)}`,
                        ];
                      },
                    },
                  },
                },
              }}
              height={250}
            />
            <div
              style={{
                marginTop: '15px',
                padding: '10px',
                background: '#ecf0f1',
                borderRadius: '5px',
                textAlign: 'center',
              }}
            >
              <strong>Optimal Threshold: {analytics.optimal_confluence_threshold}%</strong>
              <br />
              <span style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
                {analytics.threshold_reason}
              </span>
            </div>
          </>
        ) : (
          <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px' }}>
            No confluence data yet. Start trading to see performance by confluence level.
          </p>
        )}
      </div>

      {/* Pair Recommendations */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ marginBottom: '15px', color: '#34495e' }}>
          💱 Pair Recommendations
        </h3>
        {Object.keys(analytics.pair_recommendations || {}).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(analytics.pair_recommendations).map(([pair, rec]) => (
              <div
                key={pair}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '5px',
                  borderLeft: `4px solid ${getActionColor(rec.action)}`,
                }}
              >
                <span style={{ fontWeight: 'bold', minWidth: '80px' }}>{pair}</span>
                <span
                  style={{
                    minWidth: '80px',
                    color: rec.win_rate >= 0.7 ? '#27ae60' : rec.win_rate >= 0.55 ? '#f39c12' : '#e74c3c',
                    fontWeight: 'bold',
                  }}
                >
                  {(rec.win_rate * 100).toFixed(1)}%
                </span>
                <span
                  style={{
                    minWidth: '120px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: getActionColor(rec.action),
                    color: 'white',
                    fontSize: '0.85em',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {getActionEmoji(rec.action)} {rec.action}
                </span>
                <span style={{ fontSize: '0.9em', color: '#7f8c8d', marginLeft: 'auto' }}>
                  {rec.reason} ({rec.total_trades} trades)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px' }}>
            No pair recommendations yet. Trade more to get insights.
          </p>
        )}
      </div>

      {/* Session Performance */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ marginBottom: '15px', color: '#34495e' }}>
          🕐 Session Performance
        </h3>
        {Object.keys(analytics.session_performance || {}).length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#ecf0f1' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Pair</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>LONDON</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>NY</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>TOKYO</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>SYDNEY</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.session_performance).map(([pair, sessions]) => (
                  <tr key={pair} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{pair}</td>
                    {['LONDON', 'NY', 'TOKYO', 'SYDNEY'].map(session => {
                      const data = sessions[session];
                      const winRate = data?.win_rate || 0;
                      const trades = data?.trades || 0;
                      const bgColor = 
                        winRate >= 0.7 ? '#d5f4e6' : 
                        winRate >= 0.55 ? '#fef5e7' : 
                        trades > 0 ? '#fadbd8' : '#f8f9fa';
                      
                      return (
                        <td
                          key={session}
                          style={{
                            padding: '10px',
                            textAlign: 'center',
                            background: bgColor,
                          }}
                        >
                          {trades > 0 ? (
                            <>
                              <div style={{ fontWeight: 'bold' }}>
                                {(winRate * 100).toFixed(0)}%
                              </div>
                              <div style={{ fontSize: '0.8em', color: '#7f8c8d' }}>
                                ({trades} trades)
                              </div>
                            </>
                          ) : (
                            <span style={{ color: '#bdc3c7' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px' }}>
            No session data yet. Trade across different sessions to see patterns.
          </p>
        )}
      </div>

      {/* Regime Performance */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginBottom: '15px', color: '#34495e' }}>
          🎭 Regime-Specific Performance
        </h3>
        {Object.keys(analytics.regime_performance || {}).length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
            }}
          >
            {Object.entries(analytics.regime_performance).map(([regime, data]) => (
              <div
                key={regime}
                style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '2px solid #ecf0f1',
                }}
              >
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>{regime}</h4>
                <div style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Win Rate:</strong>{' '}
                    <span
                      style={{
                        color:
                          data.win_rate >= 0.7
                            ? '#27ae60'
                            : data.win_rate >= 0.55
                            ? '#f39c12'
                            : '#e74c3c',
                        fontWeight: 'bold',
                      }}
                    >
                      {(data.win_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Trades:</strong> {data.trades}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Avg Profit:</strong> ${data.avg_profit.toFixed(2)}
                  </div>
                  <div>
                    <strong>Avg R:</strong> {data.avg_r_multiple.toFixed(2)}R
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px' }}>
            No regime data yet. Trade in different market conditions to see performance.
          </p>
        )}
      </div>

      {/* Last Updated */}
      <div style={{ marginTop: '15px', textAlign: 'center', color: '#95a5a6', fontSize: '0.85em' }}>
        Last updated: {new Date(analytics.last_updated).toLocaleString()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

