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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
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
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { Order, Client } from '../../types';
import { format } from 'date-fns';

interface DailyQueueDashboardProps {
  orders: Order[];
  clients: Client[];
  onStatusChange: (order: Order, newStatus: Order['status']) => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = order.notes?.toLowerCase().includes(searchLower) || '';
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value as Order['status'] | 'all');
  };

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'picked_up':
        return 'success';
      case 'cancelled':
      case 'no_show':
        return 'error';
      default:
        return 'default';
    }
  };

  const getNextStatusOptions = (currentStatus: Order['status']): Order['status'][] => {
    switch (currentStatus) {
      case 'pending':
        return ['scheduled', 'cancelled'];
      case 'scheduled':
        return ['picked_up', 'no_show', 'cancelled'];
      case 'picked_up':
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
      <Card key={order.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="div">
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
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Order Details:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CalendarIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Pickup Date"
                secondary={order.pickupDate ? format(new Date(order.pickupDate), 'MMMM d, yyyy') : 'Not specified'}
              />
            </ListItem>
            {order.notes && (
              <ListItem>
                <ListItemIcon>
                  <NotesIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Notes"
                  secondary={order.notes}
                />
              </ListItem>
            )}
          </List>
          
        </CardContent>
        
        <CardActions>
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
          <Typography variant="h5" component="h2" gutterBottom>
            Daily Queue Dashboard
          </Typography>
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
        <Typography variant="body1" color="text.secondary" paragraph>
          Monitor and update approved orders for packing
        </Typography>

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

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Search orders..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="filter-status-label">Filter by Status</InputLabel>
              <Select
                labelId="filter-status-label"
                value={filterStatus}
                label="Filter by Status"
                onChange={handleFilterChange}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="picked_up">Picked Up</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="no_show">No Show</MenuItem>
              </Select>
            </FormControl>
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