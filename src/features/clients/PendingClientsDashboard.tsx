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
  Alert,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  PauseCircle as PauseCircleIcon,
} from '@mui/icons-material';
import { Client, MemberStatus } from '../../types';

interface PendingClientsDashboardProps {
  clients: Client[];
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onStatusChange: (client: Client, newStatus: MemberStatus) => void;
}

export default function PendingClientsDashboard({
  clients,
  onViewClient,
  onEditClient,
  onDeleteClient,
  onStatusChange
}: PendingClientsDashboardProps) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>('success');

  // Filter clients to only show pending ones
  const pendingClients = clients.filter(client => client.member_status === MemberStatus.Pending);

  const handleApprove = (client: Client) => {
    onStatusChange(client, MemberStatus.Active);
  };

  const handleDeny = (client: Client) => {
    onStatusChange(client, MemberStatus.Denied);
  };

  const handleSuspend = (client: Client) => {
    onStatusChange(client, MemberStatus.Suspended);
  };

  const handleBan = (client: Client) => {
    onStatusChange(client, MemberStatus.Banned);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const renderClientCard = (client: Client) => {
    return (
      <Card key={client.id} sx={{ 
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
                {`${client.first_name} ${client.last_name}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Family #: {client.family_number}
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
              <PersonIcon fontSize="small" />
              Family Size: {client.family_size}
            </Typography>
            <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              Phone: {client.phone1}
            </Typography>
            {client.address && (
              <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Address: {client.address}
                {client.apt_number && ` Apt ${client.apt_number}`}
              </Typography>
            )}
            {client.is_unhoused && (
              <Typography variant="body2" component="div">
                <Chip label="Unhoused" size="small" />
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
            onClick={() => handleApprove(client)}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleDeny(client)}
          >
            Deny
          </Button>
          <Button
            size="small"
            variant="contained"
            color="warning"
            startIcon={<PauseCircleIcon />}
            onClick={() => handleSuspend(client)}
          >
            Suspend
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<BlockIcon />}
            onClick={() => handleBan(client)}
          >
            Ban
          </Button>
          <IconButton 
            size="small"
            onClick={() => onViewClient(client)}
            sx={{ ml: 'auto' }}
          >
            <EditIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Pending Client Approvals
      </Typography>
      
      {pendingClients.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No pending clients to approve</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {pendingClients.map(client => (
            <Grid item xs={12} md={6} lg={4} key={client.id}>
              {renderClientCard(client)}
            </Grid>
          ))}
        </Grid>
      )}

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