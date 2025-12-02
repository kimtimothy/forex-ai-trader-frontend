import React, { useEffect } from 'react';
import './App.css';
import './mobile-responsive.css'; // Mobile responsive styles for all components
import Dashboard from './components/Dashboard';
import MLInsightsDashboard from './components/MLInsightsDashboard';
import PerformanceDashboard from './components/PerformanceDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import './utils/errorHandler'; // Initialize global error handling

function App() {
  useEffect(() => {
    // Log app initialization
    console.log('🚀 Forex AI Trading Bot initialized');
    
    // Check if manifest is loading correctly
    fetch('/manifest.json')
      .then(response => {
        if (response.ok) {
          console.log('✅ Manifest.json loaded successfully');
        } else {
          console.warn('⚠️ Manifest.json not found - will be fixed on next deployment');
        }
      })
      .catch(error => {
        console.warn('⚠️ Manifest.json loading error (will be fixed on next deployment):', error);
      });
  }, []);

  return (
    <div className="App">
      <NavBar />
      <main>
        <Routes>
          <Route
            path="/"
            element={(
              <>
                <Dashboard />
                <div style={{ marginTop: '40px' }}>
                  <MLInsightsDashboard />
                </div>
              </>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <div style={{ marginBottom: 40 }}>
                <PerformanceDashboard />
              </div>
            )}
          />
          <Route
            path="/analytics"
            element={(
              <div style={{ marginBottom: 40 }}>
                <AnalyticsDashboard />
              </div>
            )}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
