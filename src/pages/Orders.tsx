import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import OrderList from '../features/orders/OrderList';
import { OrderForm } from '../features/orders/OrderForm';
import OrderDetails from '../features/orders/OrderDetails';
import { Order, NewOrder, UpdateOrder, Client } from '../types';
import { mockOrders, mockClients } from '../utils/mockData';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [clients] = useState<Client[]>(mockClients);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    setOrders(orders.filter(o => o.id !== order.id));
    if (viewMode === 'view' && selectedOrder?.id === order.id) {
      setViewMode('list');
      setSelectedOrder(null);
    }
  };

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      updatedAt: new Date()
    };
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    
    // If we're viewing the order that was just updated, update the selected order
    if (viewMode === 'view' && selectedOrder?.id === order.id) {
      setSelectedOrder(updatedOrder);
    }
  };

  const handleSubmitOrder = (orderData: NewOrder | UpdateOrder) => {
    if (viewMode === 'add') {
      // Add new order
      const newOrder: Order = {
        ...orderData as NewOrder,
        id: Date.now().toString(), // Simple ID generation
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setOrders([...orders, newOrder]);
    } else if (viewMode === 'edit' && selectedOrder) {
      // Update existing order
      const updatedOrder: Order = {
        ...selectedOrder,
        ...orderData,
        updatedAt: new Date()
      };
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    }
    
    setViewMode('list');
    setSelectedOrder(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedOrder(null);
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
      case 'list':
      default:
        return (
          <OrderList 
            orders={orders}
            clients={clients}
            onAddOrder={handleAddOrder} 
            onEditOrder={handleEditOrder} 
            onViewOrder={handleViewOrder} 
            onDeleteOrder={handleDeleteOrder}
            onStatusChange={handleStatusChange}
          />
        );
    }
  };

  return (
    <Box>
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
    </Box>
  );
} 