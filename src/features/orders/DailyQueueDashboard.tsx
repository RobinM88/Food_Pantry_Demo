import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { Order, Client, OrderStatus } from '../../types';
import { format } from 'date-fns';

interface DailyQueueDashboardProps {
  orders: Order[];
  clients: Client[];
  onStatusChange: (order: Order, newStatus: OrderStatus) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}

const STATUS_OPTIONS: OrderStatus[] = ['confirmed', 'ready', 'out_for_delivery', 'picked_up', 'delivered', 'no_show', 'failed_delivery', 'cancelled'];

export default function DailyQueueDashboard({
  orders,
  clients,
  onStatusChange,
  onEditOrder,
  onDeleteOrder
}: DailyQueueDashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    return !selectedStatus || order.status === selectedStatus;
  });

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    onStatusChange(order, newStatus);
    setSnackbarMessage(`Order status updated to ${newStatus}`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleDeleteClick = (order: Order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedOrder) {
      onDeleteOrder(selectedOrder);
      setDeleteDialogOpen(false);
      setSnackbarMessage('Order deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getNextStatusOptions = (currentStatus: OrderStatus, deliveryType: 'pickup' | 'delivery'): OrderStatus[] => {
    switch (currentStatus) {
      case 'approved':
        return ['confirmed'];
      case 'confirmed':
        return deliveryType === 'pickup' 
          ? ['ready', 'cancelled']
          : ['out_for_delivery', 'cancelled'];
      case 'ready':
        return ['picked_up', 'no_show'];
      case 'out_for_delivery':
        return ['delivered', 'failed_delivery'];
      case 'picked_up':
      case 'no_show':
      case 'delivered':
      case 'failed_delivery':
      case 'cancelled':
        return [];
      default:
        return [];
    }
  };

  const getStatusColor = (status: OrderStatus): 'info' | 'success' | 'error' | 'warning' | 'primary' => {
    switch (status) {
      case 'confirmed':
        return 'primary';
      case 'ready':
      case 'out_for_delivery':
        return 'info';
      case 'picked_up':
      case 'delivered':
        return 'success';
      case 'no_show':
      case 'failed_delivery':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getChipColor = (status: OrderStatus): 'info' | 'success' | 'error' | 'warning' | 'primary' | 'default' => {
    switch (status) {
      case 'confirmed':
        return 'primary';
      case 'ready':
      case 'out_for_delivery':
        return 'info';
      case 'picked_up':
      case 'delivered':
        return 'success';
      case 'no_show':
      case 'failed_delivery':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'ready':
        return 'Ready for Pickup';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'picked_up':
        return 'Picked Up';
      case 'delivered':
        return 'Delivered';
      case 'no_show':
        return 'No Show';
      case 'failed_delivery':
        return 'Failed Delivery';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };

  const renderOrderCard = (order: Order) => {
    const client = clients.find(c => c.id === order.family_search_id);
    if (!client) return null;

    const nextStatuses = getNextStatusOptions(order.status, order.delivery_type);
    
    return (
      <Card key={order.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
            </Typography>
            <Chip 
              label={getStatusLabel(order.status)}
              color={getChipColor(order.status)}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Pickup: {order.pickup_date ? format(new Date(order.pickup_date), 'MMM d, yyyy h:mm a') : 'Not scheduled'}
          </Typography>

          {order.notes && (
            <Typography variant="body2" color="text.secondary">
              <NotesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {order.notes}
            </Typography>
          )}
        </CardContent>

        <CardActions>
          {nextStatuses.map(status => (
            <Button
              key={status}
              size="small"
              variant="contained"
              color={getStatusColor(status)}
              onClick={() => handleStatusChange(order, status)}
            >
              Mark as {getStatusLabel(status)}
            </Button>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" onClick={() => onEditOrder(order)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteClick(order)}>
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  const displayEmpty = () => {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          No orders found for today
        </Typography>
      </Box>
    );
  };

  const renderStats = () => {
    return (
      <Grid container spacing={2} sx={{ mb: 3, maxWidth: '1200px', margin: '0 auto' }}>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Confirmed
            </Typography>
            <Typography variant="h4">
              {orders.filter(o => o.status === 'confirmed').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Ready for Pickup
            </Typography>
            <Typography variant="h4">
              {orders.filter(o => o.status === 'ready').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Out for Delivery
            </Typography>
            <Typography variant="h4">
              {orders.filter(o => o.status === 'out_for_delivery').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Completed Today
            </Typography>
            <Typography variant="h4">
              {orders.filter(o => o.status === 'picked_up' || o.status === 'delivered').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Issues
            </Typography>
            <Typography variant="h4">
              {orders.filter(o => o.status === 'no_show' || o.status === 'failed_delivery').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Cancelled
            </Typography>
            <Typography variant="h4">
              {orders.filter(o => o.status === 'cancelled').length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, maxWidth: '1200px', margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Daily Queue Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={selectedStatus ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedStatus(value === '' ? null : value as OrderStatus);
                }}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Statuses</MenuItem>
                {STATUS_OPTIONS.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {renderStats()}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ maxWidth: '100%' }}>
          {filteredOrders.length === 0 ? (
            displayEmpty()
          ) : (
            <Grid container spacing={2}>
              {filteredOrders.map(order => (
                <Grid item xs={12} key={order.id}>
                  {renderOrderCard(order)}
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this order? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 