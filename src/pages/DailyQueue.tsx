import { useState, useEffect } from 'react';
import { Box, Button, Tabs, Tab, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import DailyQueueDashboard from '../features/orders/DailyQueueDashboard';
import PendingApprovalsDashboard from '../features/orders/PendingApprovalsDashboard';
import OrderDetails from '../features/orders/OrderDetails';
import { OrderForm } from '../features/orders/OrderForm';
import { Order, Client } from '../types';
import { OrderService } from '../services/order.service';
import { ClientService } from '../services/client.service';
import { NewOrder } from '../types/order';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import OfflineIndicator from '../components/OfflineIndicator';

type ViewMode = 'dashboard' | 'edit' | 'view';

interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function DailyQueue() {
  console.log('DailyQueue component rendered');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Get offline status
  const { isOnline } = useOfflineStatus();

  const loadData = async () => {
    console.log('loadData called');
    try {
      setLoading(true);
      const [ordersData, clientsData] = await Promise.all([
        OrderService.getAll(),
        ClientService.getAll()
      ]);
      console.log('Raw orders data:', ordersData);
      
      // Debug log for offline orders
      const offlineOrders = ordersData.filter(order => order.created_offline === true);
      console.log(`Found ${offlineOrders.length} offline orders:`, offlineOrders);
      
      console.log('Raw clients data:', clientsData);
      setOrders(ordersData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({
        open: true,
        message: 'Error loading data',
        severity: 'error'
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add logging for state changes
  useEffect(() => {
    console.log('Orders state updated:', orders);
  }, [orders]);

  useEffect(() => {
    console.log('Clients state updated:', clients);
  }, [clients]);

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('edit');
  };

  const handleSubmitOrder = async (orderData: NewOrder) => {
    try {
      if (!selectedOrder) return;
      
      // Get only the fields we want to update to avoid any issues with the types
      const updates: Partial<Order> = {
        family_number: orderData.family_number,
        status: orderData.status,
        delivery_type: orderData.delivery_type,
        pickup_date: orderData.pickup_date,
        notes: orderData.notes,
        is_new_client: orderData.is_new_client,
        approval_status: orderData.approval_status,
        number_of_boxes: orderData.number_of_boxes,
        additional_people: orderData.additional_people,
        visit_contact: orderData.visit_contact,
        updated_at: new Date()
      };
      
      const updatedOrder = await OrderService.update(selectedOrder.id, updates);
      
      // Update the local state with the updated order
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
      // Return to dashboard
      setViewMode('dashboard');
      setSelectedOrder(null);
      
      setNotification({
        open: true,
        message: updatedOrder.created_offline 
          ? 'Order saved locally and will be synced when online' 
          : 'Order updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating order:', error);
      
      // Check if it's a network error
      const isNetworkError = 
        error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('network'));
      
      setNotification({
        open: true,
        message: isNetworkError
          ? 'You appear to be offline. Please try again when online or check your connection.'
          : 'Error updating order',
        severity: 'error'
      });
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      const result = await OrderService.delete(order.id);
      setOrders(orders.filter(o => o.id !== order.id));
      
      setNotification({
        open: true,
        message: typeof result === 'boolean' && result 
          ? 'Order marked for deletion and will be removed when online' 
          : 'Order deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      
      // Check if it's a network error
      const isNetworkError = 
        error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('network'));
      
      setNotification({
        open: true,
        message: isNetworkError
          ? 'You appear to be offline. Please try again when online or check your connection.'
          : 'Error deleting order',
        severity: 'error'
      });
    }
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    try {
      console.log('Updating order status:', { originalOrder: order, newStatus });
      
      // Create an updates object with changes
      const updates: Partial<Order> = {
        status: newStatus,
        updated_at: new Date()
      };
      
      // Copy important fields that might have been updated
      if (order.pickup_date) {
        updates.pickup_date = order.pickup_date;
      }
      
      if (order.approval_status) {
        updates.approval_status = order.approval_status;
      }
      
      if (order.delivery_type) {
        updates.delivery_type = order.delivery_type;
      }
      
      // If the order status is changing to 'ready', make sure to include the box count
      if (newStatus === 'ready' && order.number_of_boxes) {
        updates.number_of_boxes = order.number_of_boxes;
      }

      console.log('Sending updates to server:', updates);
      const updatedOrder = await OrderService.update(order.id, updates);
      console.log('Received updated order from server:', updatedOrder);

      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
      setNotification({
        open: true,
        message: updatedOrder.created_offline 
          ? `Order status changed to ${newStatus} and will be synced when online` 
          : `Order status updated to ${newStatus}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      
      // Check if it's a network error
      const isNetworkError = 
        error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('network'));
      
      setNotification({
        open: true,
        message: isNetworkError
          ? 'You appear to be offline. Please try again when online or check your connection.'
          : 'Error updating order status',
        severity: 'error'
      });
    }
  };

  const handleCancel = () => {
    setViewMode('dashboard');
    setSelectedOrder(null);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderContent = () => {
    console.log('renderContent called with viewMode:', viewMode);
    console.log('Current orders:', orders);
    console.log('Current clients:', clients);
    console.log('Selected tab:', selectedTab);
    
    switch (viewMode) {
      case 'edit':
        return selectedOrder ? (
          <OrderForm 
            initialData={selectedOrder}
            clients={clients}
            onSubmit={handleSubmitOrder}
            onCancel={handleCancel}
          />
        ) : null;
      case 'view':
        return selectedOrder ? (
          <OrderDetails 
            order={selectedOrder}
            client={clients.find(c => c.family_number === selectedOrder.family_number)!}
            onEdit={handleEditOrder} 
            onDelete={handleDeleteOrder}
            onStatusChange={handleStatusChange}
          />
        ) : null;
      case 'dashboard':
      default:
        // Filter orders based on selected tab
        let filteredOrders = [...orders];
        console.log('All orders before filtering:', filteredOrders);
        
        if (selectedTab === 1) {
          // Show pending approvals
          console.log('Showing pending orders:', orders.filter(order => 
            (order.status === 'pending' && order.approval_status === 'pending') || 
            order.created_offline === true
          ));
          return (
            <PendingApprovalsDashboard
              orders={orders.filter(order => 
                (order.status === 'pending' && order.approval_status === 'pending') ||
                order.created_offline === true
              )}
              clients={clients}
              onStatusChange={handleStatusChange}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          );
        }
        
        // For the main queue dashboard, show all relevant orders
        filteredOrders = filteredOrders.filter(order => 
          order.status === 'approved' || 
          order.status === 'confirmed' ||
          order.status === 'ready' ||
          order.status === 'out_for_delivery' ||
          order.status === 'picked_up' ||
          order.status === 'delivered' ||
          order.status === 'no_show' ||
          order.status === 'failed_delivery'
        );
        console.log('Orders after filtering for queue:', filteredOrders);
        
        // Show daily queue
        return (
          <DailyQueueDashboard
            orders={filteredOrders}
            clients={clients}
            onEditOrder={handleEditOrder}
            onDeleteOrder={handleDeleteOrder}
            onStatusChange={handleStatusChange}
          />
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {!isOnline && (
        <Box sx={{ mb: 2 }}>
          <OfflineIndicator />
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {viewMode !== 'dashboard' ? (
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleCancel}
          >
            Back to Dashboard
          </Button>
        ) : (
          <Box />
        )}
        
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={loadData}
          size="small"
        >
          Refresh Data
        </Button>
      </Box>
      
      {viewMode === 'dashboard' && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="Daily Queue" />
            <Tab label="Pending Approvals" />
          </Tabs>
        </Box>
      )}

      {renderContent()}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 