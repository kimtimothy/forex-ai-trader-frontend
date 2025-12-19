import React, { useEffect, useMemo, useState } from 'react';
import { tradingApi } from '../services/api';

type Config = {
  risk_per_trade: number;
  max_positions: number;
  min_confluence_score: number; // 0-100
  min_model_confidence: number; // 0-1
  max_spread_pips: number; // Maximum spread in pips
  enable_partial_profits?: boolean; // NEW: PDF alignment
  enable_position_scaling?: boolean; // NEW: PDF alignment
  [key: string]: any;
};

const labelStyle: React.CSSProperties = { fontSize: 12, color: '#94a3b8', fontWeight: 700 };
const valueStyle: React.CSSProperties = { fontSize: 14, color: '#e2e8f0', fontWeight: 800 };

const ThresholdSettings: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const modelConfidencePct = useMemo(
    () => Math.round(((config?.min_model_confidence ?? 0.55) || 0) * 100),
    [config]
  );
  const confluencePct = useMemo(
    () => Math.round(config?.min_confluence_score ?? 80),
    [config]
  );
  const maxSpreadPips = useMemo(
    () => Number((config?.max_spread_pips ?? 2.0).toFixed(1)),
    [config]
  );

  useEffect(() => {
    (async () => {
      try {
        const cfg = await tradingApi.getConfig();
        setConfig(cfg);
      } catch {
        setMessage('Failed to load settings');
      }
    })();
  }, []);

  const update = async (partial: Partial<Config>) => {
    if (!config) return;
    const next = { ...config, ...partial };
    setConfig(next);
  };

  const save = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const payload = {
        min_confluence_score: Math.min(100, Math.max(0, Math.round(config.min_confluence_score))),
        min_model_confidence: Math.min(1, Math.max(0, Number(config.min_model_confidence))),
        max_spread_pips: Math.min(10, Math.max(0.5, Number(config.max_spread_pips))),
        enable_partial_profits: config.enable_partial_profits ?? true,
        enable_position_scaling: config.enable_position_scaling ?? true,
      };
      console.log('💾 Saving thresholds:', payload);
      const saved = await tradingApi.updateConfig(payload);
      console.log('✅ Saved response:', saved);
      setConfig(saved);
      setMessage('Settings saved');
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('❌ Save failed:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="card-hover" style={{ 
        background: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: 'clamp(16px, 3vw, 24px)', 
        padding: 'clamp(16px, 4vw, 24px)' 
      }}>
        <div style={{ color: '#94a3b8' }}>Loading settings…</div>
      </div>
    );
  }

  return (
    <div className="card-hover" style={{ 
      background: 'rgba(255,255,255,0.05)', 
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: 'clamp(16px, 3vw, 24px)', 
      padding: 'clamp(16px, 4vw, 24px)' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div className="text-white" style={{ fontWeight: 800, fontSize: 'clamp(16px, 3vw, 18px)' }}>Strategy Thresholds</div>
        {message && <div style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: '#10b981', fontWeight: 700 }}>{message}</div>}
      </div>

      <div style={{ 
        display: 'grid', 
        gap: 'clamp(12px, 3vw, 16px)', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))' 
      }}>
        {/* Confluence threshold */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={labelStyle}>Confluence Minimum</span>
            <span style={valueStyle}>{confluencePct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={confluencePct}
            onChange={(e) => update({ min_confluence_score: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>
            Confluence Grading System:
            <ul style={{ margin: '6px 0 0 16px' }}>
              <li>90%+: Grade A (Elite)</li>
              <li>80%+: Grade B (Strong)</li>
              <li>70%+: Grade C (Good)</li>
              <li>60%+: Grade D (Moderate)</li>
            </ul>
            <div style={{ marginTop: 6, fontSize: 11, color: '#10b981' }}>
              💡 Recommend: Take only Grade A/B setups
            </div>
          </div>
        </div>

        {/* Model confidence threshold */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={labelStyle}>Model Confidence Minimum</span>
            <span style={valueStyle}>{modelConfidencePct}%</span>
          </div>
          <input
            type="range"
            min={40}
            max={80}
            value={modelConfidencePct}
            onChange={(e) => update({ min_model_confidence: Number(e.target.value) / 100 })}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>
            Recommended:
            <ul style={{ margin: '6px 0 0 16px' }}>
              <li>55–65%: Balanced</li>
              <li>≥70%: Very selective</li>
              <li>Dynamic adjusts internally</li>
            </ul>
          </div>
        </div>

        {/* Max spread threshold */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={labelStyle}>Max Spread (pips)</span>
            <span style={valueStyle}>{maxSpreadPips}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={maxSpreadPips}
            onChange={(e) => update({ max_spread_pips: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>
            Recommended:
            <ul style={{ margin: '6px 0 0 16px' }}>
              <li>2–3 pips: Major pairs</li>
              <li>4–6 pips: Cross pairs</li>
              <li>Higher = more trades</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PDF Strategy Toggles */}
      <div style={{ 
        gridColumn: '1 / -1',
        marginTop: 16,
        background: 'rgba(99,102,241,0.08)', 
        border: '1px solid rgba(99,102,241,0.2)', 
        borderRadius: 16, 
        padding: 16 
      }}>
        <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#c7d2fe' }}>
          📄 PDF "Set and Forget" Strategy Options
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.enable_partial_profits ?? true}
              onChange={(e) => update({ enable_partial_profits: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e7ff' }}>Partial Profits</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Take 50% at 1.5R (uncheck for strict PDF)</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.enable_position_scaling ?? true}
              onChange={(e) => update({ enable_position_scaling: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e7ff' }}>Position Scaling</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Add to winners at 1R/2R (uncheck for strict PDF)</div>
            </div>
          </label>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: '#818cf8', fontStyle: 'italic' }}>
          💡 PDF recommends: Both OFF for "Set and Forget" strategy. Enable for advanced trade management.
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
            borderRadius: 12,
            border: '1px solid rgba(16,185,129,0.35)',
            background: 'rgba(16,185,129,0.12)',
            color: '#a7f3d0',
            fontWeight: 800,
            fontSize: 'clamp(13px, 2.5vw, 14px)',
          }}
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default ThresholdSettings;


