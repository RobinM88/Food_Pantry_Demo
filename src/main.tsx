import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { syncManager } from './lib/syncManager'
import { seedDemoData } from './utils/demoData'
import { config } from './config'

// Initialize the sync manager
syncManager;

// Seed demo data if in demo mode
if (config.app.isDemoMode) {
  seedDemoData();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
) 