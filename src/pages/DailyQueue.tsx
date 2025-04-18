import { useState, useEffect } from 'react';
import { Box, Button, Tabs, Tab, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import DailyQueueDashboard from '../features/orders/DailyQueueDashboard';
import PendingApprovalsDashboard from '../features/orders/PendingApprovalsDashboard';
import OrderDetails from '../features/orders/OrderDetails';
import { OrderForm } from '../features/orders/OrderForm';
import { Order, Client } from '../types';
import { OrderService } from '../services/order.service';
import { ClientService } from '../services/client.service';
import { NewOrder } from '../types/order';

type ViewMode = 'dashboard' | 'edit' | 'view';

interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function DailyQueue() {
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, clientsData] = await Promise.all([
        OrderService.getAll(),
        ClientService.getAll()
      ]);
      console.log('Loaded orders:', ordersData);
      console.log('Loaded clients:', clientsData);
      setOrders(ordersData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({
        open: true,
        message: 'Error loading data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('edit');
  };

  const handleSubmitOrder = async (orderData: NewOrder) => {
    try {
      if (!selectedOrder) return;
      
      // Get only the fields we want to update to avoid any issues with the types
      const updates: Partial<Order> = {
        family_search_id: orderData.family_search_id,
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
        message: 'Order updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating order:', error);
      setNotification({
        open: true,
        message: 'Error updating order',
        severity: 'error'
      });
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      await OrderService.delete(order.id);
      setOrders(orders.filter(o => o.id !== order.id));
      
      setNotification({
        open: true,
        message: 'Order deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      setNotification({
        open: true,
        message: 'Error deleting order',
        severity: 'error'
      });
    }
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    try {
      // Check if we need to update both status and box count
      const updates: Partial<Order> = {
        status: newStatus,
        updated_at: new Date()
      };
      
      // If the order status is changing to 'ready', make sure to include the box count
      if (newStatus === 'ready' && order.number_of_boxes) {
        updates.number_of_boxes = order.number_of_boxes;
      }

      const updatedOrder = await OrderService.update(order.id, updates);

      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
      setNotification({
        open: true,
        message: `Order status updated to ${newStatus}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setNotification({
        open: true,
        message: 'Error updating order status',
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
            client={clients.find(c => c.id === selectedOrder.family_search_id)!}
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
            order.status === 'pending' && order.approval_status === 'pending'
          ));
          return (
            <PendingApprovalsDashboard
              orders={orders.filter(order => 
                order.status === 'pending' && order.approval_status === 'pending'
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
      {viewMode !== 'dashboard' && (
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleCancel}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
      )}
      
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