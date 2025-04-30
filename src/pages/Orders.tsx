import { useState, useEffect } from 'react';
import OrderList from '../features/orders/OrderList';
import { OrderForm } from '../features/orders/OrderForm';
import OrderDetails from '../features/orders/OrderDetails';
import { api } from '../services/api';
import { Order, Client } from '../types';
import { NewOrder } from '../types/order';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await api.orders.getAll();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setNotification({
        open: true,
        message: 'Error loading orders',
        severity: 'error'
      });
    }
  };

  const fetchClients = async () => {
    try {
      const fetchedClients = await api.clients.getAll();
      setClients(fetchedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setNotification({
        open: true,
        message: 'Error loading clients',
        severity: 'error'
      });
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const handleAddOrder = () => {
    setSelectedOrder(undefined);
    setIsFormOpen(true);
  };

  const handleSubmitOrder = async (orderData: NewOrder) => {
    try {
      if (selectedOrder) {
        await api.orders.update(selectedOrder.id, orderData);
        setNotification({
          open: true,
          message: 'Order updated successfully',
          severity: 'success'
        });
      } else {
        await api.orders.create(orderData);
        setNotification({
          open: true,
          message: 'Order created successfully',
          severity: 'success'
        });
      }
      await fetchOrders();
      setIsFormOpen(false);
      setSelectedOrder(undefined);
    } catch (error: any) {
      console.error('Error submitting order:', error);
      setNotification({
        open: true,
        message: error.message || 'Error submitting order',
        severity: 'error'
      });
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      await api.orders.delete(order.id);
      await fetchOrders();
      setIsDetailsOpen(false);
      setSelectedOrder(undefined);
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
      await api.orders.update(order.id, { ...order, status: newStatus });
      await fetchOrders();
      setNotification({
        open: true,
        message: 'Order status updated successfully',
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

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Orders</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddOrder}
        >
          Add Order
        </Button>
      </Box>

      <OrderList
        orders={orders}
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onDeleteOrder={handleDeleteOrder}
        onStatusChange={handleStatusChange}
      />

      {isFormOpen && (
        <OrderForm
          initialData={selectedOrder}
          clients={clients}
          onSubmit={handleSubmitOrder}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedOrder(undefined);
          }}
        />
      )}

      {isDetailsOpen && selectedOrder && (
        <>
          {clients.find(c => c.family_number === selectedOrder.family_number) ? (
            <OrderDetails
              order={selectedOrder}
              client={clients.find(c => c.family_number === selectedOrder.family_number)!}
              onEdit={handleEditOrder}
              onDelete={handleDeleteOrder}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="error">
                Error: Could not find client with family number {selectedOrder.family_number}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setIsDetailsOpen(false)}
                sx={{ mt: 2 }}
              >
                Close
              </Button>
            </Box>
          )}
        </>
      )}

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