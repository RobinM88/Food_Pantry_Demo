import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncManagerStatus } from '../lib/syncManager';
import { config } from '../config';

interface OfflineStatusResult {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTime: string | null;
  syncError: string | null;
  offlineModeEnabled: boolean;
  // New fields
  forceSyncData: () => Promise<void>;
}

/**
 * Hook to manage offline status and pending sync items
 */
export function useOfflineStatus(): OfflineStatusResult {
  const [status, setStatus] = useState<SyncManagerStatus>(syncManager.getStatus());
  const offlineModeEnabled = config.features.offlineMode;
  // This is private to the hook and not exposed in the returned object
  const [hasOfflineData, setHasOfflineData] = useState<boolean>(status.pendingItems > 0);

  // Force sync function that components can call
  const forceSyncData = useCallback(async () => {
    if (status.isOnline && offlineModeEnabled) {
      try {
        await syncManager.forceSync();
      } catch (error) {
        console.error('Force sync failed:', error);
      }
    }
  }, [status.isOnline, offlineModeEnabled]);

  useEffect(() => {
    // Set up error handling for fetch errors when offline
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // More comprehensive detection of network errors to suppress when offline
      const errorString = args.join(' ');
      
      // Don't log network errors when offline
      if (!status.isOnline && (
        // Common network error patterns
        errorString.includes('Failed to fetch') || 
        errorString.includes('NetworkError') ||
        errorString.includes('ERR_INTERNET_DISCONNECTED') ||
        errorString.includes('net::ERR') ||
        errorString.includes('fetch failed') ||
        errorString.includes('TypeError: Failed to fetch') ||
        errorString.includes('Network request failed') ||
        // Supabase-specific errors
        errorString.includes('supabase') && (
          errorString.includes('connect') || 
          errorString.includes('fetch') ||
          errorString.includes('network')
        ) ||
        // Check for Supabase URL to identify API calls
        (errorString.includes('https://') && errorString.includes('.supabase.co/'))
      )) {
        // Optionally log a more simplified message for debugging
        if (import.meta.env.DEV) {
          console.warn('🔌 Network request suppressed while offline');
        }
        return;
      }
      
      // Let through non-network related errors
      originalConsoleError.apply(console, args);
    };

    // Subscribe to sync manager status updates
    const unsubscribe = syncManager.subscribe((newStatus) => {
      setStatus(newStatus);
      setHasOfflineData(newStatus.pendingItems > 0);
    });

    return () => {
      unsubscribe();
      console.error = originalConsoleError; // Restore original error handler
    };
  }, []);

  // Effects based on online/offline transitions
  useEffect(() => {
    if (status.isOnline && hasOfflineData) {
      // Show a notification when we come back online with pending data
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Back Online', {
          body: `You're back online. Syncing ${status.pendingItems} pending items...`,
          icon: '/icons/icon-192x192.png'
        });
      }
    } else if (!status.isOnline) {
      // Maybe show a quick notification that we're offline now
      console.log('App is now offline. Offline mode is ' + 
                 (offlineModeEnabled ? 'enabled' : 'disabled'));
    }
  }, [status.isOnline, hasOfflineData, status.pendingItems, offlineModeEnabled]);

  return {
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    pendingSyncCount: status.pendingItems,
    lastSyncTime: status.lastSyncTime,
    syncError: status.syncError,
    offlineModeEnabled,
    forceSyncData
  };
} 