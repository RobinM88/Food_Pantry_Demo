import { useState, useEffect } from 'react';
import { Box, Button, Container, Snackbar, Alert, CircularProgress, AlertTitle } from '@mui/material';
import { ArrowBack as ArrowBackIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import ClientList from '../features/clients/ClientList';
import ClientForm from '../features/clients/ClientForm';
import ClientDetails from '../features/clients/ClientDetails';
import PendingClientsDashboard from '../features/clients/PendingClientsDashboard';
import { Client, NewClient, UpdateClient, MemberStatus } from '../types';
import { generateNextFamilyNumber } from '../utils/familyNumberUtils';
import { ClientService } from '../services/client.service';
import { config } from '../config';

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
  const [pendingClients, setPendingClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all clients
        const clientsData = await ClientService.getAll();
        setClients(clientsData);

        // Load pending clients specifically
        if (viewMode === 'pending') {
          const pendingData = await ClientService.getByStatus(MemberStatus.Pending);
          setPendingClients(pendingData);
        }
        
        // Debug - log clients in IndexedDB
        if (config.features.offlineMode) {
          await ClientService.debugIndexedDB();
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        setNotification({
          open: true,
          message: isOffline 
            ? 'Working in offline mode with cached data' 
            : 'Error loading clients',
          severity: isOffline ? 'warning' : 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isOffline, viewMode]);

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
      const updatedClient = await ClientService.update(client.id, {
        ...client,
        member_status: newStatus
      });

      setClients(prevClients => 
        prevClients.map(c => 
          c.id === updatedClient.id ? updatedClient : c
        )
      );

      setNotification({
        open: true,
        message: `Client ${newStatus === MemberStatus.Active ? 'approved' : 'status updated'} successfully`,
        severity: 'success'
      });

      // If we're in pending view and the client was approved, they should no longer appear in the list
      if (viewMode === 'pending' && newStatus === MemberStatus.Active) {
        navigate('/clients');
      }
    } catch (error) {
      console.error('Error updating client status:', error);
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Error updating client status',
        severity: 'error'
      });
    }
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      await ClientService.delete(client.id);
      
      // Immediately update the UI by filtering out the deleted client
      setClients(prevClients => prevClients.filter(c => c.id !== client.id));
      
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
    const baseSize = (data.adults || 0) + (data.school_aged || 0) + (data.small_children || 0);
    if (data.is_temporary && data.temporary_members) {
      return baseSize + 
        (data.temporary_members.adults || 0) + 
        (data.temporary_members.school_aged || 0) + 
        (data.temporary_members.small_children || 0);
    }
    return baseSize;
  };

  const handleSaveClient = async (clientData: NewClient | UpdateClient) => {
    try {
      if ('family_number' in clientData && clientData.family_number) {
        // This is an update
        const existingClient = clients.find(c => c.family_number === clientData.family_number);
        if (!existingClient) {
          throw new Error('Client not found');
        }

        const updatedClient: Client = {
          ...existingClient,
          ...clientData,
          family_size: calculateFamilySize(clientData),
          updated_at: new Date(),
          // Preserve these fields from the existing client
          created_at: existingClient.created_at,
          last_visit: existingClient.last_visit,
          total_visits: existingClient.total_visits,
          total_this_month: existingClient.total_this_month
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
        if (!clientData.first_name || !clientData.last_name || 
            !clientData.phone1 || !clientData.zip_code ||
            (!clientData.is_unhoused && !clientData.address)) {
          throw new Error('Please fill in all required fields');
        }

        const newFamilyNumber = generateNextFamilyNumber(clients);
        const newClient: Client = {
          id: `c${Date.now()}`,
          family_number: newFamilyNumber,
          first_name: clientData.first_name.toLowerCase(),
          last_name: clientData.last_name.toLowerCase(),
          email: clientData.email || '',
          address: clientData.is_unhoused ? '' : (clientData.address || ''),
          apt_number: clientData.apt_number || '',
          zip_code: clientData.zip_code,
          phone1: clientData.phone1,
          phone2: clientData.phone2 || '',
          is_unhoused: clientData.is_unhoused || false,
          is_temporary: clientData.is_temporary || false,
          adults: clientData.adults || 0,
          school_aged: clientData.school_aged || 0,
          small_children: clientData.small_children || 0,
          temporary_members: clientData.temporary_members || {
            adults: 0,
            school_aged: 0,
            small_children: 0
          },
          family_size: calculateFamilySize(clientData),
          food_notes: clientData.food_notes || '',
          office_notes: clientData.office_notes || '',
          total_visits: 0,
          total_this_month: 0,
          member_status: MemberStatus.Pending,
          created_at: new Date(),
          updated_at: new Date(),
          last_visit: new Date()
        };

        // Save the new client directly
        await ClientService.create(newClient);
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

  const handlePendingClick = () => {
    setViewMode('pending');
    navigate('/clients/pending');
  };

  // Debug function for development
  const debugOfflineClients = async () => {
    await ClientService.debugIndexedDB();
    const pendingClientsData = await ClientService.getByStatus(MemberStatus.Pending);
    setPendingClients(pendingClientsData);
    setNotification({
      open: true,
      message: `Found ${pendingClientsData.length} pending clients in IndexedDB`,
      severity: 'info'
    });
  };

  return (
    <Container maxWidth="lg">
      {isOffline && config.features.offlineMode && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Alert 
            severity="warning" 
            sx={{ mb: 1 }}
            icon={<WifiOffIcon />}
          >
            <AlertTitle>Offline Mode</AlertTitle>
            You are currently working offline. Changes will be synchronized when you reconnect.
          </Alert>
          
          {viewMode === 'pending' && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={debugOfflineClients}
              sx={{ mt: 1, mr: 1 }}
            >
              Check IndexedDB for pending clients
            </Button>
          )}
        </Box>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {viewMode !== 'list' && viewMode !== 'pending' && (
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={handleCancel}
              sx={{ mb: 2 }}
            >
              Back to List
            </Button>
          )}

          <Routes>
            <Route 
              path="/" 
              element={
                <ClientList 
                  clients={clients} 
                  onViewClient={handleViewClient}
                  onEditClient={handleEditClient}
                  onDeleteClient={handleDeleteClient}
                  onAdd={handleAddClient}
                  onPendingClick={handlePendingClick}
                />
              } 
            />
            <Route 
              path="/add" 
              element={
                <ClientForm 
                  onSubmit={handleSaveClient} 
                  onCancel={handleCancel}
                  allClients={clients}
                />
              } 
            />
            <Route 
              path="/edit" 
              element={
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
              } 
            />
            <Route 
              path="/view" 
              element={
                selectedClient ? (
                  <ClientDetails 
                    client={selectedClient}
                    allClients={clients}
                    onEdit={handleEditClient}
                    onDelete={handleDeleteClient}
                    onStatusChange={handleStatusChange}
                  />
                ) : (
                  <Navigate to="/clients" replace />
                )
              } 
            />
            <Route 
              path="/pending" 
              element={
                <PendingClientsDashboard 
                  clients={viewMode === 'pending' ? pendingClients : 
                           clients.filter(c => c.member_status === MemberStatus.Pending)}
                  onViewClient={handleViewClient}
                  onEditClient={handleEditClient}
                  onDeleteClient={handleDeleteClient}
                  onStatusChange={handleStatusChange}
                />
              } 
            />
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
        </Box>
      )}
    </Container>
  );
} 