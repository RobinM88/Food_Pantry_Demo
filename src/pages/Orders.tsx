import { useState, useEffect } from 'react';
import OrderList from '../features/orders/OrderList';
import { OrderForm } from '../features/orders/OrderForm';
import OrderDetails from '../features/orders/OrderDetails';
import { api } from '../services/api';
import { Order, Client } from '../types';
import { NewOrder } from '../types/order';
import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  const fetchOrders = async () => {
    const fetchedOrders = await api.orders.getAll();
    setOrders(fetchedOrders);
  };

  const fetchClients = async () => {
    const fetchedClients = await api.clients.getAll();
    setClients(fetchedClients);
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
      } else {
        await api.orders.create(orderData);
      }
      await fetchOrders();
      setIsFormOpen(false);
      setSelectedOrder(undefined);
    } catch (error) {
      console.error('Error submitting order:', error);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      await api.orders.delete(order.id);
      await fetchOrders();
      setIsDetailsOpen(false);
      setSelectedOrder(undefined);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    try {
      await api.orders.update(order.id, { ...order, status: newStatus });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
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
        clients={clients}
        onAddOrder={handleAddOrder}
        onEditOrder={handleEditOrder}
        onViewOrder={handleViewOrder}
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
        <OrderDetails
          order={selectedOrder}
          client={clients.find(c => c.id === selectedOrder.familySearchId)!}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          onStatusChange={handleStatusChange}
        />
      )}
    </Box>
  );
} 