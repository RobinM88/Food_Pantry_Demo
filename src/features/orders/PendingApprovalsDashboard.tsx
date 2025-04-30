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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Order, Client } from '../../types';
import { format } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';

interface PendingApprovalsDashboardProps {
  orders: Order[];
  clients: Client[];
  onStatusChange: (order: Order, newStatus: Order['status']) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}

export default function PendingApprovalsDashboard({
  orders,
  clients,
  onStatusChange,
  onEditOrder,
  onDeleteOrder
}: PendingApprovalsDashboardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Scheduling dialog state
  const [schedulingDialogOpen, setSchedulingDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');

  // Filter orders to only show pending ones
  console.log('All orders received by PendingApprovalsDashboard:', orders);
  console.log('Orders array type:', Array.isArray(orders) ? 'Array' : typeof orders);
  const pendingOrders = orders.filter(order => {
    console.log('Checking order:', {
      id: order.id,
      status: order.status,
      approval_status: order.approval_status,
      family_number: order.family_number
    });
    const isPending = order.status === 'pending' && order.approval_status === 'pending';
    console.log('Is order pending?', isPending);
    return isPending;
  });
  console.log('Filtered pending orders:', pendingOrders);

  const handleApprove = (order: Order) => {
    setSelectedOrder(order);
    // Initialize with current date if no pickup date
    let initialDate = new Date();
    
    // Set initial time to 10:00 AM
    initialDate.setHours(10, 0, 0, 0);
    
    // If order has a pickup date, use it for both date and time
    if (order.pickup_date && order.pickup_date instanceof Date && !isNaN(order.pickup_date.getTime())) {
      initialDate = new Date(order.pickup_date);
    }
    
    // Set the initial values
    setScheduledDate(initialDate);
    setScheduledTime(initialDate);
    
    // Set delivery type from order
    setDeliveryType(order.delivery_type);
    setSchedulingDialogOpen(true);
  };

  const handleScheduleConfirm = () => {
    if (selectedOrder && scheduledDate && scheduledTime) {
      try {
        // Create a new Date object using the scheduledDate
        const combinedDateTime = new Date(scheduledDate.getTime());
        
        // Set hours and minutes from scheduledTime
        combinedDateTime.setHours(
          scheduledTime.getHours(),
          scheduledTime.getMinutes(),
          0, 0
        );
        
        console.log("Scheduling order for:", {
          date: scheduledDate.toISOString(),
          time: scheduledTime.toISOString(),
          combined: combinedDateTime.toISOString()
        });
        
        // Create a complete updated order object
        const updatedOrder: Order = {
          ...selectedOrder,
          pickup_date: combinedDateTime,
          delivery_type: deliveryType,
          status: 'approved',
          approval_status: 'approved',
          updated_at: new Date()
        };
        
        // Pass the complete updated order to the parent component
        onStatusChange(updatedOrder, 'approved');
        
        // Reset the scheduling dialog
        setSchedulingDialogOpen(false);
        setScheduledDate(null);
        setScheduledTime(null);
        setSnackbarMessage('Order approved and scheduled successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error scheduling order:", error);
        setSnackbarMessage('Error scheduling order. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage('Please select both date and time before scheduling');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleScheduleCancel = () => {
    setSchedulingDialogOpen(false);
    setScheduledDate(null);
    setScheduledTime(null);
  };

  const handleDeny = (order: Order) => {
    const updatedOrder: Order = {
      ...order,
      status: 'cancelled',
      approval_status: 'rejected',
      updated_at: new Date()
    };
    onStatusChange(updatedOrder, 'cancelled');
    setSnackbarMessage('Order denied');
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

  const renderOrderCard = (order: Order) => {
    const client = clients.find(c => c.family_number === order.family_number);
    
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
                {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client?.phone1 || 'No phone'}
              </Typography>
            </Box>
            <Chip 
              label="Pending Approval" 
              color="warning"
              size="small"
            />
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CalendarIcon fontSize="small" />
              Pickup Date: {order.pickup_date ? format(new Date(order.pickup_date), 'MMMM d, yyyy') : 'Not specified'}
            </Typography>
            <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              Delivery Type: {order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}
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
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleApprove(order)}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleDeny(order)}
          >
            Deny
          </Button>
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
      <Typography variant="h5" gutterBottom>
        Pending Approvals
      </Typography>
      
      {pendingOrders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No pending orders that need approval.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {pendingOrders.map(order => (
            <Grid item xs={12} key={order.id}>
              {renderOrderCard(order)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this order? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Scheduling Dialog */}
      <Dialog
        open={schedulingDialogOpen}
        onClose={handleScheduleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Pickup/Delivery</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Delivery Type</InputLabel>
              <Select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as 'pickup' | 'delivery')}
                label="Delivery Type"
              >
                <MenuItem value="pickup">Pickup</MenuItem>
                <MenuItem value="delivery">Delivery</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ mb: 2 }}>
                <DatePicker
                  label="Pickup/Delivery Date"
                  value={scheduledDate}
                  onChange={(date) => setScheduledDate(date)}
                  shouldDisableDate={(date) => {
                    // Only allow Monday (1) and Wednesday (3)
                    const day = date.getDay();
                    return day !== 1 && day !== 3;
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      helperText: "Food pantry is only open on Mondays and Wednesdays"
                    }
                  }}
                />
              </Box>
              <Box>
                <TimePicker
                  label="Pickup/Delivery Time"
                  value={scheduledTime}
                  onChange={(time) => setScheduledTime(time)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal'
                    },
                    popper: {
                      sx: {
                        '& .MuiPickersLayout-root': {
                          '& .MuiTimePicker-root': {
                            minHeight: '350px'
                          }
                        }
                      }
                    }
                  }}
                  ampm
                  views={['hours', 'minutes']}
                />
              </Box>
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleScheduleCancel}>Cancel</Button>
          <Button 
            onClick={handleScheduleConfirm} 
            color="primary" 
            variant="contained"
            disabled={!scheduledDate || !scheduledTime}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
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