import { useState, useEffect } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import OrderList from '../features/orders/OrderList';
import { OrderForm } from '../features/orders/OrderForm';
import OrderDetails from '../features/orders/OrderDetails';
import { Order, NewOrder, UpdateOrder, Client } from '../types';
import { mockOrders, mockClients } from '../utils/mockData';
import { getOrders, getClients, addOrder, updateOrder, deleteOrder } from '../utils/testDataUtils';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function Orders() {
  // Initialize with mock data
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load data from localStorage and combine with mock data
  useEffect(() => {
    const storedOrders = getOrders();
    const storedClients = getClients();
    
    // Start with stored data and only add mock data if not already present
    const combinedOrders = [...storedOrders];
    mockOrders.forEach(mockOrder => {
      if (!combinedOrders.some(order => order.id === mockOrder.id)) {
        combinedOrders.push(mockOrder);
      }
    });
    
    const combinedClients = [...storedClients];
    mockClients.forEach(mockClient => {
      if (!combinedClients.some(client => client.familyNumber === mockClient.familyNumber)) {
        combinedClients.push(mockClient);
      }
    });

    setOrders(combinedOrders);
    setClients(combinedClients);
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

  const handleDeleteOrder = (order: Order) => {
    // Only delete from localStorage if it's not a mock order
    if (!mockOrders.some(mockOrder => mockOrder.id === order.id)) {
      deleteOrder(order.id);
    }
    
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
  };

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      updatedAt: new Date()
    };
    
    // Save the update to localStorage
    updateOrder(updatedOrder);
    
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    
    // If we're viewing the order that was just updated, update the selected order
    if (viewMode === 'view' && selectedOrder?.id === order.id) {
      setSelectedOrder(updatedOrder);
    }

    setNotification({
      open: true,
      message: `Order status updated to ${newStatus.replace('_', ' ')}`,
      severity: 'success'
    });
  };

  const handleSubmitOrder = (orderData: NewOrder | UpdateOrder) => {
    if (viewMode === 'add') {
      // Add new order
      const newOrder: Order = {
        ...orderData as NewOrder,
        id: `o${Date.now()}`, // Ensure unique ID
        createdAt: new Date(),
        updatedAt: new Date()
      };
      addOrder(newOrder);
      setOrders([...orders, newOrder]);
      setNotification({
        open: true,
        message: 'Order created successfully',
        severity: 'success'
      });
    } else if (viewMode === 'edit' && selectedOrder) {
      // Update existing order
      const updatedOrder: Order = {
        ...selectedOrder,
        ...orderData,
        updatedAt: new Date()
      };
      
      // Always update localStorage
      updateOrder(updatedOrder);
      
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setNotification({
        open: true,
        message: 'Order updated successfully',
        severity: 'success'
      });
    }
    
    setViewMode('list');
    setSelectedOrder(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedOrder(null);
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
              onAddOrder={handleAddOrder}
              onEditOrder={handleEditOrder} 
              onViewOrder={handleViewOrder} 
              onDeleteOrder={handleDeleteOrder}
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
          sx={{ mb: 2 }}
        >
          Back to Order List
        </Button>
      )}
      {renderContent()}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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