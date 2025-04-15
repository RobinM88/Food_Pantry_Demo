import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  SelectChangeEvent,
  Button,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Client, MemberStatus } from '../../types';
import ClientDetails from './ClientDetails';

interface ClientListProps {
  clients: Client[];
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onAdd: () => void;
  onPendingClick?: () => void;
}

export default function ClientList({
  clients,
  onViewClient,
  onEditClient,
  onDeleteClient,
  onAdd,
  onPendingClick
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filter clients based on search query and filters
  const filteredClients = clients.filter(client => {
    const clientName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) || 
      client.family_number.includes(searchLower) ||
      client.phone1?.toLowerCase().includes(searchLower) || '';
    
    const matchesStatus = filterStatus === 'all' || client.member_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setDetailsDialogOpen(true);
    onViewClient(client);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
  };

  const handleEditClient = (client: Client) => {
    // Close the details dialog if it's open
    setDetailsDialogOpen(false);
    // Call the parent's edit handler
    onEditClient(client);
  };

  const handleDeleteClient = (client: Client) => {
    onDeleteClient(client);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <div>
            <Typography variant="h5" component="h2" gutterBottom>
              Clients
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              View and manage client information
            </Typography>
          </div>
          <Stack direction="row" spacing={2}>
            {onPendingClick && (
              <Button
                variant="outlined"
                color="warning"
                onClick={onPendingClick}
              >
                Pending Clients
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={onAdd}
            >
              Add Client
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0 }}
            >
              Search
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                height: '40px',
                '.MuiOutlinedInput-root': {
                  height: '40px',
                },
                '.MuiOutlinedInput-input': {
                  padding: '8px 14px',
                  height: '24px',
                  lineHeight: '24px',
                },
                mt: 0
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" sx={{ ml: 0.5, height: '20px' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0 }}
            >
              Filter by Status
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filterStatus}
                onChange={(event: SelectChangeEvent<MemberStatus | 'all'>) => {
                  setFilterStatus(event.target.value as MemberStatus | 'all');
                  setPage(0);
                }}
                displayEmpty
                sx={{
                  height: '40px',
                  '.MuiSelect-select': {
                    padding: '8px 14px !important',
                    height: '24px !important',
                    lineHeight: '24px !important',
                    display: 'flex !important',
                    alignItems: 'center !important',
                  }
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={MemberStatus.Active}>Active</MenuItem>
                <MenuItem value={MemberStatus.Inactive}>Inactive</MenuItem>
                <MenuItem value={MemberStatus.Pending}>Pending</MenuItem>
                <MenuItem value={MemberStatus.Suspended}>Suspended</MenuItem>
                <MenuItem value={MemberStatus.Banned}>Banned</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Family #</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Family Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.family_number}</TableCell>
                    <TableCell>{`${client.first_name} ${client.last_name}`}</TableCell>
                    <TableCell>{client.phone1}</TableCell>
                    <TableCell>{client.family_size}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.member_status}
                        color={
                          client.member_status === MemberStatus.Active ? 'success' :
                          client.member_status === MemberStatus.Pending ? 'warning' :
                          client.member_status === MemberStatus.Suspended || 
                          client.member_status === MemberStatus.Banned ? 'error' :
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {client.last_visit ? format(new Date(client.last_visit), 'MMM d, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewClient(client)}
                        title="View Details"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClient(client)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClient(client)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredClients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Client Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailsDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedClient && (
            <ClientDetails
              client={selectedClient}
              allClients={clients}
              onEdit={(client) => {
                handleCloseDetailsDialog();
                onEditClient(client);
              }}
              onDelete={onDeleteClient}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 