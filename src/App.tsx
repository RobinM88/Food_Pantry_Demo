import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Clients from './pages/Clients'
import Orders from './pages/Orders'
import PhoneLogs from './pages/PhoneLogs'
import DailyQueue from './pages/DailyQueue'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clients/*" element={<Clients />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/daily-queue" element={<DailyQueue />} />
          <Route path="/phone-logs" element={<PhoneLogs />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  )
}

export default App 