import { db } from '../lib/indexedDB';
import { config } from '../config';
import { isSupabaseConnected } from '../lib/supabase';

/**
 * Service for handling background synchronization and online/offline status
 */
export class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInterval: number | null = null;
  private onlineStatusChangedCallbacks: ((isOnline: boolean) => void)[] = [];

  constructor() {
    // Initialize only if offline mode is enabled
    if (config.features.offlineMode) {
      this.initialize();
    }
  }

  /**
   * Initialize the sync service
   */
  private initialize(): void {
    // Set up online/offline event listeners
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));

    // Start sync loop if online at startup
    if (this.isOnline) {
      this.startSyncLoop();
    }
  }

  /**
   * Handle online status changes
   */
  private async handleOnlineStatusChange() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;

    console.log('Network status changed, navigatorOnline:', this.isOnline);

    // Double-check online status with a real request after a short delay
    // to allow network to stabilize
    if (this.isOnline) {
      try {
        // Wait a bit for network to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.isOnline = await isSupabaseConnected();
        console.log('Connection to Supabase checked, result:', this.isOnline);
      } catch (error) {
        console.error('Error checking Supabase connection:', error);
        this.isOnline = false;
      }
    }

    // Only notify if status actually changed
    if (wasOnline !== this.isOnline) {
      console.log('Online status changed:', this.isOnline ? 'ONLINE' : 'OFFLINE');
      
      // Notify all subscribers
      this.onlineStatusChangedCallbacks.forEach(callback => {
        try {
          callback(this.isOnline);
        } catch (error) {
          console.error('Error in online status change callback:', error);
        }
      });

      if (this.isOnline) {
        // We're back online, start sync loop
        console.log('Back online, starting sync process...');
        this.startSyncLoop();
      } else {
        // We're offline, stop sync loop
        console.log('Went offline, stopping sync process');
        this.stopSyncLoop();
      }
    }
  }

  /**
   * Start the synchronization loop
   */
  private startSyncLoop(): void {
    // Don't start another loop if one is already running
    if (this.syncInterval !== null) {
      console.log('Sync loop already running, not starting another');
      return;
    }

    // Process the sync queue immediately
    console.log('Starting immediate sync...');
    this.syncData();

    // Then set up interval for periodic sync
    console.log('Setting up periodic sync every 30 seconds');
    this.syncInterval = window.setInterval(() => {
      this.syncData();
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Stop the synchronization loop
   */
  private stopSyncLoop(): void {
    if (this.syncInterval !== null) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform data synchronization
   */
  private async syncData(): Promise<void> {
    if (!this.isOnline) {
      console.log('Not online, skipping sync');
      return;
    }

    try {
      console.log('Starting sync process...');
      const pendingCount = await db.getPendingSyncCount();
      console.log(`Found ${pendingCount} items to sync`);
      
      if (pendingCount > 0) {
        await db.processSyncQueue();
        
        // Verify sync completion
        const remainingCount = await db.getPendingSyncCount();
        console.log(`Sync completed. ${pendingCount - remainingCount} items processed. ${remainingCount} items remaining.`);
        
        // Force a refresh of the UI by notifying status has changed
        this.notifyStatusChanged();
      } else {
        console.log('No items to sync');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  /**
   * Notify all listeners that status has changed
   */
  private notifyStatusChanged(): void {
    // Create a copy to avoid issues if callbacks modify the array
    const callbacks = [...this.onlineStatusChangedCallbacks];
    callbacks.forEach(callback => {
      try {
        // Pass current online status
        callback(this.isOnline);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Register callback for online status changes
   */
  onOnlineStatusChanged(callback: (isOnline: boolean) => void): () => void {
    this.onlineStatusChangedCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.onlineStatusChangedCallbacks = this.onlineStatusChangedCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Force a synchronization
   */
  async forceSync(): Promise<void> {
    console.log('Force sync requested');
    return this.syncData();
  }

  /**
   * Get count of pending sync items
   */
  async getPendingSyncCount(): Promise<number> {
    return db.getPendingSyncCount();
  }
}

// Create a singleton instance
export const syncService = new SyncService(); 