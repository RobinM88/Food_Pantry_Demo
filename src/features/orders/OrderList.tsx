import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Block as CancelIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Order, Client } from '../../types';
import { format } from 'date-fns';

interface OrderListProps {
  orders: Order[];
  clients: Client[];
  onAddOrder: () => void;
  onEditOrder: (order: Order) => void;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onStatusChange: (order: Order, newStatus: Order['status']) => void;
}

export default function OrderList({
  orders,
  clients,
  onAddOrder,
  onEditOrder,
  onViewOrder,
  onDeleteOrder,
  onStatusChange
}: OrderListProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleChangePage = (event: unknown, newPage: number) => {
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
    const client = clients.find(c => c.id === order.clientId);
    const searchLower = searchQuery.toLowerCase();
    return (
      client?.firstName.toLowerCase().includes(searchLower) ||
      client?.lastName.toLowerCase().includes(searchLower) ||
      order.items.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Orders
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddOrder}
        >
          Add Order
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search orders..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Pickup Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {order.items}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.pickupDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onViewOrder(order)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Order">
                        <IconButton
                          size="small"
                          onClick={() => onEditOrder(order)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, order)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Status Change Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {selectedOrder?.status === 'pending' && (
          <>
            <MenuItem onClick={() => handleStatusChange('approved')}>
              <ListItemIcon>
                <ApproveIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Approve</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('denied')}>
              <ListItemIcon>
                <DenyIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Deny</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('cancelled')}>
              <ListItemIcon>
                <CancelIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>Cancel</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        {selectedOrder?.status === 'approved' && (
          <>
            <MenuItem onClick={() => handleStatusChange('ready')}>
              <ListItemIcon>
                <ApproveIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Mark as Ready</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('cancelled')}>
              <ListItemIcon>
                <CancelIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>Cancel</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        {selectedOrder?.status === 'ready' && (
          <>
            <MenuItem onClick={() => handleStatusChange('picked_up')}>
              <ListItemIcon>
                <ApproveIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Mark as Picked Up</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('cancelled')}>
              <ListItemIcon>
                <CancelIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>Cancel</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        <MenuItem onClick={() => {
          if (selectedOrder) {
            onDeleteOrder(selectedOrder);
            handleMenuClose();
          }
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
} 