import { db } from './indexedDB';
import { config } from '../config';

/**
 * Service to handle synchronization of offline data when the application comes back online
 */
export class SyncManager {
  private static instance: SyncManager;
  private isSyncing = false;
  private syncAttempts = 0;
  private maxSyncAttempts = 3;
  private retryTimeout: NodeJS.Timeout | null = null;
  private listeners: ((status: SyncManagerStatus) => void)[] = [];
  private currentStatus: SyncManagerStatus = { 
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingItems: 0,
    syncError: null
  };

  private constructor() {
    // Private constructor to prevent multiple instances
    if (config.features.offlineMode) {
      this.setupEventListeners();
      this.updatePendingCount();
    }
  }

  /**
   * Get the singleton instance of the SyncManager
   */
  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Set up event listeners for online/offline events
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    window.addEventListener('load', this.checkIfOnline.bind(this));
    
    // Check every minute for pending items that may have been missed
    setInterval(this.attemptSync.bind(this), 60000);
  }
  
  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.updateStatus({ isOnline: false });
    console.log('Network connection lost. App is now in offline mode.');
    
    // Cancel any pending retries
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Handle the online event
   */
  private handleOnline(): void {
    this.updateStatus({ isOnline: true });
    console.log('Network connection restored, starting sync...');
    this.attemptSync();
  }

  /**
   * Check if online on initial load
   */
  private checkIfOnline(): void {
    this.updateStatus({ isOnline: navigator.onLine });
    
    if (navigator.onLine) {
      console.log('Application loaded online, checking for pending sync items...');
      this.attemptSync();
    } else {
      console.log('Application loaded offline. Working in offline mode.');
    }
  }
  
  /**
   * Update the status and notify listeners
   */
  private updateStatus(partialStatus: Partial<SyncManagerStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...partialStatus };
    this.notifyListeners();
  }
  
  /**
   * Notify all listeners of the current status
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }
  
  /**
   * Subscribe to sync status changes
   */
  public subscribe(listener: (status: SyncManagerStatus) => void): () => void {
    this.listeners.push(listener);
    // Immediately notify with current status
    listener(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Get the current sync status
   */
  public getStatus(): SyncManagerStatus {
    return this.currentStatus;
  }
  
  /**
   * Force a sync attempt
   */
  public forceSync(): Promise<void> {
    this.syncAttempts = 0;
    return this.syncData();
  }

  /**
   * Attempt to sync with retry logic
   */
  private async attemptSync(): Promise<void> {
    // Skip sync attempts in demo mode
    if (config.app.isDemoMode) {
      // No need to log every attempt in demo mode as it would flood the console
      return;
    }
    
    // Always update the pending count first
    await this.updatePendingCount();
    
    if (!navigator.onLine || !config.features.offlineMode || this.currentStatus.pendingItems === 0) {
      return;
    }
    
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }
    
    try {
      await this.syncData();
      this.syncAttempts = 0;
    } catch (error) {
      this.syncAttempts++;
      console.error(`Sync attempt ${this.syncAttempts} failed:`, error);
      
      if (this.syncAttempts < this.maxSyncAttempts) {
        // Exponential backoff for retries (2s, 4s, 8s...)
        const retryDelay = Math.pow(2, this.syncAttempts) * 1000;
        console.log(`Will retry sync in ${retryDelay / 1000} seconds`);
        
        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
        }
        
        this.retryTimeout = setTimeout(() => {
          this.attemptSync();
        }, retryDelay);
      } else {
        console.error('Max sync attempts reached. Will try again when online status changes.');
        this.updateStatus({ syncError: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  
  /**
   * Update the pending items count
   */
  private async updatePendingCount(): Promise<void> {
    if (!config.features.offlineMode) return;
    
    try {
      const count = await db.getPendingSyncCount();
      this.updateStatus({ pendingItems: count });
    } catch (error) {
      console.error('Error checking pending sync count:', error);
    }
  }

  /**
   * Sync data with the server
   */
  public async syncData(): Promise<void> {
    // Skip sync in demo mode
    if (config.app.isDemoMode) {
      console.log('Demo mode: Skipping sync operation in SyncManager');
      return;
    }

    if (!config.features.offlineMode) {
      console.log('Offline mode is disabled, skipping sync');
      return;
    }

    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    if (!navigator.onLine) {
      console.log('Still offline, skipping sync');
      return;
    }

    try {
      this.isSyncing = true;
      this.updateStatus({ isSyncing: true, syncError: null });
      console.log('Starting data synchronization...');
      
      // Check for pending sync items before processing
      const pendingCount = await db.getPendingSyncCount();
      console.log(`Starting sync process with ${pendingCount} pending items`);
      
      if (pendingCount === 0) {
        console.log('No items to sync');
        // Double-check by looking for offline-created items directly
        try {
          const offlineOrders = await this.checkForOfflineOrders();
          if (offlineOrders.length > 0) {
            console.log(`Found ${offlineOrders.length} offline orders that weren't in sync queue:`, offlineOrders);
            // We should manually add these to the sync queue
            for (const order of offlineOrders) {
              console.log(`Manually adding offline order ${order.id} to sync queue`);
              // This is a temporary fix - we're directly calling the method on db
              await db['addToSyncQueue']('create', 'orders', order);
            }
            // Now process the sync queue again
            await db.processSyncQueue();
          } else {
            console.log('No offline orders found outside sync queue');
          }
        } catch (err) {
          console.error('Error checking for offline orders:', err);
        }
      } else {
        // Process the sync queue
        await db.processSyncQueue();
      }
      
      console.log('Synchronization complete');
      this.updateStatus({ 
        isSyncing: false, 
        lastSyncTime: new Date().toISOString() 
      });
      
      // Update the pending count after sync
      await this.updatePendingCount();
    } catch (error) {
      console.error('Error during synchronization:', error);
      this.updateStatus({ 
        isSyncing: false, 
        syncError: error instanceof Error ? error.message : String(error)
      });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Helper method to check for offline-created orders that might not be in the sync queue
   */
  private async checkForOfflineOrders(): Promise<any[]> {
    try {
      const orders = await db.getAll('orders');
      return orders.filter(order => 
        order && 
        typeof order === 'object' && 
        'created_offline' in order && 
        order.created_offline === true
      );
    } catch (error) {
      console.error('Error checking for offline orders:', error);
      return [];
    }
  }

  /**
   * Get the number of pending sync items
   */
  public async getPendingSyncCount(): Promise<number> {
    if (!config.features.offlineMode) return 0;
    return await db.getPendingSyncCount();
  }
}

// Interface for sync manager status
export interface SyncManagerStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: string | null;
  syncError: string | null;
}

// Initialize the sync manager
export const syncManager = SyncManager.getInstance(); 