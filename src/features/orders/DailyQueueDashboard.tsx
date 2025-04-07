import { useState, useEffect } from 'react';
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
  Tooltip,
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
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { Order, Client, OrderStatus } from '../../types';
import { format } from 'date-fns';

interface DailyQueueDashboardProps {
  orders: Order[];
  clients: Client[];
  onStatusChange: (order: Order, newStatus: OrderStatus) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onAddOrder?: () => void;
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
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'pickupDate' | 'clientName'>('pickupDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    const client = clients.find(c => c.familyNumber === order.familySearchId);
    const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) || 
      order.items.toLowerCase().includes(searchLower) ||
      order.notes?.toLowerCase().includes(searchLower) || '';
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort orders based on selected criteria
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'pickupDate') {
      const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
      const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      const clientA = clients.find(c => c.familyNumber === a.familySearchId);
      const clientB = clients.find(c => c.familyNumber === b.familySearchId);
      const nameA = clientA ? `${clientA.firstName} ${clientA.lastName}` : '';
      const nameB = clientB ? `${clientB.firstName} ${clientB.lastName}` : '';
      return sortOrder === 'asc' 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    }
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value as OrderStatus | 'all');
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value as 'pickupDate' | 'clientName');
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
      case 'denied':
        return 'error';
      case 'confirmed':
        return 'primary';
      case 'ready':
        return 'secondary';
      case 'picked_up':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getClientName = (familySearchId: string) => {
    const client = clients.find(c => c.familyNumber === familySearchId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  };

  const getClientPhone = (familySearchId: string) => {
    const client = clients.find(c => c.familyNumber === familySearchId);
    return client?.phone1 || 'No phone';
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
                {orders.filter(o => o.status === 'approved').length}
              </Typography>
              <Typography variant="body2">
                Approved
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
                {orders.filter(o => o.status === 'ready').length}
              </Typography>
              <Typography variant="body2">
                Ready
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
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={4}>
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
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="picked_up">Picked Up</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="sort-by-label">Sort by</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="Sort by"
                onChange={handleSortChange}
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="pickupDate">Pickup Date</MenuItem>
                <MenuItem value="clientName">Client Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {sortedOrders.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No orders match your search criteria.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {sortedOrders.map((order) => {
              const client = clients.find(c => c.familyNumber === order.familySearchId);
              return (
                <Grid item xs={12} sm={6} md={4} key={order.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="div">
                          Order #{order.id}
                        </Typography>
                        <Chip 
                          label={order.status} 
                          color={getStatusColor(order.status) as any} 
                          size="small" 
                        />
                      </Box>
                      
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={getClientName(order.familySearchId)} 
                            secondary={getClientPhone(order.familySearchId)} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <ShoppingCartIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Items" 
                            secondary={order.items} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Pickup Date" 
                            secondary={order.pickupDate ? format(new Date(order.pickupDate), 'MMMM d, yyyy') : 'Not specified'} 
                          />
                        </ListItem>
                        {order.notes && (
                          <ListItem>
                            <ListItemIcon>
                              <NotesIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Notes" 
                              secondary={order.notes} 
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <Tooltip title="Edit Order">
                          <IconButton 
                            size="small" 
                            onClick={() => onEditOrder(order)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Order">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(order)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box>
                        {order.status === 'approved' && (
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleStatusChange(order, 'ready')}
                          >
                            Mark as Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleStatusChange(order, 'picked_up')}
                          >
                            Mark as Picked Up
                          </Button>
                        )}
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
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