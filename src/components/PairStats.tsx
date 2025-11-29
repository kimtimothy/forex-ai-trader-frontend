import React, { useEffect, useState } from 'react';
import { tradingApi } from '../services/api';

interface TradeStats {
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  averageProfit: number;
  lastTradeTime: string | null;
  totalProfit: number;
  maxDrawdown: number;
}

interface Stats {
  [pair: string]: TradeStats;
}

const StatItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  color?: string;
  ariaLabel?: string;
}> = ({ icon, label, value, color, ariaLabel }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px',
      padding: '8px 0',
    }}
  >
    <div
      style={{
        marginRight: '12px',
        color: color || '#6366f1',
        fontSize: '20px',
        width: '24px',
        textAlign: 'center',
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: '12px',
          color: '#cbd5e1',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff',
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

const PairStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await tradingApi.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('PairStats: Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchStats, 60000); // Reduced from 30s to 60s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="modern-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(99, 102, 241, 0.3)',
              borderTop: '3px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-card">
        <h2
          style={{
            margin: '0 0 24px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          📊 Pair Statistics
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#fca5a5',
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <span style={{ marginRight: '8px', fontSize: '20px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-card">
      <h2
        style={{
          margin: '0 0 24px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: '#ffffff',
          background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        📊 Pair Statistics
      </h2>

      <div className="modern-grid">
        {Object.entries(stats).map(([pair, pairStats]) => (
          <div key={pair} className="stats-card">
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#6366f1',
                textAlign: 'center',
              }}
            >
              {pair.replace('_', '/')}
            </h3>

            <div
              style={{
                height: '1px',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%)',
                margin: '16px 0',
              }}
            />

            <div style={{ marginTop: '16px' }}>
              <StatItem
                icon="📈"
                label="Win Rate"
                value={pairStats.winRate !== null && pairStats.winRate !== undefined 
                  ? `${pairStats.winRate.toFixed(2)}%`
                  : 'N/A'}
                color={pairStats.winRate >= 50 ? '#10b981' : '#ef4444'}
                ariaLabel={`Win rate for ${pair}: ${pairStats.winRate !== null && pairStats.winRate !== undefined 
                  ? pairStats.winRate.toFixed(2) + '%'
                  : 'N/A'}`}
              />

              <StatItem
                icon="📊"
                label="Profit Factor"
                value={
                  pairStats.profitFactor === Infinity
                    ? '∞'
                    : pairStats.profitFactor !== null && pairStats.profitFactor !== undefined
                    ? pairStats.profitFactor.toFixed(2)
                    : 'N/A'
                }
                color="#3b82f6"
                ariaLabel={`Profit factor for ${pair}: ${
                  pairStats.profitFactor === Infinity
                    ? 'infinity'
                    : pairStats.profitFactor !== null && pairStats.profitFactor !== undefined
                    ? pairStats.profitFactor.toFixed(2)
                    : 'N/A'
                }`}
              />

              <StatItem
                icon="🔄"
                label="Total Trades"
                value={pairStats.totalTrades.toString()}
                color="#f59e0b"
                ariaLabel={`Total trades for ${pair}: ${pairStats.totalTrades}`}
              />

              <StatItem
                icon="💰"
                label="Average Profit"
                value={pairStats.averageProfit !== null && pairStats.averageProfit !== undefined 
                  ? pairStats.averageProfit.toFixed(2)
                  : 'N/A'}
                color={pairStats.averageProfit >= 0 ? '#10b981' : '#ef4444'}
                ariaLabel={`Average profit for ${pair}: ${pairStats.averageProfit !== null && pairStats.averageProfit !== undefined 
                  ? pairStats.averageProfit.toFixed(2)
                  : 'N/A'}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PairStats;
