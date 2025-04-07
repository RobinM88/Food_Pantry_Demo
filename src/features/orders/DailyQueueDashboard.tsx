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
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
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
  onAddOrder: () => void;
}

export default function DailyQueueDashboard({
  orders,
  clients,
  onStatusChange,
  onEditOrder,
  onDeleteOrder,
  onAddOrder
}: DailyQueueDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Filter orders based on status filter only
  const filteredOrders = orders.filter(order => {
    return filterStatus === 'all' || order.status === filterStatus;
  });

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value as OrderStatus | 'all');
  };

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

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'scheduled':
        return 'primary';
      case 'ready':
        return 'success';
      case 'picked_up':
        return 'success';
      case 'cancelled':
      case 'no_show':
        return 'error';
      case 'denied':
        return 'error';
      default:
        return 'default';
    }
  };

  const getNextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['approved', 'denied', 'cancelled'];
      case 'approved':
        return ['scheduled', 'cancelled'];
      case 'scheduled':
        return ['ready', 'cancelled', 'no_show'];
      case 'ready':
        return ['picked_up', 'no_show', 'cancelled'];
      case 'picked_up':
      case 'denied':
      case 'cancelled':
      case 'no_show':
        return [];
      default:
        return [];
    }
  };

  const renderOrderCard = (order: Order) => {
    const client = clients.find(c => c.familyNumber === order.familySearchId);
    const nextStatusOptions = getNextStatusOptions(order.status);
    
    return (
      <Card key={order.id} sx={{ 
        mb: 2, 
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{ 
          flex: '1 0 auto', 
          pb: '8px !important',
          pt: 1.5,
          px: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client?.phone1 || 'No phone'}
              </Typography>
            </Box>
            <Chip 
              label={order.status} 
              color={getStatusColor(order.status) as any}
              size="small"
            />
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CalendarIcon fontSize="small" />
              Pickup Date: {order.pickupDate ? format(new Date(order.pickupDate), 'MMMM d, yyyy') : 'Not specified'}
            </Typography>
            {order.notes && (
              <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotesIcon fontSize="small" />
                Notes: {order.notes}
              </Typography>
            )}
          </Box>
        </CardContent>
        
        <CardActions sx={{ px: 2, py: 1 }}>
          {nextStatusOptions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {nextStatusOptions.map(status => (
                <Button
                  key={status}
                  size="small"
                  variant="outlined"
                  onClick={() => handleStatusChange(order, status)}
                >
                  Mark as {status}
                </Button>
              ))}
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            aria-label="edit" 
            onClick={() => onEditOrder(order)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            aria-label="delete" 
            onClick={() => handleDeleteClick(order)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Daily Queue Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={filterStatus}
                onChange={handleFilterChange}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
                renderValue={(value) => value === 'all' ? 'All Statuses' : value}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="picked_up">Picked Up</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="no_show">No Show</MenuItem>
              </Select>
            </FormControl>
            {onAddOrder && (
              <Button
                variant="contained"
                color="primary"
                onClick={onAddOrder}
                startIcon={<CheckCircleIcon />}
              >
                Add New Order
              </Button>
            )}
          </Box>
        </Box>

        {/* Summary Statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" component="div">
                {orders.length}
              </Typography>
              <Typography variant="body2">
                Total Orders
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'info.light', 
                color: 'info.contrastText',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" component="div">
                {orders.filter(o => o.status === 'scheduled').length}
              </Typography>
              <Typography variant="body2">
                Scheduled
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'secondary.light', 
                color: 'secondary.contrastText',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" component="div">
                {orders.filter(o => o.status === 'pending').length}
              </Typography>
              <Typography variant="body2">
                Pending
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'success.light', 
                color: 'success.contrastText',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" component="div">
                {orders.filter(o => o.status === 'picked_up').length}
              </Typography>
              <Typography variant="body2">
                Picked Up
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {filteredOrders.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No orders match your search criteria.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredOrders.map((order) => renderOrderCard(order))}
          </Grid>
        )}
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