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
  TextField,
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
  const pendingOrders = orders.filter(order => order.status === 'pending');

  const handleApprove = (order: Order) => {
    setSelectedOrder(order);
    // If order has a pickup date, use it for both date and time
    if (order.pickupDate) {
      const pickupDate = new Date(order.pickupDate);
      setScheduledDate(pickupDate);
      setScheduledTime(pickupDate);
    }
    // Set delivery type from order
    setDeliveryType(order.deliveryType);
    setSchedulingDialogOpen(true);
  };

  const handleScheduleConfirm = () => {
    if (selectedOrder && scheduledDate && scheduledTime) {
      // Combine date and time
      const combinedDateTime = new Date(scheduledDate);
      combinedDateTime.setHours(scheduledTime.getHours());
      combinedDateTime.setMinutes(scheduledTime.getMinutes());
      
      // Update the order with the scheduled date and change status to 'scheduled'
      const updatedOrder: Order = {
        ...selectedOrder,
        pickupDate: combinedDateTime,
        deliveryType: deliveryType,
        status: 'scheduled',
        updatedAt: new Date()
      };
      
      onStatusChange(updatedOrder, 'scheduled');
      setSchedulingDialogOpen(false);
      setSnackbarMessage('Order scheduled successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  };

  const handleScheduleCancel = () => {
    setSchedulingDialogOpen(false);
    setScheduledDate(null);
    setScheduledTime(null);
  };

  const handleDeny = (order: Order) => {
    onStatusChange(order, 'denied');
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
    const client = clients.find(c => c.familyNumber === order.familySearchId);
    
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
              label="Pending Approval" 
              color="warning"
              size="small"
            />
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CalendarIcon fontSize="small" />
              Pickup Date: {order.pickupDate ? format(new Date(order.pickupDate), 'MMMM d, yyyy') : 'Not specified'}
            </Typography>
            <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              Delivery Type: {order.deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}
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
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal'
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
                    }
                  }}
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