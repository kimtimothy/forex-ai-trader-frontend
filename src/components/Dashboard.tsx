import React from 'react';
import ActivePositions from './ActivePositions';
import TradeHistory from './TradeHistory';
import PairStats from './PairStats';
import BotControl from './BotControl';

const Dashboard: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px'
    }}>
      <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
        <BotControl />
      </div>
      <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
        <ActivePositions />
      </div>
      <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
        <PairStats />
      </div>
      <div className="fade-in-up" style={{ animationDelay: '0.4s' }}>
        <TradeHistory />
      </div>
    </div>
  );
};

export default Dashboard;
