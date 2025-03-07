import React from 'react';
import { Grid } from '@mui/material';
import ActivePositions from './ActivePositions';
import TradeHistory from './TradeHistory';
import PairStats from './PairStats';
import BotControl from './BotControl';

const Dashboard: React.FC = () => {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <BotControl />
            </Grid>
            <Grid item xs={12}>
                <ActivePositions />
            </Grid>
            <Grid item xs={12}>
                <PairStats />
            </Grid>
            <Grid item xs={12}>
                <TradeHistory />
            </Grid>
        </Grid>
    );
};

export default Dashboard;