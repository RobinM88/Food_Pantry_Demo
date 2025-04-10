import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Block as CancelIcon
} from '@mui/icons-material';
import { Order, Client } from '../../types';
import { format } from 'date-fns';

interface OrderDetailsProps {
  order: Order;
  client: Client;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onStatusChange: (order: Order, newStatus: Order['status']) => void;
}

export default function OrderDetails({ 
  order, 
  client, 
  onEdit, 
  onDelete,
  onStatusChange
}: OrderDetailsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<Order['status'] | null>(null);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(order);
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleStatusChangeClick = (newStatus: Order['status']) => {
    setPendingStatusChange(newStatus);
    setStatusChangeDialogOpen(true);
  };

  const handleStatusChangeConfirm = () => {
    if (pendingStatusChange) {
      onStatusChange(order, pendingStatusChange);
      setStatusChangeDialogOpen(false);
      setPendingStatusChange(null);
    }
  };

  const handleStatusChangeCancel = () => {
    setStatusChangeDialogOpen(false);
    setPendingStatusChange(null);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'primary';
      case 'ready':
        return 'secondary';
      case 'picked_up':
        return 'success';
      case 'cancelled':
      case 'no_show':
        return 'error';
      case 'in_queue':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusChangeMessage = (status: Order['status']) => {
    switch (status) {
      case 'approved':
        return 'approve';
      case 'cancelled':
        return 'cancel';
      case 'completed':
        return 'complete';
      case 'picked_up':
        return 'mark as picked up';
      case 'no_show':
        return 'mark as no show';
      case 'ready':
        return 'mark as ready';
      case 'scheduled':
        return 'schedule';
      case 'in_queue':
        return 'add to queue';
      default:
        return 'change status to';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Order Details
          </Typography>
          <Box>
            <IconButton 
              aria-label="edit" 
              onClick={() => onEdit(order)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              aria-label="delete" 
              onClick={handleDeleteClick}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Client Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={`${client.firstName} ${client.lastName}`} 
                  secondary="Client Name" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={client.phone1} 
                  secondary="Phone" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={client.email} 
                  secondary="Email" 
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Order Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CartIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={`${order.numberOfBoxes} boxes`} 
                  secondary="Order Size" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={order.pickupDate ? format(new Date(order.pickupDate), 'MMMM d, yyyy') : 'Not scheduled'} 
                  secondary="Pickup Date" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Chip 
                    label={order.status} 
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText 
                  primary="Status" 
                />
              </ListItem>
            </List>
          </Grid>

          {order.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <NotesIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={order.notes} 
                    secondary="Notes" 
                  />
                </ListItem>
              </List>
            </Grid>
          )}

          {order.status === 'pending' && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Order Actions
              </Typography>
              <ButtonGroup variant="contained" sx={{ mt: 1 }}>
                <Button 
                  startIcon={<ApproveIcon />} 
                  color="success"
                  onClick={() => handleStatusChangeClick('approved')}
                >
                  Approve
                </Button>
                <Button 
                  startIcon={<DenyIcon />} 
                  color="error"
                  onClick={() => handleStatusChangeClick('cancelled')}
                >
                  Deny
                </Button>
                <Button 
                  startIcon={<CancelIcon />} 
                  color="warning"
                  onClick={() => handleStatusChangeClick('cancelled')}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Grid>
          )}

          {order.status === 'approved' && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Order Actions
              </Typography>
              <ButtonGroup variant="contained" sx={{ mt: 1 }}>
                <Button 
                  startIcon={<ApproveIcon />} 
                  color="success"
                  onClick={() => handleStatusChangeClick('ready')}
                >
                  Mark as Ready
                </Button>
                <Button 
                  startIcon={<CancelIcon />} 
                  color="warning"
                  onClick={() => handleStatusChangeClick('cancelled')}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Grid>
          )}

          {order.status === 'ready' && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Order Actions
              </Typography>
              <ButtonGroup variant="contained" sx={{ mt: 1 }}>
                <Button 
                  startIcon={<ApproveIcon />} 
                  color="success"
                  onClick={() => handleStatusChangeClick('picked_up')}
                >
                  Mark as Picked Up
                </Button>
                <Button 
                  startIcon={<CancelIcon />} 
                  color="warning"
                  onClick={() => handleStatusChangeClick('cancelled')}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Grid>
          )}
        </Grid>
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

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={statusChangeDialogOpen}
        onClose={handleStatusChangeCancel}
      >
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {getStatusChangeMessage(pendingStatusChange || 'pending')} this order?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusChangeCancel}>Cancel</Button>
          <Button onClick={handleStatusChangeConfirm} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 