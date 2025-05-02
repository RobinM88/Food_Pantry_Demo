import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Stack,
  Grid,
  Button,
  Alert,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  Inventory as BoxesIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Order } from '../../types';
import { format } from 'date-fns';

interface OrderListProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onStatusChange: (order: Order, newStatus: Order['status']) => void;
}

export default function OrderList({
  orders,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange
}: OrderListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleStatusChange = (newStatus: Order['status']) => {
    if (selectedOrder) {
      onStatusChange(selectedOrder, newStatus);
      handleMenuClose();
    }
  };

  const getStatusColor = (status: Order['status']) => {
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

  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.Client?.first_name?.toLowerCase().includes(searchLower) ||
      order.Client?.last_name?.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.number_of_boxes.toString().includes(searchLower)
    );
  });

  const renderMobileView = () => (
    <Stack spacing={2}>
      {filteredOrders
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((order) => (
          <Card key={order.id} variant="outlined" data-testid="order-card">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {order.Client ? `${order.Client.first_name} ${order.Client.last_name}` : 'Unknown Client'}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{ minWidth: 80 }}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BoxesIcon color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {order.number_of_boxes} {order.number_of_boxes === 1 ? 'box' : 'boxes'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarIcon color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {order.pickup_date ? format(new Date(order.pickup_date), 'MMM d, yyyy') : 'Not set'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => onViewOrder(order)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => onEditOrder(order)}
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, order)}
                      aria-label="More Actions"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
    </Stack>
  );

  const renderDesktopView = () => (
    <TableContainer component={Paper} elevation={0} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Client</TableCell>
            <TableCell>Boxes</TableCell>
            <TableCell>Pickup Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredOrders
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    <Typography>
                      {order.Client ? `${order.Client.first_name} ${order.Client.last_name}` : 'Unknown Client'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BoxesIcon color="action" />
                    <Typography>
                      {order.number_of_boxes} boxes
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="action" />
                    <Typography>
                      {order.pickup_date ? format(new Date(order.pickup_date), 'MMM d, yyyy') : 'Not set'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                    sx={{ minWidth: 80 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewOrder(order)}
                        sx={{ 
                          bgcolor: theme.palette.primary.main + '10',
                          '&:hover': { bgcolor: theme.palette.primary.main + '20' }
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Order">
                      <IconButton
                        size="small"
                        onClick={() => onEditOrder(order)}
                        sx={{ 
                          bgcolor: theme.palette.primary.main + '10',
                          '&:hover': { bgcolor: theme.palette.primary.main + '20' }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, order)}
                        sx={{ 
                          bgcolor: theme.palette.grey[100],
                          '&:hover': { bgcolor: theme.palette.grey[200] }
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 3 
          }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Orders
            </Typography>
            <TextField
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ 
                maxWidth: { sm: 300 },
                bgcolor: 'background.paper'
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {filteredOrders.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No orders found matching your search criteria.
            </Alert>
          ) : (
            <>
              {isMobile ? renderMobileView() : renderDesktopView()}
              
              <TablePagination
                component="div"
                count={filteredOrders.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {menuAnchorEl && (
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {selectedOrder?.status === 'pending' && (
            <>
              <MenuItem onClick={() => handleStatusChange('approved')}>
                <ListItemIcon>
                  <ApproveIcon color="success" />
                </ListItemIcon>
                <ListItemText>Approve</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange('denied')}>
                <ListItemIcon>
                  <DenyIcon color="error" />
                </ListItemIcon>
                <ListItemText>Deny</ListItemText>
              </MenuItem>
            </>
          )}
          <MenuItem onClick={() => selectedOrder && onDeleteOrder(selectedOrder)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      )}
    </Box>
  );
} 