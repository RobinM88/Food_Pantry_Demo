import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import PhoneLogList from '../features/phoneLogs/PhoneLogList';
import PhoneLogForm from '../features/phoneLogs/PhoneLogForm';
import PhoneLogDetails from '../features/phoneLogs/PhoneLogDetails';
import ClientForm from '../features/clients/ClientForm';
import { Client, PhoneLog, NewClient, UpdateClient, MemberStatus } from '../types';
import { generateNextFamilyNumber } from '../utils/familyNumberUtils';
import { addNewClient, updateClient, addPhoneLog, updatePhoneLog, getClients, getPhoneLogs } from '../utils/testDataUtils';

type ViewMode = 'list' | 'form' | 'details' | 'clientForm';

const PhoneLogs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPhoneLog, setSelectedPhoneLog] = useState<PhoneLog | null>(null);
  const [clients, setClients] = useState<Client[]>(getClients());
  const [phoneLogs, setPhoneLogs] = useState<PhoneLog[]>(getPhoneLogs());
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Handle return from client creation
  useEffect(() => {
    const state = location.state as { fromClientAdd?: boolean; phoneNumber?: string } | null;
    if (state?.fromClientAdd && state.phoneNumber) {
      setPendingPhoneNumber(state.phoneNumber);
      setFormDialogOpen(true);
    }
  }, [location]);

  // Keep clients and phone logs in sync with localStorage
  useEffect(() => {
    const updatedClients = getClients();
    const updatedPhoneLogs = getPhoneLogs();
    setClients(updatedClients);
    setPhoneLogs(updatedPhoneLogs);
  }, [formDialogOpen]); // Refresh when dialog closes

  const handleAddPhoneLog = () => {
    setSelectedPhoneLog(null);
    setPendingPhoneNumber(null);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedPhoneLog(null);
    setPendingPhoneNumber(null);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedPhoneLog(null);
  };

  const handleSavePhoneLog = (phoneLog: PhoneLog) => {
    if (selectedPhoneLog) {
      // Update existing phone log
      updatePhoneLog(phoneLog);
    } else {
      // Add new phone log
      addPhoneLog(phoneLog);
    }
    
    // Update the state with fresh data from storage
    const updatedPhoneLogs = getPhoneLogs();
    setPhoneLogs(updatedPhoneLogs);
    
    setFormDialogOpen(false);
    setPendingPhoneNumber(null);
    setNotification({
      open: true,
      message: selectedPhoneLog ? 'Phone log updated successfully' : 'Phone log added successfully',
      severity: 'success',
    });
  };

  const handleSaveClient = (clientData: NewClient | UpdateClient) => {
    if ('familyNumber' in clientData) {
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
        familySize: (clientData.adults || existingClient.adults || 0) + 
                   (clientData.schoolAged || existingClient.schoolAged || 0) + 
                   (clientData.smallChildren || existingClient.smallChildren || 0),
        updatedAt: new Date()
      };
      
      updateClient(updatedClient);
      const updatedClients = getClients();
      setClients(updatedClients);
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
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email || '',
        address: clientData.isUnhoused ? '' : (clientData.address || ''),
        aptNumber: clientData.isUnhoused ? '' : (clientData.aptNumber || ''),
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
        familySize: (clientData.adults || 0) + (clientData.schoolAged || 0) + (clientData.smallChildren || 0),
        foodNotes: clientData.foodNotes || '',
        officeNotes: clientData.officeNotes || '',
        totalVisits: 0,
        totalThisMonth: 0,
        connectedFamilies: [],
        memberStatus: MemberStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastVisit: new Date()
      };
      
      // Save the new client
      addNewClient(newClient);
      
      // Update the state with fresh data
      const updatedClients = getClients();
      setClients(updatedClients);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Client added successfully',
        severity: 'success',
      });

      // Return to phone log form if we came from there
      const state = location.state as { fromPhoneLog?: boolean; phoneNumber?: string } | null;
      if (state?.fromPhoneLog) {
        // Navigate back to phone logs
        navigate('/phone-logs', {
          state: {
            fromClientAdd: true,
            phoneNumber: clientData.phone1
          },
          replace: true // Replace the current entry in the history stack
        });
      }
      
      return newClient.familyNumber;
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <PhoneLogList
            phoneLogs={phoneLogs}
            clients={clients}
            onViewLog={(phoneLog: PhoneLog) => {
              setSelectedPhoneLog(phoneLog);
              setDetailsDialogOpen(true);
            }}
          />
        );
      case 'details':
        return selectedPhoneLog ? (
          <PhoneLogDetails
            phoneLog={selectedPhoneLog}
            client={clients.find(c => c.familyNumber === selectedPhoneLog.familySearchId) || null}
          />
        ) : null;
      case 'clientForm':
        return (
          <ClientForm
            client={undefined}
            onSubmit={handleSaveClient}
            onCancel={() => setViewMode('list')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Phone Logs
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPhoneLog}
          >
            Add Phone Log
          </Button>
        </Box>
        {renderContent()}
      </Paper>

      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPhoneLog ? 'Edit Phone Log' : 'Add Phone Log'}
        </DialogTitle>
        <DialogContent>
          <PhoneLogForm
            phoneLog={selectedPhoneLog}
            clients={clients}
            onSavePhoneLog={handleSavePhoneLog}
            onComplete={handleCloseFormDialog}
            open={formDialogOpen}
            onClose={handleCloseFormDialog}
            initialPhoneNumber={pendingPhoneNumber || ''}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Phone Log Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailsDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedPhoneLog && (
            <PhoneLogDetails
              phoneLog={selectedPhoneLog}
              client={clients.find(c => c.familyNumber === selectedPhoneLog.familySearchId) || null}
            />
          )}
        </DialogContent>
      </Dialog>

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
  );
};

export default PhoneLogs; 