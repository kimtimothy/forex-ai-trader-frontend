import React, { useEffect, useState } from 'react';
import { tradingApi } from '../services/api';
// import { staggeredPolling, POLLING_CONFIGS } from '../utils/staggeredPolling';

interface Trade {
  id: string;
  pair: string;
  type: string;
  entryPrice: number;
  currentPrice: number;
  units: number;
  unrealizedPL: number;
  openTime: string;
  takeProfitPrice: number;
  stopLossPrice: number;
}

interface Position {
  pair: string;
  units: number;
  averagePrice: number;
  unrealizedPL: number;
  currentPrice: number;
  trades: Trade[];
}

interface ModifyTradeForm {
  takeProfitPrice: number;
  stopLossPrice: number;
}

const ActivePositions: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [modifyForm, setModifyForm] = useState<ModifyTradeForm>({
    takeProfitPrice: 0,
    stopLossPrice: 0,
  });

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const fetchTrades = async () => {
    try {
      const data = await tradingApi.getPositions();
      const formattedTrades = data.map((trade: any) => ({
        id: trade.id || `trade-${Date.now()}`,
        pair: trade.pair,
        type: trade.type || trade.direction,
        entryPrice: Number(trade.entryPrice),
        currentPrice: Number(trade.currentPrice),
        units: Number(trade.units),
        unrealizedPL: Number(trade.unrealizedPL),
        openTime: trade.openTime,
        takeProfitPrice: Number(trade.takeProfitPrice),
        stopLossPrice: Number(trade.stopLossPrice),
      }));
      setTrades(formattedTrades);

      // Calculate positions
      const groupedTrades = formattedTrades.reduce(
        (acc: { [key: string]: Position }, trade: Trade) => {
          const pair = trade.pair;
          if (!acc[pair]) {
            acc[pair] = {
              pair,
              units: 0,
              averagePrice: 0,
              unrealizedPL: 0,
              currentPrice: trade.currentPrice,
              trades: [],
            };
          }
          acc[pair].trades.push(trade);
          acc[pair].units += trade.units * (trade.type === 'LONG' ? 1 : -1);
          acc[pair].unrealizedPL += trade.unrealizedPL;
          acc[pair].currentPrice = trade.currentPrice;

          // Calculate weighted average price
          const totalUnits = acc[pair].trades.reduce(
            (sum, t) => sum + Math.abs(t.units),
            0
          );
          acc[pair].averagePrice =
            acc[pair].trades.reduce(
              (sum, t) => sum + t.entryPrice * Math.abs(t.units),
              0
            ) / totalUnits;

          return acc;
        },
        {}
      );

      setPositions(Object.values(groupedTrades));
      setError(null);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to fetch active trades');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setModifyForm({
      takeProfitPrice: trade.takeProfitPrice,
      stopLossPrice: trade.stopLossPrice,
    });
    setModifyDialogOpen(true);
  };

  const handleCloseTrade = async (tradeId: string) => {
    try {
      await tradingApi.closeTrade(tradeId);
      fetchTrades();
    } catch (err) {
      console.error('Error closing trade:', err);
      setError('Failed to close trade');
    }
  };

  const handleModifySubmit = async () => {
    if (!selectedTrade) return;

    try {
      await tradingApi.modifyTrade(selectedTrade.id, {
        takeProfitPrice: modifyForm.takeProfitPrice,
        stopLossPrice: modifyForm.stopLossPrice,
      });
      setModifyDialogOpen(false);
      fetchTrades();
    } catch (err) {
      console.error('Error modifying trade:', err);
      setError('Failed to modify trade');
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000); // 15 second polling
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
        📊 Active Trades
      </h2>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#fca5a5',
            fontSize: '14px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="modern-tabs">
        <button
          className={`modern-tab ${tabValue === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
          aria-label="View positions overview"
        >
          📈 Positions
        </button>
        <button
          className={`modern-tab ${tabValue === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
          aria-label="View individual trades"
        >
          🔄 Individual Trades
        </button>
      </div>

      {tabValue === 0 && (
        <div className="modern-table">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Net Units</th>
                <th>Avg. Entry</th>
                <th>Current</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: 'center',
                      padding: '32px',
                      color: '#cbd5e1',
                    }}
                  >
                    No active positions
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.pair}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>
                        {position.pair.replace('_', '/')}
                      </div>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {position.units.toLocaleString()}
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {position.averagePrice !== null && position.averagePrice !== undefined 
                        ? position.averagePrice.toFixed(5)
                        : 'N/A'}
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {position.currentPrice !== null && position.currentPrice !== undefined 
                        ? position.currentPrice.toFixed(5)
                        : 'N/A'}
                    </td>
                    <td
                      style={{
                        color:
                          position.unrealizedPL >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '600',
                      }}
                    >
                      {position.unrealizedPL !== null && position.unrealizedPL !== undefined 
                        ? position.unrealizedPL.toFixed(2)
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tabValue === 1 && (
        <div className="modern-table">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Pair</th>
                <th>Type</th>
                <th>Entry</th>
                <th>Current</th>
                <th>TP</th>
                <th>SL</th>
                <th>Size</th>
                <th>P/L</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: 'center',
                      padding: '32px',
                      color: '#cbd5e1',
                    }}
                  >
                    No active trades
                  </td>
                </tr>
              ) : (
                trades.map((trade, index) => (
                  <tr key={`${trade.id}-${index}-${trade.openTime}`}>
                    <td style={{ color: '#cbd5e1', fontSize: '14px' }}>
                      {new Date(trade.openTime).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>
                        {trade.pair.replace('_', '/')}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>
                          {trade.type === 'LONG' ? '📈' : '📉'}
                        </span>
                        <span
                          className={`modern-badge ${
                            trade.type === 'LONG'
                              ? 'badge-success'
                              : 'badge-danger'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {trade.entryPrice !== null && trade.entryPrice !== undefined 
                        ? trade.entryPrice.toFixed(5)
                        : 'N/A'}
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {trade.currentPrice !== null && trade.currentPrice !== undefined 
                        ? trade.currentPrice.toFixed(5)
                        : 'N/A'}
                    </td>
                    <td>
                      {trade.takeProfitPrice ? (
                        <span style={{ color: '#10b981', fontWeight: '500' }}>
                          {trade.takeProfitPrice !== null && trade.takeProfitPrice !== undefined 
                            ? trade.takeProfitPrice.toFixed(5)
                            : 'N/A'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {trade.stopLossPrice ? (
                        <span style={{ color: '#ef4444', fontWeight: '500' }}>
                          {trade.stopLossPrice !== null && trade.stopLossPrice !== undefined 
                            ? trade.stopLossPrice.toFixed(5)
                            : 'N/A'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {trade.units.toLocaleString()}
                    </td>
                    <td
                      style={{
                        color: trade.unrealizedPL >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '600',
                      }}
                    >
                      {trade.unrealizedPL !== null && trade.unrealizedPL !== undefined 
                        ? trade.unrealizedPL.toFixed(2)
                        : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="modern-button"
                          onClick={() => handleModifyTrade(trade)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            minWidth: 'auto',
                          }}
                          aria-label={`Modify trade for ${trade.pair}`}
                          title="Modify Trade"
                        >
                          ✏️
                        </button>
                        <button
                          className="modern-button"
                          onClick={() => handleCloseTrade(trade.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            minWidth: 'auto',
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          }}
                          aria-label={`Close trade for ${trade.pair}`}
                          title="Close Trade"
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modifyDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modern-card"
            style={{
              maxWidth: '400px',
              width: '90%',
              margin: '20px',
            }}
          >
            <h3
              style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
              }}
            >
              ✏️ Modify Trade
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Take Profit
              </label>
              <input
                type="number"
                className="modern-input"
                value={modifyForm.takeProfitPrice}
                onChange={(e) =>
                  setModifyForm({
                    ...modifyForm,
                    takeProfitPrice: Number(e.target.value),
                  })
                }
                step="0.00001"
                aria-label="Take profit price"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Stop Loss
              </label>
              <input
                type="number"
                className="modern-input"
                value={modifyForm.stopLossPrice}
                onChange={(e) =>
                  setModifyForm({
                    ...modifyForm,
                    stopLossPrice: Number(e.target.value),
                  })
                }
                step="0.00001"
                aria-label="Stop loss price"
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className="modern-button"
                onClick={() => setModifyDialogOpen(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                }}
              >
                Cancel
              </button>
              <button className="modern-button" onClick={handleModifySubmit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivePositions;
