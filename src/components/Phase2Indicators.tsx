import React, { useEffect, useState } from 'react';
import { TradeManagementDetails } from '../types/types';

interface Phase2IndicatorsProps {
  tradeId: string;
}

const Phase2Indicators: React.FC<Phase2IndicatorsProps> = ({ tradeId }) => {
  const [details, setDetails] = useState<TradeManagementDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/trade_management/${tradeId}`);
        if (response.ok) {
          const data = await response.json();
          setDetails(data);
        }
      } catch (error) {
        console.error('Error fetching trade management details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    // Update every 30 seconds
    const interval = setInterval(fetchDetails, 30000);
    return () => clearInterval(interval);
  }, [tradeId]);

  if (loading || !details) return null;

  const hasActivity = 
    details.partial_profits_taken.length > 0 ||
    details.scale_ins.length > 0 ||
    details.trailing_stop_updates > 0;

  if (!hasActivity) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
      {/* Partial Profits */}
      {details.partial_profits_taken.length > 0 && (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: '#27ae60',
            color: 'white',
            fontSize: '0.75em',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={`Took profits at: ${details.partial_profits_taken.map(p => `${p.r_multiple}R`).join(', ')}`}
        >
          💰 {details.partial_profits_taken.length}x Profit
        </span>
      )}

      {/* Trailing Stop */}
      {details.trailing_stop_updates > 0 && (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: '#3498db',
            color: 'white',
            fontSize: '0.75em',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={`Stop updated ${details.trailing_stop_updates} times`}
        >
          📈 Trailing Stop ({details.trailing_stop_updates})
        </span>
      )}

      {/* Scale Ins */}
      {details.scale_ins.length > 0 && (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: '#9b59b6',
            color: 'white',
            fontSize: '0.75em',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={`Scaled in at: ${details.scale_ins.map(s => `${s.r_multiple}R`).join(', ')}`}
        >
          ⬆️ Scaled {details.scale_ins.length}x
        </span>
      )}

      {/* Current R Multiple */}
      {details.current_r_multiple > 0 && (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: details.current_r_multiple >= 2 ? '#27ae60' : '#95a5a6',
            color: 'white',
            fontSize: '0.75em',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {details.current_r_multiple.toFixed(1)}R
        </span>
      )}
    </div>
  );
};

export default Phase2Indicators;

