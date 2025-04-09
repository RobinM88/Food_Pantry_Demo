import { useState, useEffect } from 'react';
import { Box, Button, Container, Snackbar, Alert } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import ClientList from '../features/clients/ClientList';
import ClientForm from '../features/clients/ClientForm';
import ClientDetails from '../features/clients/ClientDetails';
import PendingClientsDashboard from '../features/clients/PendingClientsDashboard';
import { Client, NewClient, UpdateClient, MemberStatus } from '../types';
import { generateNextFamilyNumber } from '../utils/familyNumberUtils';
import { addNewClient, updateClient, getClients, deleteClient } from '../utils/testDataUtils';

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
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Load clients from localStorage on component mount
    setClients(getClients());
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
    console.log('Editing client:', client);
    setSelectedClient(client);
    setViewMode('edit');
    navigate('/clients/edit');
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('view');
    navigate('/clients/view');
  };

  const handleStatusChange = (client: Client, newStatus: MemberStatus) => {
    const updatedClient: Client = {
      ...client,
      memberStatus: newStatus,
      updatedAt: new Date()
    };
    
    updateClient(updatedClient);
    const updatedClients = getClients();
    setClients(updatedClients);
    
    setNotification({
      open: true,
      message: `Client ${newStatus === MemberStatus.Active ? 'approved' : 'denied'} successfully`,
      severity: 'success'
    });
  };

  const handleDeleteClient = (client: Client) => {
    deleteClient(client.familyNumber);
    const updatedClients = getClients();
    setClients(updatedClients);
    
    if (viewMode === 'view' && selectedClient?.familyNumber === client.familyNumber) {
      setSelectedClient(null);
      setViewMode('list');
    }

    setNotification({
      open: true,
      message: 'Client deleted successfully',
      severity: 'success'
    });
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

  const handleSaveClient = (clientData: NewClient | UpdateClient) => {
    console.log('handleSaveClient called with:', clientData);
    
    if ('familyNumber' in clientData && clientData.familyNumber) {
      // This is an UpdateClient
      const existingClient = clients.find(c => c.familyNumber === clientData.familyNumber);
      if (!existingClient) {
        setNotification({
          open: true,
          message: 'Client not found',
          severity: 'error',
        });
        return;
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
      
      console.log('Updating client:', updatedClient);
      updateClient(updatedClient);
      const updatedClients = getClients();
      console.log('Updated clients:', updatedClients);
      setClients(updatedClients);
      
      setNotification({
        open: true,
        message: 'Client updated successfully',
        severity: 'success',
      });
      
      setViewMode('list');
      setSelectedClient(null);
    } else {
      // This is a NewClient
      if (!clientData.firstName || !clientData.lastName || 
          !clientData.phone1 || !clientData.zipCode ||
          (!clientData.isUnhoused && !clientData.address)) {
        setNotification({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error',
        });
        return;
      }
      
      const newFamilyNumber = generateNextFamilyNumber(clients);
      const newClient: Client = {
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
        memberStatus: clientData.memberStatus || MemberStatus.Pending,
        totalVisits: 0,
        totalThisMonth: 0,
        foodNotes: clientData.foodNotes || '',
        officeNotes: clientData.officeNotes || '',
        connectedFamilies: clientData.connectedFamilies || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastVisit: undefined
      };
      
      console.log('Adding new client:', newClient);
      addNewClient(newClient);
      const updatedClients = getClients();
      setClients(updatedClients);
      
      setNotification({
        open: true,
        message: 'Client added successfully',
        severity: 'success',
      });
      
      // Navigate back to the client list
      setViewMode('list');
      setSelectedClient(null);
      navigate('/clients');
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedClient(null);
    navigate('/clients');
  };

  return (
    <Container maxWidth="lg">
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
        <Route path="/" element={
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddClient}
              >
                Add New Client
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/clients/pending')}
              >
                View Pending Approvals
              </Button>
            </Box>
            <ClientList
              clients={clients}
              onEditClient={handleEditClient}
              onViewClient={handleViewClient}
              onDeleteClient={handleDeleteClient}
            />
          </>
        } />
        <Route path="/add" element={
          <ClientForm
            onSubmit={handleSaveClient}
            onCancel={handleCancel}
          />
        } />
        <Route path="/edit" element={
          selectedClient ? (
            <ClientForm
              client={selectedClient}
              onSubmit={handleSaveClient}
              onCancel={handleCancel}
            />
          ) : <Navigate to="/clients" replace />
        } />
        <Route path="/view" element={
          selectedClient ? (
            <ClientDetails
              client={selectedClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
              onStatusChange={handleStatusChange}
            />
          ) : <Navigate to="/clients" replace />
        } />
        <Route path="/pending" element={
          <PendingClientsDashboard
            clients={clients}
            onStatusChange={handleStatusChange}
            onEditClient={handleEditClient}
          />
        } />
      </Routes>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 