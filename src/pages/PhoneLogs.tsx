import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import PhoneLogList from '../features/phoneLogs/PhoneLogList';
import PhoneLogForm from '../features/phoneLogs/PhoneLogForm';
import PhoneLogDetails from '../features/phoneLogs/PhoneLogDetails';
import ClientForm from '../features/clients/ClientForm';
import { Client, PhoneLog, NewClient, UpdateClient, MemberStatus } from '../types';
import { mockClients, mockPhoneLogs } from '../utils/mockData';
import { generateNextFamilyNumber } from '../utils/familyNumberUtils';

type ViewMode = 'list' | 'form' | 'details' | 'clientForm';

const PhoneLogs: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPhoneLog, setSelectedPhoneLog] = useState<PhoneLog | null>(null);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [phoneLogs, setPhoneLogs] = useState<PhoneLog[]>(mockPhoneLogs);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleAddPhoneLog = () => {
    setSelectedPhoneLog(null);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedPhoneLog(null);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedPhoneLog(null);
  };

  const handleSavePhoneLog = (phoneLog: PhoneLog) => {
    if (selectedPhoneLog) {
      setPhoneLogs(phoneLogs.map(log => 
        log.id === phoneLog.id ? phoneLog : log
      ));
    } else {
      setPhoneLogs([...phoneLogs, phoneLog]);
    }
    setFormDialogOpen(false);
    setNotification({
      open: true,
      message: selectedPhoneLog ? 'Phone log updated successfully' : 'Phone log added successfully',
      severity: 'success',
    });
  };

  const handleSaveClient = (clientData: NewClient | UpdateClient) => {
    if ('familyNumber' in clientData) {
      // This is an UpdateClient
      const updatedClients = clients.map(client => 
        client.familyNumber === clientData.familyNumber 
          ? { ...client, ...clientData }
          : client
      );
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
      setClients([...clients, newClient]);
    }
    setNotification({
      open: true,
      message: 'Client saved successfully',
      severity: 'success',
    });
  };

  const handleSaveOrder = (orderData: any) => {
    // In a real application, you would save the order data to your backend
    // For now, we'll just show a success notification
    console.log('Order saved:', orderData);
    
    setNotification({
      open: true,
      message: 'Order saved successfully',
      severity: 'success',
    });
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
      case 'form':
        return (
          <PhoneLogForm
            phoneLog={selectedPhoneLog}
            clients={clients}
            onSavePhoneLog={handleSavePhoneLog}
            onSaveClient={handleSaveClient}
            onSaveOrder={handleSaveOrder}
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
        <Typography variant="h5" component="h2" gutterBottom>
          Phone Logs
        </Typography>
        {renderContent()}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPhoneLog}
        >
          Add Phone Log
        </Button>
      </Box>

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
            onSaveClient={handleSaveClient}
            onSaveOrder={handleSaveOrder}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Cancel</Button>
        </DialogActions>
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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