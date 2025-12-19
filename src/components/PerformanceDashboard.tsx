import React, { useEffect, useMemo, useState } from 'react';
import { tradingApi } from '../services/api';
import ThresholdSettings from './ThresholdSettings';

type Trade = {
  timestamp: string;
  profit_loss: number;
  pair: string;
  // Allow optional confluence if backend logging includes it
  confluence?: { 
    total_score?: number;
    percentage?: number;  // NEW: PDF-aligned percentage score
    label?: string;  // NEW: Grade label (A-F)
    head_and_shoulders?: boolean;
    double_top_bottom?: boolean;  // NEW: Double pattern detection
  };
  id?: string;
  type?: string;
  entryPrice?: number;
  exitPrice?: number;
  volume?: number;
  status?: string;
  confidence?: number;
  [key: string]: any;
};

const formatCurrency = (n: number) =>
  (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);

const PerformanceDashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await tradingApi.getTrades();
        // Normalize trade shape coming from API
        const normalized: Trade[] = (data || []).map((t: any) => ({
          timestamp: t.timestamp || new Date().toISOString(),
          profit_loss: Number(t.profit_loss ?? t.profit ?? 0),
          pair: t.pair || t.instrument || '',
          confluence: t.confluence || undefined,
          id: t.id || t.trade_id,
          type: t.type,
          entryPrice: Number(t.entryPrice ?? t.entry_price ?? 0),
          exitPrice: Number(t.exitPrice ?? t.exit_price ?? 0),
          volume: Number(t.volume ?? 0),
          status: t.status,
          confidence: Number(t.confidence ?? 0),
          ...t,
        }));
        setTrades(normalized);
        setError(null);
      } catch (e) {
        setError('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const monthMatrix = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const startDow = startOfMonth.getDay(); // 0 Sun - 6 Sat
    const gridStart = new Date(startOfMonth);
    gridStart.setDate(startOfMonth.getDate() - startDow);
    const days = Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const tForDay = trades.filter((t) => (t.timestamp || '').slice(0, 10) === key);
      const pnl = tForDay.reduce((s, t) => s + (t.profit_loss || 0), 0);
      return {
        date: d,
        key,
        inCurrentMonth: d.getMonth() === month,
        count: tForDay.length,
        pnl,
      };
    });
    return { days, month, year };
  }, [calendarDate, trades]);

  const selectedTrades = useMemo(() => {
    if (!selectedDateKey) return [];
    return trades
      .filter((t) => (t.timestamp || '').slice(0, 10) === selectedDateKey)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [selectedDateKey, trades]);

  const metrics = useMemo(() => {
    if (!trades.length) {
      return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
        bestStreak: 0,
        avgConfluence: 0,
        weekly: [] as { week: string; pnl: number; days: number }[],
        recent: [] as Trade[],
      };
    }

    const wins = trades.filter(t => t.profit_loss > 0).length;
    const losses = trades.filter(t => t.profit_loss <= 0).length;
    const totalProfit = trades.filter(t => t.profit_loss > 0).reduce((s, t) => s + t.profit_loss, 0);
    const totalLossAbs = Math.abs(trades.filter(t => t.profit_loss < 0).reduce((s, t) => s + t.profit_loss, 0));
    const netPnL = totalProfit - totalLossAbs;
    const profitFactor = totalLossAbs > 0 ? totalProfit / totalLossAbs : (totalProfit > 0 ? Infinity : 0);
    const largestWin = trades.reduce((m, t) => t.profit_loss > m ? t.profit_loss : m, 0);
    const largestLoss = trades.reduce((m, t) => t.profit_loss < m ? t.profit_loss : m, 0);
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;

    // Best streak of consecutive wins
    let bestStreak = 0;
    let streak = 0;
    trades
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(t => {
        if (t.profit_loss > 0) {
          streak += 1;
          bestStreak = Math.max(bestStreak, streak);
        } else {
          streak = 0;
        }
      });

    // Average confluence if available in trades
    // Prefer percentage if available (PDF-aligned), otherwise use total_score
    const confluences = trades
      .map(t => Number(t.confluence?.percentage ?? t.confluence?.total_score))
      .filter(n => !Number.isNaN(n) && Number.isFinite(n));
    const avgConfluence = confluences.length
      ? Math.round(confluences.reduce((s, n) => s + n, 0) / confluences.length)
      : 0;
    
    // Count pattern detections
    const hsPatterns = trades.filter(t => t.confluence?.head_and_shoulders).length;
    const doublePatterns = trades.filter(t => t.confluence?.double_top_bottom).length;

    // Weekly summary (ISO week)
    const weeklyMap = new Map<string, { pnl: number; dates: Set<string> }>();
    trades.forEach(t => {
      const d = new Date(t.timestamp);
      // Year-week key
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil((((d as any) - (onejan as any)) / 86400000 + onejan.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${week}`;
      const entry = weeklyMap.get(key) || { pnl: 0, dates: new Set<string>() };
      entry.pnl += t.profit_loss;
      entry.dates.add(d.toDateString());
      weeklyMap.set(key, entry);
    });
    const weekly = Array.from(weeklyMap.entries()).map(([week, v]) => ({
      week,
      pnl: v.pnl,
      days: v.dates.size,
    })).sort((a, b) => a.week.localeCompare(b.week));

    const recent = trades
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return {
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      totalProfit,
      totalLoss: -totalLossAbs,
      netPnL,
      profitFactor,
      largestWin,
      largestLoss,
      bestStreak,
      avgConfluence,
      hsPatterns,
      doublePatterns,
      weekly,
      recent,
    };
  }, [trades]);

  if (loading) {
    return <div style={{ padding: 16, color: '#94a3b8' }}>Loading dashboard…</div>;
  }
  if (error) {
    return <div style={{ padding: 16, color: '#ef4444' }}>{error}</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="mb-8">
          <h1 className="text-white" style={{ 
            fontSize: 'clamp(24px, 5vw, 32px)', 
            fontWeight: 800, 
            marginBottom: 8 
          }}>
            Trading Dashboard
          </h1>
          <p className="text-slate-400" style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
            Your trading performance at a glance
          </p>
        </div>

        {/* Strategy thresholds (Model & Confluence) */}
        <div style={{ marginBottom: 24 }}>
          <ThresholdSettings />
        </div>

        <div className="grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', gridTemplateRows: 'auto', }}>
          {/* PnL + headline metrics */}
          <div className="card-hover" style={{
            gridColumn: '1 / -1',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(5,150,105,0.05))',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'clamp(16px, 3vw, 24px)',
            padding: 'clamp(16px, 4vw, 24px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p className="text-slate-400" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Net Profit & Loss</p>
                <h2 style={{ 
                  color: metrics.netPnL >= 0 ? '#34d399' : '#f87171', 
                  fontSize: 'clamp(32px, 8vw, 56px)', 
                  fontWeight: 800 
                }}>
                  {formatCurrency(metrics.netPnL)}
                </h2>
                <p style={{ marginTop: 8, color: '#6ee7b7', fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 600 }}>
                  + {metrics.totalTrades} trades completed
                </p>
              </div>
            </div>
            <div className="grid" style={{ 
              display: 'grid', 
              gap: 'clamp(8px, 2vw, 16px)', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' 
            }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 'clamp(12px, 2vw, 16px)' }}>
                <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Win Rate</p>
                <p className="text-white" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800 }}>{metrics.winRate.toFixed(0)}%</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 'clamp(12px, 2vw, 16px)' }}>
                <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Profit Factor</p>
                <p className="text-white" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800 }}>
                  {Number.isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : '∞'}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 'clamp(12px, 2vw, 16px)' }}>
                <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Avg Confluence</p>
                <p className="text-white" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800 }}>{metrics.avgConfluence}%</p>
                {((metrics.hsPatterns ?? 0) > 0 || (metrics.doublePatterns ?? 0) > 0) && (
                  <div style={{ marginTop: 6, fontSize: 10, color: '#10b981' }}>
                    {(metrics.hsPatterns ?? 0) > 0 && <span title="Head & Shoulders patterns">📊 H&S: {metrics.hsPatterns} </span>}
                    {(metrics.doublePatterns ?? 0) > 0 && <span title="Double Top/Bottom patterns">📈 2x: {metrics.doublePatterns}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profit / Loss cards */}
          <div style={{ 
            display: 'grid', 
            gap: 'clamp(12px, 3vw, 24px)', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' 
          }}>
            <div className="card-hover" style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(5,150,105,0.05))',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'clamp(16px, 3vw, 24px)',
              padding: 'clamp(16px, 4vw, 24px)'
            }}>
              <p className="text-slate-400" style={{ fontSize: 12, marginBottom: 4 }}>Total Profit</p>
              <p className="text-white" style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800 }}>{formatCurrency(metrics.totalProfit)}</p>
              <p style={{ color: '#6ee7b7', fontSize: 12, marginTop: 4 }}>{metrics.wins} winning trades</p>
            </div>
            <div className="card-hover" style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(220,38,38,0.05))',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'clamp(16px, 3vw, 24px)',
              padding: 'clamp(16px, 4vw, 24px)'
            }}>
              <p className="text-slate-400" style={{ fontSize: 12, marginBottom: 4 }}>Total Loss</p>
              <p className="text-white" style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800 }}>{formatCurrency(metrics.totalLoss)}</p>
              <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{metrics.losses} losing trades</p>
            </div>
          </div>

          {/* Four mini-cards */}
          <div style={{ 
            display: 'grid', 
            gap: 'clamp(12px, 3vw, 24px)', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))' 
          }}>
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(12px, 3vw, 24px)' 
            }}>
              <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Largest Win</p>
              <p className="text-white" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800 }}>{formatCurrency(metrics.largestWin)}</p>
            </div>
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(12px, 3vw, 24px)' 
            }}>
              <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Largest Loss</p>
              <p className="text-white" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800 }}>{formatCurrency(metrics.largestLoss)}</p>
            </div>
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(12px, 3vw, 24px)' 
            }}>
              <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Best Streak</p>
              <p className="text-white" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800 }}>{metrics.bestStreak}</p>
            </div>
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(12px, 3vw, 24px)' 
            }}>
              <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Total Trades</p>
              <p className="text-white" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800 }}>{metrics.totalTrades}</p>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div style={{ 
            display: 'grid', 
            gap: 'clamp(16px, 3vw, 24px)', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' 
          }}>
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(16px, 4vw, 24px)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <h3 className="text-white" style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800 }}>Performance Breakdown</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="text-slate-400" style={{ fontSize: 14 }}>Win Rate</span>
                    <span className="text-white" style={{ fontWeight: 700 }}>{metrics.winRate.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 8, background: '#0f172a', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${metrics.winRate}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                  <div style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16 }}>
                    <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Wins</p>
                    <p style={{ color: '#34d399', fontSize: 20, fontWeight: 800 }}>{metrics.wins}</p>
                  </div>
                  <div style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 12, padding: 16 }}>
                    <p className="text-slate-400" style={{ fontSize: 11, marginBottom: 4 }}>Losses</p>
                    <p style={{ color: '#fb923c', fontSize: 20, fontWeight: 800 }}>{metrics.losses}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(16px, 4vw, 24px)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <h3 className="text-white" style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800 }}>Recent Trades</h3>
              </div>
              {metrics.recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No trades yet</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {metrics.recent.map((t, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: 12
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="text-white" style={{ fontWeight: 700 }}>{t.pair}</span>
                        <span className="text-slate-400" style={{ fontSize: 12 }}>
                          {new Date(t.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: t.profit_loss >= 0 ? '#34d399' : '#f87171', fontWeight: 800 }}>
                        {formatCurrency(t.profit_loss)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weekly Summary (simple list) */}
          <div className="card-hover" style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 'clamp(16px, 3vw, 24px)', 
            padding: 'clamp(16px, 4vw, 24px)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h3 className="text-white" style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800 }}>Weekly Summary</h3>
            </div>
            <div style={{ 
              display: 'grid', 
              gap: 'clamp(8px, 2vw, 12px)', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))' 
            }}>
              {metrics.weekly.slice(-4).map(w => (
                <div key={w.week} style={{
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: w.pnl >= 0 ? 'rgba(16,185,129,0.10)' : 'rgba(248,113,113,0.10)',
                  border: w.pnl >= 0 ? '1px solid rgba(16,185,129,0.30)' : '1px solid rgba(248,113,113,0.30)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="text-slate-400" style={{ fontSize: 12, fontWeight: 600 }}>{w.week}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: w.pnl >= 0 ? '#a7f3d0' : '#fecaca' }}>
                      {formatCurrency(w.pnl)}
                    </div>
                    <div className="text-slate-400" style={{ fontSize: 12 }}>{w.days} days</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Calendar + Trade Journal */}
          <div style={{ 
            display: 'grid', 
            gap: 'clamp(16px, 3vw, 24px)', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))' 
          }}>
            {/* Calendar */}
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(16px, 4vw, 24px)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => {
                      const d = new Date(calendarDate);
                      d.setMonth(d.getMonth() - 1);
                      setCalendarDate(d);
                    }}
                    style={{ 
                      padding: 'clamp(6px, 1.5vw, 8px)', 
                      borderRadius: 8, 
                      background: 'rgba(255,255,255,0.08)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      color: '#e5e7eb',
                      fontSize: 'clamp(16px, 3vw, 20px)'
                    }}
                  >
                    ‹
                  </button>
                  <div className="text-white" style={{ fontWeight: 800, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
                    {calendarDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    onClick={() => {
                      const d = new Date(calendarDate);
                      d.setMonth(d.getMonth() + 1);
                      setCalendarDate(d);
                    }}
                    style={{ 
                      padding: 'clamp(6px, 1.5vw, 8px)', 
                      borderRadius: 8, 
                      background: 'rgba(255,255,255,0.08)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      color: '#e5e7eb',
                      fontSize: 'clamp(16px, 3vw, 20px)'
                    }}
                  >
                    ›
                  </button>
                </div>
                <button
                  onClick={() => {
                    const today = new Date();
                    setCalendarDate(today);
                    setSelectedDateKey(today.toISOString().slice(0, 10));
                  }}
                  style={{ 
                    padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px)', 
                    borderRadius: 10, 
                    fontWeight: 700, 
                    background: 'rgba(255,255,255,0.08)', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    color: '#e5e7eb',
                    fontSize: 'clamp(12px, 2vw, 14px)'
                  }}
                >
                  Today
                </button>
              </div>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                  <div key={d} className="text-slate-400" style={{ textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{d}</div>
                ))}
              </div>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {monthMatrix.days.map((d) => {
                  const isSelected = selectedDateKey === d.key;
                  const color = d.pnl > 0 ? '#10b981' : d.pnl < 0 ? '#ef4444' : '#cbd5e1';
                  return (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDateKey(d.key)}
                      style={{
                        height: 'clamp(60px, 12vw, 72px)',
                        borderRadius: 'clamp(8px, 2vw, 12px)',
                        padding: 'clamp(6px, 1.5vw, 8px)',
                        textAlign: 'left',
                        background: isSelected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                        border: isSelected ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.1)',
                        color: d.inCurrentMonth ? '#e5e7eb' : 'rgba(229,231,235,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{d.date.getDate()}</span>
                        {d.count > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 800, color, border: `1px solid ${color}`, borderRadius: 999, padding: '2px 6px' }}>
                            {d.count}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{d.count > 0 ? formatCurrency(d.pnl) : ''}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trade Journal Details */}
            <div className="card-hover" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 'clamp(16px, 3vw, 24px)', 
              padding: 'clamp(16px, 4vw, 24px)', 
              minHeight: 300 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div className="text-white" style={{ fontWeight: 800, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
                  {selectedDateKey ? `Trades on ${selectedDateKey}` : 'Select a date'}
                </div>
                {selectedDateKey && (
                  <div className="text-slate-400" style={{ fontSize: 'clamp(11px, 2vw, 12px)' }}>
                    {selectedTrades.length} trade{selectedTrades.length === 1 ? '' : 's'} •{' '}
                    {formatCurrency(selectedTrades.reduce((s, t) => s + (t.profit_loss || 0), 0))}
                  </div>
                )}
              </div>
              {selectedDateKey && selectedTrades.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {selectedTrades.map((t) => (
                    <div key={t.id || t.timestamp} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: 'clamp(12px, 2.5vw, 16px)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="text-white" style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>{t.pair}</span>
                          <span className="text-slate-400" style={{ fontSize: 'clamp(11px, 2vw, 12px)' }}>{new Date(t.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ 
                          fontWeight: 800, 
                          color: (t.profit_loss || 0) >= 0 ? '#34d399' : '#f87171',
                          fontSize: 'clamp(16px, 3vw, 20px)'
                        }}>
                          {formatCurrency(t.profit_loss || 0)}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
                        <div>
                          <div className="text-slate-400" style={{ fontSize: 10, marginBottom: 2 }}>Type</div>
                          <div className="text-slate-300" style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)' }}>{t.type || '-'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400" style={{ fontSize: 10, marginBottom: 2 }}>Entry</div>
                          <div className="text-slate-300" style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)' }}>{t.entryPrice ? t.entryPrice.toFixed(5) : '-'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400" style={{ fontSize: 10, marginBottom: 2 }}>Exit</div>
                          <div className="text-slate-300" style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)' }}>{t.exitPrice ? t.exitPrice.toFixed(5) : '-'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400" style={{ fontSize: 10, marginBottom: 2 }}>Confidence</div>
                          <div className="text-slate-400" style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 700 }}>
                            {(t.confidence ?? 0) > 0 ? `${Math.round((t.confidence || 0) * 100)}%` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No trades for the selected date</div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default PerformanceDashboard;


