import React, { useEffect, useState, useCallback } from 'react';
import { tradingApi } from '../services/api';

interface Trade {
    id: string;
    pair: string;
    type: string;
    entryPrice: number;
    exitPrice: number;
    profit: number;
    status: string;
    timestamp: string;
    confidence: number;
}

const TradeHistory: React.FC = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    pair: '',
    type: '',
    status: '',
    minProfit: '',
    maxProfit: '',
    minConfidence: '',
    maxConfidence: '',
    profitFilter: 'all', // 'all', 'profit', 'loss'
  });

    const fetchTrades = async () => {
        try {
            console.log('TradeHistory: Starting fetch...');
            const data = await tradingApi.getTrades();
            
            // Ensure all required fields are present and properly formatted
            const formattedTrades = data.map((trade: any, index: number) => ({
                id: trade.id || `trade-${index}-${Date.now()}`,
                pair: trade.pair || 'UNKNOWN',
                type: trade.type || 'UNKNOWN',
                entryPrice: Number(trade.entry_price || trade.entryPrice || 0),
                exitPrice: Number(trade.exit_price || trade.exitPrice || 0),
                profit: Number(trade.profit || 0),
                status: trade.status || 'UNKNOWN',
                timestamp: trade.timestamp || new Date().toISOString(),
        confidence: Number(trade.confidence || 0),
            }));

            setTrades(formattedTrades);
            setError(null);
        } catch (err) {
            console.error('TradeHistory: Error details:', err);
            setError('Failed to fetch trade history');
        } finally {
            setLoading(false);
        }
    };

  // Apply filters to trades
  const applyFilters = useCallback((tradesList: Trade[]) => {
    return tradesList.filter((trade) => {
      // Debug confidence values
      if (filters.minConfidence || filters.maxConfidence) {
        console.log(
          `Trade confidence: ${trade.confidence} (${(
            trade.confidence * 100
          ).toFixed(1)}%), Min: ${filters.minConfidence}, Max: ${
            filters.maxConfidence
          }`
        );
      }

      // Date range filter
      if (filters.dateFrom) {
        const tradeDate = new Date(trade.timestamp);
        const fromDate = new Date(filters.dateFrom);
        if (tradeDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const tradeDate = new Date(trade.timestamp);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        if (tradeDate > toDate) return false;
      }

      // Pair filter
      if (filters.pair && trade.pair !== filters.pair) return false;

      // Type filter
      if (filters.type && trade.type !== filters.type) return false;

      // Status filter
      if (filters.status && trade.status !== filters.status) return false;

      // Profit range filter
      if (filters.minProfit && trade.profit < parseFloat(filters.minProfit))
        return false;
      if (filters.maxProfit && trade.profit > parseFloat(filters.maxProfit))
        return false;

      // Confidence range filter (convert percentage input to decimal for comparison)
      if (
        filters.minConfidence &&
        trade.confidence < parseFloat(filters.minConfidence) / 100
      )
        return false;
      if (
        filters.maxConfidence &&
        trade.confidence > parseFloat(filters.maxConfidence) / 100
      )
        return false;

      // Profit/Loss filter
      if (filters.profitFilter === 'profit' && trade.profit <= 0) return false;
      if (filters.profitFilter === 'loss' && trade.profit >= 0) return false;

      return true;
    });
  }, [filters]);

  // Update filtered trades when trades or filters change
  React.useEffect(() => {
    const filtered = applyFilters(trades);
    setFilteredTrades(filtered);
    setPage(0); // Reset to first page when filters change
  }, [trades, applyFilters]);

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      pair: '',
      type: '',
      status: '',
      minProfit: '',
      maxProfit: '',
      minConfidence: '',
      maxConfidence: '',
      profitFilter: 'all',
    });
  };

  // Get unique values for dropdown filters
  const uniquePairs = Array.from(
    new Set(trades.map((trade) => trade.pair))
  ).sort();
  const uniqueTypes = Array.from(
    new Set(trades.map((trade) => trade.type))
  ).sort();
  const uniqueStatuses = Array.from(
    new Set(trades.map((trade) => trade.status))
  ).sort();

    useEffect(() => {
        fetchTrades();
        const interval = setInterval(fetchTrades, 60000); // Reduced from 30s to 60s
        return () => clearInterval(interval);
    }, []);

  const handleChangePage = (newPage: number) => {
        setPage(newPage);
    };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
        setPage(0);
    };

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

  const totalPages = Math.ceil(filteredTrades.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentTrades = filteredTrades.slice(startIndex, endIndex);

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
        📚 Trade History
      </h2>

      {/* Filter Section */}
      <div
        style={{
          marginBottom: '32px',
          padding: '24px',
          background:
            'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🔍 Filters
          </h3>
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '8px',
              color: '#c7d2fe',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow =
                '0 4px 12px rgba(99, 102, 241, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 2px 8px rgba(99, 102, 241, 0.2)';
            }}
          >
            Clear All
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Date Range Filters */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(99, 102, 241, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          {/* Pair Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Currency Pair
            </label>
            <select
              value={filters.pair}
              onChange={(e) => handleFilterChange('pair', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              <option value="">All Pairs</option>
              {uniquePairs.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Trade Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              <option value="">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Profit Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Profit/Loss
            </label>
            <select
              value={filters.profitFilter}
              onChange={(e) =>
                handleFilterChange('profitFilter', e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              <option value="all">All Trades</option>
              <option value="profit">Profitable Only</option>
              <option value="loss">Losses Only</option>
            </select>
          </div>

          {/* Profit Range */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Min Profit ($)
            </label>
            <input
              type="number"
              placeholder="Min profit"
              value={filters.minProfit}
              onChange={(e) => handleFilterChange('minProfit', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Max Profit ($)
            </label>
            <input
              type="number"
              placeholder="Max profit"
              value={filters.maxProfit}
              onChange={(e) => handleFilterChange('maxProfit', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          {/* Confidence Range */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Min Confidence (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g., 70"
              value={filters.minConfidence}
              onChange={(e) =>
                handleFilterChange('minConfidence', e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Max Confidence (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g., 90"
              value={filters.maxConfidence}
              onChange={(e) =>
                handleFilterChange('maxConfidence', e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>
        </div>

        {/* Filter Summary */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background:
              'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)',
          }}
        >
          <div
            style={{
              fontSize: '15px',
              color: '#c7d2fe',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: '500',
            }}
          >
            <span>
              Showing {filteredTrades.length} of {trades.length} trades
            </span>
            {filteredTrades.length > 0 && (
              <span>
                Total P&L: $
                {filteredTrades
                  .reduce((sum, trade) => sum + trade.profit, 0)
                  .toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

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

      <div className="modern-table">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Pair</th>
              <th>Type</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P/L</th>
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentTrades.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: '#cbd5e1',
                  }}
                >
                  No trade history available
                </td>
              </tr>
            ) : (
              currentTrades.map((trade, index) => (
                <tr key={`${trade.id}-${index}`}>
                  <td style={{ color: '#cbd5e1', fontSize: '14px' }}>
                    {new Date(trade.timestamp).toLocaleString()}
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
                      <span style={{ color: '#cbd5e1' }}>{trade.type}</span>
                    </div>
                  </td>
                  <td style={{ color: '#cbd5e1' }}>
                    {trade.entryPrice !== null && trade.entryPrice !== undefined
                      ? trade.entryPrice.toFixed(5)
                      : 'N/A'}
                  </td>
                  <td style={{ color: '#cbd5e1' }}>
                    {trade.exitPrice !== null && trade.exitPrice !== undefined
                      ? trade.exitPrice.toFixed(5)
                      : 'N/A'}
                  </td>
                  <td
                    style={{
                      color: trade.profit >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: '600',
                    }}
                  >
                    {trade.profit !== null && trade.profit !== undefined
                      ? trade.profit.toFixed(2)
                      : 'N/A'}
                  </td>
                  <td>
                    <span
                      className={`modern-badge ${
                        trade.confidence >= 0.7
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {trade.confidence !== null &&
                      trade.confidence !== undefined
                        ? (trade.confidence * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`modern-badge ${
                        trade.status === 'CLOSED'
                          ? 'badge-info'
                          : 'badge-warning'
                      }`}
                    >
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          padding: '16px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
          Showing {startIndex + 1}-{Math.min(endIndex, trades.length)} of{' '}
          {trades.length} trades
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#cbd5e1', fontSize: '14px' }}>
              Rows per page:
            </label>
            <select
              className="modern-input"
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              style={{ padding: '4px 8px', fontSize: '14px', minWidth: '60px' }}
              aria-label="Select rows per page"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="modern-button"
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 0}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                minWidth: 'auto',
                backgroundColor:
                  page === 0 ? 'rgba(255, 255, 255, 0.1)' : undefined,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.6 : 1,
              }}
              aria-label="Go to previous page"
            >
              ← Previous
            </button>

            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>
              Page {page + 1} of {totalPages}
            </span>

            <button
              className="modern-button"
              onClick={() => handleChangePage(page + 1)}
              disabled={page >= totalPages - 1}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                minWidth: 'auto',
                backgroundColor:
                  page >= totalPages - 1
                    ? 'rgba(255, 255, 255, 0.1)'
                    : undefined,
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages - 1 ? 0.6 : 1,
              }}
              aria-label="Go to next page"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
    );
};

export default TradeHistory;
