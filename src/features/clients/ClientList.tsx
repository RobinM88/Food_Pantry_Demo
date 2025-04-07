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
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  SelectChangeEvent
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Client, MemberStatus } from '../../types';
import ClientDetails from './ClientDetails';

interface ClientListProps {
  clients: Client[];
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
}

export default function ClientList({
  clients,
  onViewClient,
  onEditClient,
  onDeleteClient
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filter clients based on search query and filters
  const filteredClients = clients.filter(client => {
    const clientName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) || 
      client.familyNumber.includes(searchLower) ||
      client.phone1?.toLowerCase().includes(searchLower) || '';
    
    const matchesStatus = filterStatus === 'all' || client.memberStatus === filterStatus;
    
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
    onEditClient(client);
  };

  const handleDeleteClient = (client: Client) => {
    onDeleteClient(client);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Clients
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and manage client information
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Clients"
              variant="outlined"
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
              <InputLabel>Status</InputLabel>
              <Select<MemberStatus | 'all'>
                value={filterStatus}
                label="Status"
                onChange={(event: SelectChangeEvent<MemberStatus | 'all'>) => {
                  setFilterStatus(event.target.value as MemberStatus | 'all');
                  setPage(0);
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={MemberStatus.Active}>Active</MenuItem>
                <MenuItem value={MemberStatus.Inactive}>Inactive</MenuItem>
                <MenuItem value={MemberStatus.Pending}>Pending</MenuItem>
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
                  <TableRow key={client.familyNumber}>
                    <TableCell>{client.familyNumber}</TableCell>
                    <TableCell>{`${client.firstName} ${client.lastName}`}</TableCell>
                    <TableCell>{client.phone1}</TableCell>
                    <TableCell>{client.familySize}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.memberStatus}
                        color={client.memberStatus === MemberStatus.Active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {client.lastVisit ? format(new Date(client.lastVisit), 'MMM d, yyyy') : 'Never'}
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
              onEdit={onEditClient}
              onDelete={onDeleteClient}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 