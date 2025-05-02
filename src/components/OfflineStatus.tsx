import React, { useState } from 'react';
import { 
  Chip, 
  Box, 
  IconButton, 
  Tooltip, 
  Badge, 
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { formatDistanceToNow } from 'date-fns';

interface OfflineStatusProps {
  compact?: boolean;
}

/**
 * Component to display the current offline status and allow manual syncing
 */
export const OfflineStatus: React.FC<OfflineStatusProps> = ({ compact = false }) => {
  const { 
    isOnline, 
    isSyncing, 
    pendingSyncCount, 
    lastSyncTime, 
    syncError,
    offlineModeEnabled,
    forceSyncData
  } = useOfflineStatus();

  const [showDetails, setShowDetails] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  // If offline mode is disabled, don't show anything
  if (!offlineModeEnabled) return null;

  const handleSyncClick = async () => {
    if (!isOnline) {
      setSnackbarMessage('You are offline. Cannot sync data.');
      setSnackbarSeverity('warning');
      setShowSnackbar(true);
      return;
    }

    if (isSyncing) {
      setSnackbarMessage('Sync already in progress.');
      setSnackbarSeverity('info');
      setShowSnackbar(true);
      return;
    }

    try {
      await forceSyncData();
      setSnackbarMessage('Sync completed successfully.');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Sync failed. Please try again later.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  // Render compact version (for app bars, etc.)
  if (compact) {
    return (
      <>
        <Box display="flex" alignItems="center">
          {!isOnline ? (
            <Tooltip title="You are offline. Changes will be saved locally.">
              <Chip
                size="small"
                icon={<CloudOffIcon fontSize="small" />}
                label="Offline"
                color="warning"
                onClick={() => setShowDetails(true)}
              />
            </Tooltip>
          ) : pendingSyncCount > 0 ? (
            <Tooltip title={`${pendingSyncCount} items waiting to sync`}>
              <Badge badgeContent={pendingSyncCount} color="primary" max={99}>
                <IconButton size="small" onClick={handleSyncClick} disabled={isSyncing}>
                  {isSyncing ? <CircularProgress size={20} /> : <CloudSyncIcon color="primary" />}
                </IconButton>
              </Badge>
            </Tooltip>
          ) : null}
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar 
          open={showSnackbar} 
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbarSeverity} 
            onClose={() => setShowSnackbar(false)}
            variant="filled"
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Detailed dialog */}
        <SyncDetailsDialog
          open={showDetails}
          onClose={() => setShowDetails(false)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingSyncCount={pendingSyncCount}
          lastSyncTime={lastSyncTime}
          syncError={syncError}
          onSyncClick={handleSyncClick}
        />
      </>
    );
  }

  // Render full version
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        mt: 2,
        border: 1, 
        borderColor: isOnline ? 'primary.light' : 'warning.light',
        borderRadius: 1,
        backgroundColor: isOnline ? 'primary.50' : 'warning.50',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
        {isOnline ? (
          <CloudDoneIcon color="primary" sx={{ mr: 1 }} />
        ) : (
          <CloudOffIcon color="warning" sx={{ mr: 1 }} />
        )}
        
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {isOnline ? 'Online' : 'Offline Mode'}
          </Typography>
          
          {!isOnline && (
            <Typography variant="body2" color="text.secondary">
              Changes will be saved locally and synced when you're back online.
            </Typography>
          )}
          
          {isOnline && pendingSyncCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {pendingSyncCount} {pendingSyncCount === 1 ? 'item' : 'items'} waiting to sync.
            </Typography>
          )}
          
          {isOnline && lastSyncTime && (
            <Typography variant="caption" color="text.secondary">
              Last synced: {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
            </Typography>
          )}
        </Box>
      </Box>
      
      {isOnline && pendingSyncCount > 0 && (
        <Tooltip title="Sync data now">
          <IconButton 
            onClick={handleSyncClick} 
            disabled={isSyncing}
            color="primary"
          >
            {isSyncing ? <CircularProgress size={24} /> : <SyncIcon />}
          </IconButton>
        </Tooltip>
      )}
      
      {syncError && (
        <Tooltip title={`Sync error: ${syncError}`}>
          <IconButton color="error">
            <ErrorIcon />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={showSnackbar} 
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbarSeverity} 
          onClose={() => setShowSnackbar(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper component for the details dialog
interface SyncDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTime: string | null;
  syncError: string | null;
  onSyncClick: () => void;
}

const SyncDetailsDialog: React.FC<SyncDetailsDialogProps> = ({
  open,
  onClose,
  isOnline,
  isSyncing,
  pendingSyncCount,
  lastSyncTime,
  syncError,
  onSyncClick
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isOnline ? 'Online Status' : 'Offline Mode'}
      </DialogTitle>
      <DialogContent>
        <List>
          <ListItem>
            <ListItemIcon>
              {isOnline ? <CloudDoneIcon color="primary" /> : <CloudOffIcon color="warning" />}
            </ListItemIcon>
            <ListItemText 
              primary={isOnline ? 'Connected' : 'Disconnected'} 
              secondary={isOnline ? 'You have an active internet connection' : 'Working in offline mode'} 
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CloudSyncIcon color={pendingSyncCount > 0 ? 'primary' : 'disabled'} />
            </ListItemIcon>
            <ListItemText 
              primary="Pending Changes" 
              secondary={
                pendingSyncCount > 0 
                  ? `${pendingSyncCount} ${pendingSyncCount === 1 ? 'item' : 'items'} waiting to sync` 
                  : 'No pending changes'
              } 
            />
          </ListItem>
          
          {lastSyncTime && (
            <>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Last Synchronized" 
                  secondary={formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })} 
                />
              </ListItem>
            </>
          )}
          
          {syncError && (
            <>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Sync Error" 
                  secondary={syncError} 
                />
              </ListItem>
            </>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        {isOnline && pendingSyncCount > 0 && (
          <Button 
            onClick={onSyncClick} 
            disabled={isSyncing}
            startIcon={isSyncing ? <CircularProgress size={16} /> : <SyncIcon />}
            color="primary"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 