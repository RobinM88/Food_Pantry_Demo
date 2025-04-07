import { useState } from 'react';
import { Box, Button, Container } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ClientList from '../features/clients/ClientList';
import ClientForm from '../features/clients/ClientForm';
import ClientDetails from '../features/clients/ClientDetails';
import { Client, NewClient, UpdateClient } from '../types';
import { mockClients } from '../utils/mockData';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleAddClient = () => {
    setSelectedClient(null);
    setViewMode('add');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('edit');
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('view');
  };

  const handleDeleteClient = (client: Client) => {
    setClients(clients.filter(c => c.familyNumber !== client.familyNumber));
    if (viewMode === 'view' && selectedClient?.familyNumber === client.familyNumber) {
      setSelectedClient(null);
    }
  };

  const handleSaveClient = (clientData: NewClient | UpdateClient) => {
    if (selectedClient) {
      const updatedClient = {
        ...selectedClient,
        ...clientData
      };
      setClients(clients.map(c => c.familyNumber === updatedClient.familyNumber ? updatedClient : c));
    } else {
      const newClient: Client = {
        ...clientData as NewClient,
        familyNumber: Date.now().toString(),
        searchKey: `${clientData.firstName}${clientData.lastName}${Date.now().toString()}`,
        familySize: (clientData.adults || 0) + (clientData.schoolAged || 0) + (clientData.smallChildren || 0),
        totalVisits: 0,
        totalThisMonth: 0,
        connectedFamilies: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setClients([...clients, newClient]);
    }
    setViewMode('list');
    setSelectedClient(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedClient(null);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'add':
        return (
          <ClientForm 
            onSubmit={handleSaveClient} 
            onCancel={handleCancel} 
          />
        );
      case 'edit':
        return selectedClient ? (
          <ClientForm 
            client={selectedClient} 
            onSubmit={handleSaveClient} 
            onCancel={handleCancel}
            isEdit={true}
          />
        ) : null;
      case 'view':
        return selectedClient ? (
          <ClientDetails 
            client={selectedClient} 
            onEdit={handleEditClient} 
            onDelete={handleDeleteClient} 
          />
        ) : null;
      case 'list':
      default:
        return (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddClient}
              sx={{ mb: 2 }}
            >
              Add New Client
            </Button>
            <ClientList 
              clients={clients}
              onEditClient={handleEditClient} 
              onViewClient={handleViewClient} 
              onDeleteClient={handleDeleteClient} 
            />
          </Box>
        );
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {viewMode !== 'list' && (
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleCancel}
            sx={{ mb: 2 }}
          >
            Back to Client List
          </Button>
        )}
        {renderContent()}
      </Box>
    </Container>
  );
} 