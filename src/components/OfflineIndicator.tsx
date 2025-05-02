import React from 'react';
import { Alert, Snackbar, Badge, IconButton, Tooltip } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { syncService } from '../services/syncService';

/**
 * Component to show offline status and pending sync info
 * This can be included in the Layout component
 */
export default function OfflineIndicator() {
  const { isOnline, pendingSyncCount, offlineModeEnabled } = useOfflineStatus();
  const [syncTriggered, setSyncTriggered] = React.useState(false);
  
  // Don't render anything if offline mode is disabled
  if (!offlineModeEnabled) {
    return null;
  }

  // Handle manual sync
  const handleSync = async () => {
    setSyncTriggered(true);
    try {
      await syncService.forceSync();
    } catch (error) {
      console.error('Error during manual sync:', error);
    }
    // Reset after 2 seconds
    setTimeout(() => setSyncTriggered(false), 2000);
  };
  
  return (
    <>
      {/* Offline alert */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          icon={<WifiOffIcon />} 
          severity="warning"
          sx={{ 
            width: '100%',
            '& .MuiAlert-icon': {
              color: 'warning.main',
            }
          }}
        >
          You are currently offline. Changes will sync when you reconnect.
        </Alert>
      </Snackbar>
      
      {/* Pending changes indicator */}
      {pendingSyncCount > 0 && (
        <Tooltip title={`${pendingSyncCount} changes pending to sync`}>
          <span>
            <IconButton 
              color="primary" 
              onClick={handleSync}
              disabled={!isOnline || syncTriggered}
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
            >
              <Badge badgeContent={pendingSyncCount} color="primary">
                <SyncIcon sx={{ animation: syncTriggered ? 'spin 1s linear infinite' : 'none' }} />
              </Badge>
            </IconButton>
          </span>
        </Tooltip>
      )}
      
      {/* Animation for sync icon */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
} 