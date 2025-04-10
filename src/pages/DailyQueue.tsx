import { useState, useEffect } from 'react';
import { Box, Button, Tabs, Tab, Typography, Paper } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import DailyQueueDashboard from '../features/orders/DailyQueueDashboard';
import PendingApprovalsDashboard from '../features/orders/PendingApprovalsDashboard';
import { OrderForm } from '../features/orders/OrderForm';
import OrderDetails from '../features/orders/OrderDetails';
import { Order, NewOrder, UpdateOrder, Client, OrderStatus } from '../types';
import { mockOrders, mockClients } from '../utils/mockData';
import { getOrders, getClients, addOrder, updateOrder, deleteOrder } from '../utils/testDataUtils';

type ViewMode = 'dashboard' | 'add' | 'edit' | 'view';

export default function DailyQueue() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Load data from localStorage
  useEffect(() => {
    const storedOrders = getOrders();
    const storedClients = getClients();
    
    // If there's no stored data, initialize with mock data
    if (storedOrders.length === 0) {
      mockOrders.forEach(order => {
        addOrder(order);
      });
      setOrders(mockOrders);
    } else {
      setOrders(storedOrders);
    }

    if (storedClients.length === 0) {
      mockClients.forEach(client => {
        const clientToAdd = {
          ...client,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        addNewClient(clientToAdd);
      });
      setClients(mockClients);
    } else {
      setClients(storedClients);
    }
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
    deleteOrder(order.id);
    setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
    if (viewMode === 'view' && selectedOrder?.id === order.id) {
      setViewMode('dashboard');
      setSelectedOrder(null);
    }
  };

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      updatedAt: new Date()
    };
    
    // Update in localStorage
    updateOrder(updatedOrder);
    
    // Update in state
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    );
    
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
        
        // Exclude pending orders from the queue dashboard
        filteredOrders = filteredOrders.filter(order => order.status !== 'pending');
        
        if (selectedTab === 1) {
          filteredOrders = filteredOrders.filter(order => order.status === 'scheduled');
        } else if (selectedTab === 2) {
          filteredOrders = filteredOrders.filter(order => order.status === 'ready');
        } else if (selectedTab === 3) {
          filteredOrders = filteredOrders.filter(order => order.status === 'picked_up');
        }
        
        return (
          <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={selectedTab} onChange={handleTabChange} aria-label="daily queue tabs">
                <Tab label="All Orders" />
                <Tab label="Scheduled" />
                <Tab label="Ready" />
                <Tab label="Picked Up" />
              </Tabs>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <PendingApprovalsDashboard 
                orders={orders}
                clients={clients}
                onStatusChange={handleStatusChange}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            </Box>
            
            <Typography variant="h5" gutterBottom>
              Order Queue
            </Typography>
            
            <DailyQueueDashboard 
              orders={filteredOrders}
              clients={clients}
              onStatusChange={handleStatusChange}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
              onAddOrder={handleAddOrder}
            />
          </Box>
        );
    }
  };

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
      {renderContent()}
    </Box>
  );
} 