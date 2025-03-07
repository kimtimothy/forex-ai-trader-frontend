import React from 'react';
import Dashboard from './components/Dashboard';
import { CssBaseline, Container, ThemeProvider, createTheme } from '@mui/material';

// Create a theme with better visibility
const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ paddingTop: 4 }}>
        <h1>Trading Dashboard</h1>
        <Dashboard />
      </Container>
    </ThemeProvider>
  );
}

export default App;
