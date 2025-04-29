import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  Stack,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
  Block as CancelIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Order Details
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton 
                aria-label="edit" 
                onClick={() => onEdit(order)}
                sx={{ 
                  bgcolor: theme.palette.primary.main + '10',
                  '&:hover': { bgcolor: theme.palette.primary.main + '20' }
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
              <IconButton 
                aria-label="delete" 
                onClick={handleDeleteClick}
                sx={{ 
                  bgcolor: theme.palette.error.main + '10',
                  '&:hover': { bgcolor: theme.palette.error.main + '20' }
                }}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </Stack>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">Client</Typography>
              <Typography variant="body1">{`${client?.first_name} ${client?.last_name}`}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">Family Number</Typography>
              <Typography variant="body1">{order.family_number || 'Not assigned'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                    Client Information
                  </Typography>
                  <List disablePadding>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <PersonIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${client.first_name} ${client.last_name}`}
                        secondary="Client Name"
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <PhoneIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={client.phone1}
                        secondary="Phone"
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    {client.email && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <EmailIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={client.email}
                          secondary="Email"
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                    Order Information
                  </Typography>
                  <List disablePadding>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CartIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${order.number_of_boxes} boxes`}
                        secondary="Order Size"
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CalendarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={order.pickup_date 
                          ? format(new Date(order.pickup_date), 'MMM d, yyyy') 
                          : 'Not scheduled'}
                        secondary="Pickup Date"
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Chip 
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                          sx={{ minWidth: 80 }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Status"
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {order.notes && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                      Additional Information
                    </Typography>
                    <List disablePadding>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <NotesIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={order.notes}
                          secondary="Notes"
                          primaryTypographyProps={{ 
                            fontWeight: 500,
                            sx: { whiteSpace: 'pre-wrap' }
                          }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {order.status === 'pending' && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                      Order Actions
                    </Typography>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={2}
                      sx={{ mt: 1 }}
                    >
                      <Button 
                        startIcon={<ApproveIcon />} 
                        variant="contained"
                        color="success"
                        onClick={() => handleStatusChangeClick('approved')}
                        fullWidth={isMobile}
                      >
                        Approve
                      </Button>
                      <Button 
                        startIcon={<DenyIcon />} 
                        variant="contained"
                        color="error"
                        onClick={() => handleStatusChangeClick('cancelled')}
                        fullWidth={isMobile}
                      >
                        Deny
                      </Button>
                      <Button 
                        startIcon={<CancelIcon />} 
                        variant="contained"
                        color="warning"
                        onClick={() => handleStatusChangeClick('cancelled')}
                        fullWidth={isMobile}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {order.status === 'approved' && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                      Order Actions
                    </Typography>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={2}
                      sx={{ mt: 1 }}
                    >
                      <Button 
                        startIcon={<ApproveIcon />} 
                        variant="contained"
                        color="success"
                        onClick={() => handleStatusChangeClick('ready')}
                        fullWidth={isMobile}
                      >
                        Mark as Ready
                      </Button>
                      <Button 
                        startIcon={<CancelIcon />} 
                        variant="contained"
                        color="warning"
                        onClick={() => handleStatusChangeClick('cancelled')}
                        fullWidth={isMobile}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {order.status === 'ready' && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                      Order Actions
                    </Typography>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={2}
                      sx={{ mt: 1 }}
                    >
                      <Button 
                        startIcon={<ApproveIcon />} 
                        variant="contained"
                        color="success"
                        onClick={() => handleStatusChangeClick('picked_up')}
                        fullWidth={isMobile}
                      >
                        Mark as Picked Up
                      </Button>
                      <Button 
                        startIcon={<CancelIcon />} 
                        variant="contained"
                        color="warning"
                        onClick={() => handleStatusChangeClick('cancelled')}
                        fullWidth={isMobile}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Confirm Delete</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography>
            Are you sure you want to delete this order? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={statusChangeDialogOpen}
        onClose={handleStatusChangeCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Confirm Status Change</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography>
            Are you sure you want to {getStatusChangeMessage(pendingStatusChange || 'pending')} this order?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleStatusChangeCancel}>Cancel</Button>
          <Button 
            onClick={handleStatusChangeConfirm} 
            color="primary"
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 