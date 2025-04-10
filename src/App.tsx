import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { theme } from './theme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Clients from './pages/Clients'
import Orders from './pages/Orders'
import PhoneLogs from './pages/PhoneLogs'
import DailyQueue from './pages/DailyQueue'
import FamilyConnections from './pages/FamilyConnections'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardIcon from '@mui/icons-material/Dashboard';
import QueueIcon from '@mui/icons-material/Queue';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import GroupsIcon from '@mui/icons-material/Groups';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/clients/*" element={<Clients />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/daily-queue" element={<DailyQueue />} />
              <Route path="/phone-logs" element={<PhoneLogs />} />
              <Route path="/family-connections" element={<FamilyConnections />} />
            </Routes>
          </Layout>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App 