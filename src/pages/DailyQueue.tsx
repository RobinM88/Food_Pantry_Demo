import { useState, useEffect } from 'react';
import { Box, Button, Tabs, Tab, Typography, Paper, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import DailyQueueDashboard from '../features/orders/DailyQueueDashboard';
import PendingApprovalsDashboard from '../features/orders/PendingApprovalsDashboard';
import { OrderForm } from '../features/orders/OrderForm';
import OrderDetails from '../features/orders/OrderDetails';
import { Order, NewOrder, UpdateOrder, Client, OrderStatus } from '../types';
import { getOrders, getClients, addOrder, updateOrder, deleteOrder } from '../utils/testDataUtils';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../services/order.service';
import { ClientService } from '../services/client.service';

type ViewMode = 'dashboard' | 'add' | 'edit' | 'view';

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
  
  const navigate = useNavigate();

  useEffect(() => {
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
    loadData();
  }, []);

  const handleAddOrder = () => {
    setSelectedOrder(null);
    setViewMode('add');
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('edit');
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('view');
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
      const updatedOrder = await OrderService.update(order.id, {
        status: newStatus,
        updatedAt: new Date()
      });

      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
      setNotification({
        open: true,
        message: `Order status updated to ${newStatus.replace('_', ' ')}`,
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

  const handleSubmitOrder = (orderData: NewOrder | UpdateOrder) => {
    if (viewMode === 'add') {
      // Add new order
      const newOrder: Order = {
        ...orderData as NewOrder,
        id: `o${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      addOrder(newOrder);
      setOrders(prevOrders => [...prevOrders, newOrder]);
    } else if (viewMode === 'edit' && selectedOrder) {
      // Update existing order
      const updatedOrder: Order = {
        ...selectedOrder,
        ...orderData,
        updatedAt: new Date()
      };
      updateOrder(updatedOrder);
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      );
    }
    
    setViewMode('dashboard');
    setSelectedOrder(null);
  };

  const handleCancel = () => {
    setViewMode('dashboard');
    setSelectedOrder(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'add':
        return (
          <OrderForm 
            clients={clients}
            onSubmit={handleSubmitOrder} 
            onCancel={handleCancel} 
          />
        );
      case 'edit':
        return selectedOrder ? (
          <OrderForm 
            order={selectedOrder}
            clients={clients}
            onSubmit={handleSubmitOrder} 
            onCancel={handleCancel}
            isEdit={true}
          />
        ) : null;
      case 'view':
        return selectedOrder ? (
          <OrderDetails 
            order={selectedOrder}
            client={clients.find(c => c.id === selectedOrder.clientId)!}
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
          console.log('Showing pending orders:', orders.filter(order => order.status === 'pending'));
          return (
            <PendingApprovalsDashboard
              orders={orders.filter(order => order.status === 'pending')}
              clients={clients}
              onStatusChange={handleStatusChange}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          );
        }
        
        // For the main queue dashboard, show all non-pending orders
        filteredOrders = filteredOrders.filter(order => 
          order.status !== 'pending' && 
          order.status !== 'denied' && 
          order.status !== 'cancelled'
        );
        console.log('Orders after filtering for queue:', filteredOrders);
        
        // Show daily queue
        return (
          <DailyQueueDashboard
            orders={filteredOrders}
            clients={clients}
            onAdd={handleAddOrder}
            onEdit={handleEditOrder}
            onView={handleViewOrder}
            onDelete={handleDeleteOrder}
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
          Back to Daily Queue
        </Button>
      )}
      {viewMode === 'dashboard' && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Daily Queue" />
            <Tab label="Pending Approvals" />
          </Tabs>
        </Paper>
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