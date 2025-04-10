import { useState, useEffect } from 'react';
import { Box, Button, Typography, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import OrderList from '../features/orders/OrderList';
import { OrderForm } from '../features/orders/OrderForm';
import OrderDetails from '../features/orders/OrderDetails';
import { Order, NewOrder, UpdateOrder, Client } from '../types';
import { OrderService } from '../services/order.service';
import { ClientService } from '../services/client.service';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load data using services
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersData, clientsData] = await Promise.all([
          OrderService.getAll(),
          ClientService.getAll()
        ]);
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
      
      if (viewMode === 'view' && selectedOrder?.id === order.id) {
        setViewMode('list');
        setSelectedOrder(null);
      }

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
      const updatedOrder: Order = {
        ...order,
        status: newStatus,
        updatedAt: new Date()
      };
      
      await OrderService.update(order.id, updatedOrder);
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
      if (viewMode === 'view' && selectedOrder?.id === order.id) {
        setSelectedOrder(updatedOrder);
      }

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

  const handleSubmitOrder = async (orderData: NewOrder | UpdateOrder) => {
    try {
      if (viewMode === 'add') {
        // Add new order
        const newOrder = await OrderService.create(orderData as NewOrder);
        setOrders([...orders, newOrder]);
        setNotification({
          open: true,
          message: 'Order created successfully',
          severity: 'success'
        });
      } else if (viewMode === 'edit' && selectedOrder) {
        // Update existing order
        const updatedOrder = await OrderService.update(selectedOrder.id, {
          ...orderData,
          updatedAt: new Date()
        });
        
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setNotification({
          open: true,
          message: 'Order updated successfully',
          severity: 'success'
        });
      }
      
      setViewMode('list');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      setNotification({
        open: true,
        message: 'Error saving order',
        severity: 'error'
      });
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedOrder(null);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }

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
            client={clients.find(c => c.familyNumber === selectedOrder.familySearchId)}
            onEdit={handleEditOrder} 
            onDelete={handleDeleteOrder}
            onStatusChange={handleStatusChange}
          />
        ) : null;
      case 'list':
      default:
        return (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">Orders</Typography>
              <Button
                variant="contained"
                onClick={handleAddOrder}
              >
                New Order
              </Button>
            </Box>
            <OrderList 
              orders={orders}
              clients={clients}
              onView={handleViewOrder}
              onEdit={handleEditOrder}
              onDelete={handleDeleteOrder}
              onStatusChange={handleStatusChange}
            />
          </>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {viewMode !== 'list' && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mb: 3 }}
        >
          Back to Orders
        </Button>
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