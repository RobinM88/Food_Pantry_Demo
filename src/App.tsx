import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Clients from './pages/Clients';
import Orders from './pages/Orders';
import DailyQueue from './pages/DailyQueue';
import PhoneLogs from './pages/PhoneLogs';
import FamilyConnections from './pages/FamilyConnections';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ErrorBoundary from './components/ErrorBoundary';
import { OfflineStatus } from './components/OfflineStatus';
import { useOfflineStatus } from './hooks/useOfflineStatus';

function App() {
  // Initialize offline status tracking to ensure online/offline detection is active
  useOfflineStatus();
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline />
            <Layout>
              <ErrorBoundary>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/clients/*"
                    element={
                      <ProtectedRoute>
                        <Clients />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/*"
                    element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/phone-logs/*"
                    element={
                      <ProtectedRoute>
                        <PhoneLogs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/family-connections"
                    element={
                      <ProtectedRoute>
                        <FamilyConnections />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/daily-queue"
                    element={
                      <ProtectedRoute>
                        <DailyQueue />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ErrorBoundary>
              <OfflineStatus />
            </Layout>
          </LocalizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 