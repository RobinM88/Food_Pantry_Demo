import { useState, useEffect } from 'react';
import { Box, Button, Container, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import ClientList from '../features/clients/ClientList';
import ClientForm from '../features/clients/ClientForm';
import ClientDetails from '../features/clients/ClientDetails';
import PendingClientsDashboard from '../features/clients/PendingClientsDashboard';
import { Client, NewClient, UpdateClient, MemberStatus } from '../types';
import { generateNextFamilyNumber } from '../utils/familyNumberUtils';
import { ClientService } from '../services/client.service';

type ViewMode = 'list' | 'add' | 'edit' | 'view' | 'pending';

interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function Clients() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const clientsData = await ClientService.getAll();
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
        setNotification({
          open: true,
          message: 'Error loading clients',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    // Update view mode based on URL
    if (location.pathname.endsWith('/pending')) {
      setViewMode('pending');
    } else if (location.pathname === '/clients') {
      setViewMode('list');
    }
  }, [location.pathname]);

  const handleAddClient = () => {
    setSelectedClient(null);
    setViewMode('add');
    navigate('/clients/add');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('edit');
    navigate('/clients/edit');
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('view');
    navigate('/clients/view');
  };

  const handleStatusChange = async (client: Client, newStatus: MemberStatus) => {
    try {
      const updatedClient: Client = {
        ...client,
        memberStatus: newStatus,
        updatedAt: new Date()
      };
      
      await ClientService.update(client.id, updatedClient);
      const updatedClients = await ClientService.getAll();
      setClients(updatedClients);
      
      setNotification({
        open: true,
        message: `Client ${newStatus === MemberStatus.Active ? 'approved' : 'denied'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating client status:', error);
      setNotification({
        open: true,
        message: 'Error updating client status',
        severity: 'error'
      });
    }
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      await ClientService.delete(client.id);
      const updatedClients = await ClientService.getAll();
      setClients(updatedClients);
      
      if (viewMode === 'view' && selectedClient?.id === client.id) {
        setSelectedClient(null);
        setViewMode('list');
      }

      setNotification({
        open: true,
        message: 'Client deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      setNotification({
        open: true,
        message: 'Error deleting client',
        severity: 'error'
      });
    }
  };

  const calculateFamilySize = (data: NewClient | UpdateClient) => {
    const baseSize = (data.adults || 0) + (data.schoolAged || 0) + (data.smallChildren || 0);
    if (data.isTemporary && data.temporaryMembers) {
      return baseSize + 
        (data.temporaryMembers.adults || 0) + 
        (data.temporaryMembers.schoolAged || 0) + 
        (data.temporaryMembers.smallChildren || 0);
    }
    return baseSize;
  };

  const handleSaveClient = async (clientData: NewClient | UpdateClient) => {
    try {
      if ('familyNumber' in clientData && clientData.familyNumber) {
        // This is an update
        const existingClient = clients.find(c => c.familyNumber === clientData.familyNumber);
        if (!existingClient) {
          throw new Error('Client not found');
        }

        const updatedClient: Client = {
          ...existingClient,
          ...clientData,
          familySize: calculateFamilySize(clientData),
          updatedAt: new Date(),
          // Preserve these fields from the existing client
          createdAt: existingClient.createdAt,
          lastVisit: existingClient.lastVisit,
          totalVisits: existingClient.totalVisits,
          totalThisMonth: existingClient.totalThisMonth
        };

        await ClientService.update(existingClient.id, updatedClient);
        const updatedClients = await ClientService.getAll();
        setClients(updatedClients);
        
        setNotification({
          open: true,
          message: 'Client updated successfully',
          severity: 'success',
        });
        
        // Preserve navigation state
        const state = location.state as { 
          fromPhoneLog?: boolean; 
          phoneNumber?: string;
          phoneLogState?: any;
        } | null;
        
        if (state?.fromPhoneLog) {
          // Return to phone logs with preserved state
          navigate('/phone-logs', {
            state: {
              fromClientAdd: true,
              phoneNumber: clientData.phone1,
              phoneLogState: state.phoneLogState
            },
            replace: true
          });
        } else {
          // Normal navigation back to client list
          setViewMode('list');
          navigate('/clients');
        }
      } else {
        // This is a new client
        if (!clientData.firstName || !clientData.lastName || 
            !clientData.phone1 || !clientData.zipCode ||
            (!clientData.isUnhoused && !clientData.address)) {
          throw new Error('Please fill in all required fields');
        }

        const newFamilyNumber = generateNextFamilyNumber(clients);
        const newClient: Client = {
          id: `c${Date.now()}`,
          familyNumber: newFamilyNumber,
          firstName: clientData.firstName.toLowerCase(),
          lastName: clientData.lastName.toLowerCase(),
          email: clientData.email || '',
          address: clientData.isUnhoused ? '' : (clientData.address || ''),
          aptNumber: clientData.aptNumber || '',
          zipCode: clientData.zipCode,
          phone1: clientData.phone1,
          phone2: clientData.phone2 || '',
          isUnhoused: clientData.isUnhoused || false,
          isTemporary: clientData.isTemporary || false,
          adults: clientData.adults || 0,
          schoolAged: clientData.schoolAged || 0,
          smallChildren: clientData.smallChildren || 0,
          temporaryMembers: clientData.temporaryMembers || {
            adults: 0,
            schoolAged: 0,
            smallChildren: 0
          },
          familySize: calculateFamilySize(clientData),
          foodNotes: clientData.foodNotes || '',
          officeNotes: clientData.officeNotes || '',
          totalVisits: 0,
          totalThisMonth: 0,
          memberStatus: MemberStatus.Pending,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastVisit: new Date()
        };

        // Remove any fields that don't exist in the database before sending
        const { connectedFamilies, ...clientToSave } = newClient;

        await ClientService.create(clientToSave);
        const updatedClients = await ClientService.getAll();
        setClients(updatedClients);
        
        setNotification({
          open: true,
          message: 'Client added successfully',
          severity: 'success',
        });

        // Handle navigation based on where we came from
        const state = location.state as { 
          fromPhoneLog?: boolean; 
          phoneNumber?: string;
          phoneLogState?: any;
        } | null;

        if (state?.fromPhoneLog) {
          navigate('/phone-logs', {
            state: {
              fromClientAdd: true,
              phoneNumber: clientData.phone1,
              phoneLogState: state.phoneLogState
            },
            replace: true
          });
        } else {
          setViewMode('list');
          navigate('/clients');
        }
      }
    } catch (error) {
      console.error('Error saving client:', error);
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Error saving client',
        severity: 'error'
      });
    }
  };

  const handleCancel = () => {
    const state = location.state as { fromPhoneLog?: boolean; phoneNumber?: string } | null;
    if (state?.fromPhoneLog) {
      navigate('/phone-logs', { state });
    } else {
      setViewMode('list');
      navigate('/clients');
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {viewMode !== 'list' && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mb: 3 }}
        >
          Back to Clients
        </Button>
      )}

      <Routes>
        <Route path="/" element={
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddClient}
                size="large"
              >
                Add Client
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/clients/pending')}
                size="large"
              >
                View Pending Clients
              </Button>
            </Box>
            <ClientList
              clients={clients}
              onEdit={handleEditClient}
              onView={handleViewClient}
              onDelete={handleDeleteClient}
            />
          </Box>
        } />
        <Route path="/add" element={
          <ClientForm
            onSubmit={handleSaveClient}
            onCancel={handleCancel}
            allClients={clients}
          />
        } />
        <Route path="/edit" element={
          selectedClient ? (
            <ClientForm
              client={selectedClient}
              onSubmit={handleSaveClient}
              onCancel={handleCancel}
              allClients={clients}
            />
          ) : (
            <Navigate to="/clients" replace />
          )
        } />
        <Route path="/view" element={
          selectedClient ? (
            <ClientDetails
              client={selectedClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <Navigate to="/clients" replace />
          )
        } />
        <Route path="/pending" element={
          <PendingClientsDashboard
            clients={clients.filter(c => c.memberStatus === MemberStatus.Pending)}
            onApprove={(client) => handleStatusChange(client, MemberStatus.Active)}
            onDeny={(client) => handleStatusChange(client, MemberStatus.Denied)}
            onView={handleViewClient}
          />
        } />
      </Routes>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 