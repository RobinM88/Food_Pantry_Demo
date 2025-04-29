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
import { NewOrder } from '../types/order';
import { generateNextFamilyNumber } from '../utils/familyNumberUtils';
import { PhoneLogService } from '../services/phoneLog.service';
import { OrderService } from '../services/order.service';
import { ClientService } from '../services/client.service';

type ViewMode = 'list' | 'form' | 'details' | 'clientForm';

const PhoneLogs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPhoneLog, setSelectedPhoneLog] = useState<PhoneLog | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [phoneLogs, setPhoneLogs] = useState<PhoneLog[]>([]);
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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, phoneLogsData] = await Promise.all([
          ClientService.getAll(),
          PhoneLogService.getAll()
        ]);
        setClients(clientsData);
        setPhoneLogs(phoneLogsData);
      } catch (error) {
        setNotification({
          open: true,
          message: 'Error loading data',
          severity: 'error',
        });
      }
    };
    loadData();
  }, []);

  // Handle return from client creation
  useEffect(() => {
    const state = location.state as { fromClientAdd?: boolean; phoneNumber?: string } | null;
    if (state?.fromClientAdd && state.phoneNumber) {
      setPendingPhoneNumber(state.phoneNumber);
      setFormDialogOpen(true);
    }
  }, [location]);

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

  const handleSavePhoneLog = async (phoneLog: PhoneLog) => {
    try {
      if (selectedPhoneLog) {
        // Update existing phone log
        await PhoneLogService.update(selectedPhoneLog.id, phoneLog);
      } else {
        // Add new phone log
        await PhoneLogService.create(phoneLog);
      }
      
      // Refresh phone logs
      const updatedPhoneLogs = await PhoneLogService.getAll();
      setPhoneLogs(updatedPhoneLogs);
      
      setFormDialogOpen(false);
      setPendingPhoneNumber(null);
      setNotification({
        open: true,
        message: selectedPhoneLog ? 'Phone log updated successfully' : 'Phone log and service request saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error saving phone log',
        severity: 'error',
      });
    }
  };

  const handleSaveOrder = async (order: NewOrder) => {
    try {
      await OrderService.create(order);
      setNotification({
        open: true,
        message: 'Service request created successfully',
        severity: 'success',
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error creating service request',
        severity: 'error',
      });
    }
  };

  const handleSaveClient = async (clientData: NewClient | UpdateClient) => {
    try {
      if ('family_number' in clientData) {
        // Update existing client
        const existingClient = clients.find(c => c.family_number === clientData.family_number);
        if (!existingClient) {
          throw new Error('Client not found');
        }

        const updatedClient: Client = {
          ...existingClient,
          ...clientData,
          family_size: (clientData.adults || existingClient.adults || 0) + 
                     (clientData.school_aged || existingClient.school_aged || 0) + 
                     (clientData.small_children || existingClient.small_children || 0),
          updated_at: new Date()
        };
        
        await ClientService.update(existingClient.id, updatedClient);
      } else {
        // Create new client
        if (!clientData.first_name || !clientData.last_name || 
            !clientData.phone1 || !clientData.zip_code ||
            (!clientData.is_unhoused && !clientData.address)) {
          throw new Error('Please fill in all required fields');
        }

        const newFamilyNumber = generateNextFamilyNumber(clients);
        const newClient: Client = {
          id: `c${Date.now()}`,
          family_number: newFamilyNumber,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email || '',
          address: clientData.is_unhoused ? '' : (clientData.address || ''),
          apt_number: clientData.is_unhoused ? '' : (clientData.apt_number || ''),
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
          family_size: (clientData.adults || 0) + (clientData.school_aged || 0) + (clientData.small_children || 0),
          food_notes: clientData.food_notes || '',
          office_notes: clientData.office_notes || '',
          total_visits: 0,
          total_this_month: 0,
          connected_families: [],
          member_status: MemberStatus.Pending,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_visit: new Date().toISOString()
        };
        
        await ClientService.create(newClient);
      }
      
      // Refresh clients list
      const updatedClients = await ClientService.getAll();
      setClients(updatedClients);
      
      setNotification({
        open: true,
        message: 'Client saved successfully',
        severity: 'success',
      });

      // Return to phone log form if we came from there
      const state = location.state as { fromPhoneLog?: boolean; phoneNumber?: string } | null;
      if (state?.fromPhoneLog) {
        navigate('/phone-logs', {
          state: { fromClientAdd: true, phoneNumber: state.phoneNumber }
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Error saving client',
        severity: 'error',
      });
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
            client={clients.find(c => c.family_number === selectedPhoneLog.familySearchId) || null}
          />
        ) : null;
      case 'clientForm':
        return (
          <ClientForm
            client={undefined}
            onSubmit={handleSaveClient}
            onCancel={() => setViewMode('list')}
            allClients={clients}
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
            onSaveOrder={handleSaveOrder}
            onComplete={() => {
              handleCloseFormDialog();
              setNotification({
                open: true,
                message: 'Phone log saved successfully',
                severity: 'success',
              });
            }}
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
              client={clients.find(c => c.family_number === selectedPhoneLog.familySearchId) || null}
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