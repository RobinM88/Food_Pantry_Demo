import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  Divider,
  Stack,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Phone as PhoneIcon,
  ViewList as QueueIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material'
import { useOfflineStatus } from '../hooks/useOfflineStatus'
import { OfflineStatus } from './OfflineStatus'

const drawerWidth = 240

interface LayoutProps {
  children: ReactNode
}

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Clients', icon: <PeopleIcon />, path: '/clients' },
  { text: 'Orders', icon: <OrdersIcon />, path: '/orders' },
  { text: 'Daily Queue', icon: <QueueIcon />, path: '/daily-queue' },
  { text: 'Phone Logs', icon: <PhoneIcon />, path: '/phone-logs' },
  { text: 'Family Connections', icon: <GroupsIcon />, path: '/family-connections' },
]

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' })
  const { offlineModeEnabled } = useOfflineStatus()
  const navigate = useNavigate()
  const location = useLocation()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path)
              setMobileOpen(false)
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      {offlineModeEnabled && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <OfflineStatus />
          </Box>
        </>
      )}
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Food Pantry Client Management
          </Typography>
          
          {/* Add offline status indicator in app bar */}
          {offlineModeEnabled && (
            <Stack direction="row" spacing={2} alignItems="center">
              <OfflineStatus compact />
            </Stack>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
        
        {/* General notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification}
            severity={notification.severity}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  )
} 