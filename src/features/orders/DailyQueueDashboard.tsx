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
  Snackbar,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Inventory as BoxesIcon
} from '@mui/icons-material';
import { Order, Client, OrderStatus } from '../../types';
import { format, isSameDay } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [boxCountDialogOpen, setBoxCountDialogOpen] = useState(false);
  const [boxCount, setBoxCount] = useState(1);
  const [boxCountError, setBoxCountError] = useState('');
  const [statusToChangeTo, setStatusToChangeTo] = useState<OrderStatus | null>(null);

  // Filter orders based on status and date
  const filteredOrders = orders.filter(order => {
    console.log('Processing order:', order);
    
    // Filter by status if selected
    const statusMatch = !selectedStatus || order.status === selectedStatus;
    console.log('Status match:', { 
      selectedStatus, 
      orderStatus: order.status, 
      statusMatch 
    });

    // Filter by date if selected
    const dateMatch = !selectedDate || !order.pickup_date || 
      isSameDay(new Date(order.pickup_date), selectedDate);
    console.log('Date match:', { 
      selectedDate, 
      orderPickupDate: order.pickup_date, 
      dateMatch 
    });

    const shouldInclude = statusMatch && dateMatch;
    console.log('Final decision for order:', { 
      orderId: order.id, 
      shouldInclude 
    });

    return shouldInclude;
  });

  console.log('Filtered orders:', filteredOrders);

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    // If changing from confirmed to ready, open the box count dialog
    if (order.status === 'confirmed' && newStatus === 'ready') {
      setSelectedOrder(order);
      setStatusToChangeTo(newStatus);
      setBoxCount(order.number_of_boxes);
      setBoxCountDialogOpen(true);
    } else {
      // For other status changes, proceed directly
      onStatusChange(order, newStatus);
      setSnackbarMessage(`Order status updated to ${newStatus}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  };

  const handleBoxCountSubmit = () => {
    if (!selectedOrder || !statusToChangeTo) return;
    
    if (boxCount < 1) {
      setBoxCountError('Number of boxes must be at least 1');
      return;
    }

    // Create updated order with new box count
    const updatedOrder: Order = {
      ...selectedOrder,
      number_of_boxes: boxCount
    };

    // Call the status change handler with updated order
    onStatusChange(updatedOrder, statusToChangeTo);
    
    // Close dialog and reset state
    setBoxCountDialogOpen(false);
    setSelectedOrder(null);
    setStatusToChangeTo(null);
    setBoxCountError('');
    
    setSnackbarMessage(`Order status updated to ${statusToChangeTo} with ${boxCount} boxes`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleBoxCountCancel = () => {
    setBoxCountDialogOpen(false);
    setSelectedOrder(null);
    setStatusToChangeTo(null);
    setBoxCountError('');
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
    console.log('Looking up client for order:', { 
      orderId: order.id, 
      familyNumber: order.family_number,
      availableClients: clients.map(c => ({ id: c.id, familyNumber: c.family_number, name: `${c.first_name} ${c.last_name}` }))
    });
    
    const client = clients.find(c => c.family_number === order.family_number);
    if (!client) {
      console.log('No client found for order:', { 
        orderId: order.id, 
        familyNumber: order.family_number,
        availableClients: clients.map(c => ({ id: c.id, familyNumber: c.family_number, name: `${c.first_name} ${c.last_name}` }))
      });
      return null;
    }

    const nextStatuses = getNextStatusOptions(order.status, order.delivery_type);
    
    return (
      <Card key={order.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
            </Typography>
            <Chip 
              label={getStatusLabel(order.status)}
              color={getChipColor(order.status)}
              size={isMobile ? "small" : "medium"}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Pickup: {order.pickup_date ? format(new Date(order.pickup_date), 'MMM d, yyyy h:mm a') : 'Not scheduled'}
          </Typography>

          {/* Note: Phone log notes are now hidden as per requirements */}
          {(order.status === 'ready' || order.status === 'out_for_delivery' || order.status === 'picked_up' || order.status === 'delivered') && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <BoxesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Boxes: {order.number_of_boxes}
            </Typography>
          )}
        </CardContent>

        <CardActions sx={{ 
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 1,
          justifyContent: 'flex-start'
        }}>
          {nextStatuses.map(status => (
            <Button
              key={status}
              size="small"
              variant="contained"
              color={getStatusColor(status)}
              onClick={() => handleStatusChange(order, status)}
              sx={{
                mb: isMobile ? 1 : 0,
                fontSize: isMobile ? '0.75rem' : '0.8125rem',
                whiteSpace: 'nowrap'
              }}
            >
              Mark as {getStatusLabel(status)}
            </Button>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ 
            display: 'flex',
            gap: 1, 
            ml: isMobile && nextStatuses.length > 0 ? 'auto' : 0,
            mt: isMobile && nextStatuses.length > 0 ? 1 : 0
          }}>
            <IconButton size="small" onClick={() => onEditOrder(order)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(order)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardActions>
      </Card>
    );
  };

  const displayEmpty = () => {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          {selectedDate 
            ? 'No orders found for the selected date'
            : 'No orders found'}
        </Typography>
      </Box>
    );
  };

  const renderStats = () => {
    // Use different grid breakpoints for mobile
    return (
      <Grid container spacing={2} sx={{ mb: 3, maxWidth: '1200px', margin: '0 auto' }}>
        <Grid item xs={6} sm={6} md={2}>
          <Paper sx={{ p: isMobile ? 1 : 2 }}>
            <Typography variant="subtitle2" color="textSecondary" noWrap>
              Confirmed
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"}>
              {filteredOrders.filter(o => o.status === 'confirmed').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Paper sx={{ p: isMobile ? 1 : 2 }}>
            <Typography variant="subtitle2" color="textSecondary" noWrap>
              Ready
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"}>
              {filteredOrders.filter(o => o.status === 'ready').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Paper sx={{ p: isMobile ? 1 : 2 }}>
            <Typography variant="subtitle2" color="textSecondary" noWrap>
              Out for Delivery
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"}>
              {filteredOrders.filter(o => o.status === 'out_for_delivery').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Paper sx={{ p: isMobile ? 1 : 2 }}>
            <Typography variant="subtitle2" color="textSecondary" noWrap>
              Completed
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"}>
              {filteredOrders.filter(o => o.status === 'picked_up' || o.status === 'delivered').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Paper sx={{ p: isMobile ? 1 : 2 }}>
            <Typography variant="subtitle2" color="textSecondary" noWrap>
              Issues
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"}>
              {filteredOrders.filter(o => o.status === 'no_show' || o.status === 'failed_delivery').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Paper sx={{ p: isMobile ? 1 : 2 }}>
            <Typography variant="subtitle2" color="textSecondary" noWrap>
              Cancelled
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"}>
              {filteredOrders.filter(o => o.status === 'cancelled').length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          mb: 2 
        }}>
          <Typography variant="h5" component="h2" sx={{ mb: isMobile ? 2 : 0 }}>
            Daily Queue Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Date Filter */}
            <DatePicker
              label="Filter by Date"
              value={selectedDate}
              onChange={(newDate) => {
                console.log('Date changed:', newDate);
                setSelectedDate(newDate);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: isMobile,
                  sx: { minWidth: isMobile ? '100%' : 200 },
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }
              }}
            />
            
            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200 }}>
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
            
            {/* Clear Filters Button */}
            {(selectedDate || selectedStatus) && (
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setSelectedDate(new Date()); // Reset to current date
                  setSelectedStatus(null);
                }}
                sx={{ minWidth: isMobile ? '100%' : 'auto' }}
              >
                Reset Filters
              </Button>
            )}
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
        fullWidth
        maxWidth="xs"
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

      {/* Box Count Dialog */}
      <Dialog
        open={boxCountDialogOpen}
        onClose={handleBoxCountCancel}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Set Number of Boxes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
            Please specify the number of boxes for this order before marking it as ready.
          </Typography>
          <TextField
            label="Number of Boxes"
            type="number"
            value={boxCount}
            onChange={(e) => {
              setBoxCount(parseInt(e.target.value) || 0);
              if (parseInt(e.target.value) >= 1) {
                setBoxCountError('');
              }
            }}
            fullWidth
            error={!!boxCountError}
            helperText={boxCountError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BoxesIcon />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBoxCountCancel}>Cancel</Button>
          <Button onClick={handleBoxCountSubmit} color="primary" variant="contained">
            Confirm
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