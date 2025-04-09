import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Autocomplete,
  Tooltip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  ShoppingCart as OrderIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Client, PhoneLog, NewClient, UpdateClient } from '../../types';
import ClientForm from '../clients/ClientForm';
import { OrderForm } from '../orders/OrderForm';
import { formatPhoneNumber, isValidUSPhoneNumber } from '../../utils/phoneNumberUtils';
import { addPhoneLog, updatePhoneLog } from '../../utils/testDataUtils';

interface PhoneLogFormProps {
  phoneLog?: PhoneLog | null;
  clients: Client[];
  onSavePhoneLog: (phoneLog: PhoneLog) => void;
  onSaveClient: (client: NewClient | UpdateClient) => void;
  onSaveOrder: (order: any) => void;
}

type CallType = 'incoming' | 'outgoing';
type CallOutcome = 'completed' | 'voicemail' | 'no_answer' | 'wrong_number';

const PhoneLogForm: React.FC<PhoneLogFormProps> = ({
  phoneLog,
  clients,
  onSavePhoneLog,
  onSaveClient,
  onSaveOrder,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [callType, setCallType] = useState<CallType>(phoneLog?.callType || 'incoming');
  const [phoneNumber, setPhoneNumber] = useState(phoneLog?.phoneNumber || '');
  const [callOutcome, setCallOutcome] = useState<CallOutcome>(phoneLog?.callOutcome || 'completed');
  const [notes, setNotes] = useState(phoneLog?.notes || '');
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    phoneLog ? clients.find(c => c.familyNumber === phoneLog.familySearchId) || null : null
  );
  const [isNewClient, setIsNewClient] = useState(false);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle phone number input change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
    
    // Clear any existing phone number error
    if (errors.phoneNumber) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phoneNumber;
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 7) {
      const filteredClients = clients.filter(client => 
        client.phone1?.includes(phoneNumber) || 
        phoneNumber.includes(client.phone1 || '')
      );
      setSearchResults(filteredClients);
    } else {
      setSearchResults([]);
    }
  }, [phoneNumber, clients]);

  const handleClientSearch = (_event: React.SyntheticEvent, value: Client | null) => {
    setSelectedClient(value);
    if (value) {
      setPhoneNumber(value.phone1 || '');
    }
    setIsNewClient(false);
    setIsUpdatingClient(false);
  };

  const handleNewClient = () => {
    setIsNewClient(true);
    setSelectedClient(null);
    setClientDialogOpen(true);
  };

  const handleUpdateClient = () => {
    if (selectedClient) {
      setIsUpdatingClient(true);
      setClientDialogOpen(true);
    }
  };

  const handlePlaceOrder = () => {
    if (selectedClient) {
      setOrderDialogOpen(true);
    }
  };

  const handleClientSubmit = (clientData: NewClient | UpdateClient) => {
    onSaveClient(clientData);
    setClientDialogOpen(false);
    
    if (isNewClient) {
      const newClient: Client = {
        ...clientData as NewClient,
        searchKey: `${clientData.firstName}${clientData.lastName}${clientData.familyNumber}`.toLowerCase(),
        familySize: (clientData.adults || 0) + (clientData.schoolAged || 0) + (clientData.smallChildren || 0),
        totalVisits: 0,
        totalThisMonth: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSelectedClient(newClient);
      setIsNewClient(false);
    } else if (isUpdatingClient && selectedClient) {
      const updatedClient: Client = {
        ...selectedClient,
        ...clientData,
        updatedAt: new Date()
      };
      setSelectedClient(updatedClient);
      setIsUpdatingClient(false);
    }
    
    setSnackbarMessage(isNewClient ? 'New client added successfully' : 'Client updated successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleOrderSubmit = (orderData: any) => {
    onSaveOrder(orderData);
    setOrderDialogOpen(false);
    
    setSnackbarMessage('Order placed successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleSavePhoneLog = () => {
    if (!selectedClient && !isNewClient) {
      setSnackbarMessage('Please select or create a client');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const newPhoneLog: PhoneLog = {
      id: Date.now().toString(),
      familySearchId: selectedClient?.familyNumber || '',
      phoneNumber: phoneNumber || selectedClient?.phone1 || '',
      callType,
      callOutcome,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (phoneLog) {
      // Update existing phone log
      const updatedPhoneLog: PhoneLog = {
        ...phoneLog,
        ...newPhoneLog,
        updatedAt: new Date()
      };
      updatePhoneLog(updatedPhoneLog);
    } else {
      // Add new phone log
      addPhoneLog(newPhoneLog);
    }
    onSavePhoneLog(newPhoneLog);
    
    setSnackbarMessage('Phone log saved successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    
    // Reset the form after saving
    resetForm();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const resetForm = () => {
    setActiveStep(0);
    setCallType('incoming');
    setPhoneNumber('');
    setCallOutcome('completed');
    setNotes('');
    setSelectedClient(null);
    setIsNewClient(false);
    setIsUpdatingClient(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!isValidUSPhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid US phone number: (XXX) XXX-XXXX';
    }
    
    // ... other validations ...
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const steps = [
    {
      label: 'Call Information',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Call Type</InputLabel>
              <Select
                value={callType}
                onChange={(e) => setCallType(e.target.value as CallType)}
                label="Call Type"
              >
                <MenuItem value="incoming">Incoming</MenuItem>
                <MenuItem value="outgoing">Outgoing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Call Outcome</InputLabel>
              <Select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value as CallOutcome)}
                label="Call Outcome"
              >
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="no_answer">No Answer</MenuItem>
                <MenuItem value="voicemail">Left Voicemail</MenuItem>
                <MenuItem value="wrong_number">Wrong Number</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter call notes here..."
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Client Information',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Search for an existing client or create a new one
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Autocomplete
                sx={{ flexGrow: 1 }}
                options={searchResults.length > 0 ? searchResults : clients}
                getOptionLabel={(client) => `${client.firstName} ${client.lastName} (${client.phone1 || 'No phone'})`}
                value={selectedClient}
                onChange={handleClientSearch}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Clients"
                    variant="outlined"
                  />
                )}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewClient}
              >
                New Client
              </Button>
            </Box>
          </Grid>
          
          {selectedClient && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </Typography>
                  <Box>
                    <EditIcon 
                      color="primary" 
                      onClick={handleUpdateClient}
                    />
                    <Tooltip title="Place Order">
                      <IconButton 
                        color="secondary" 
                        onClick={handlePlaceOrder}
                      >
                        <OrderIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Name: {selectedClient.firstName} {selectedClient.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {selectedClient.phone1 || 'No phone number'}
                    </Typography>
                    {selectedClient.phone2 && (
                      <Typography variant="body2" color="text.secondary">
                        Secondary Phone: {selectedClient.phone2}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Address: {selectedClient.address}
                      {selectedClient.aptNumber && `, Apt ${selectedClient.aptNumber}`}
                      {`, ${selectedClient.zipCode}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Family Size: {selectedClient.familySize}
                    </Typography>
                  </Grid>
                  {selectedClient.foodNotes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Food Notes: {selectedClient.foodNotes}
                      </Typography>
                    </Grid>
                  )}
                  {selectedClient.officeNotes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Office Notes: {selectedClient.officeNotes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
          
          {isNewClient && (
            <Grid item xs={12}>
              <Alert severity="info">
                Creating a new client. Please fill out the client information.
              </Alert>
            </Grid>
          )}
        </Grid>
      ),
    },
    {
      label: 'Review & Save',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Call Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Call Type: {callType === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone Number: {phoneNumber || selectedClient?.phone1 || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Call Outcome: {callOutcome}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date: {format(new Date(), 'MMMM d, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time: {format(new Date(), 'h:mm a')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Notes: {notes || 'No notes provided'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            {selectedClient && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Client Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Name: {selectedClient.firstName} {selectedClient.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {selectedClient.phone1 || 'No phone number'}
                    </Typography>
                    {selectedClient.phone2 && (
                      <Typography variant="body2" color="text.secondary">
                        Secondary Phone: {selectedClient.phone2}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Address: {selectedClient.address}
                      {selectedClient.aptNumber && `, Apt ${selectedClient.aptNumber}`}
                      {`, ${selectedClient.zipCode}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Family Size: {selectedClient.familySize}
                    </Typography>
                  </Grid>
                  {selectedClient.foodNotes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Food Notes: {selectedClient.foodNotes}
                      </Typography>
                    </Grid>
                  )}
                  {selectedClient.officeNotes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Office Notes: {selectedClient.officeNotes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Phone Log Entry
        </Typography>
        <Typography variant="body1" paragraph>
          Log phone calls, manage client information, and place orders
        </Typography>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mb: 2 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSavePhoneLog : handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      endIcon={index === steps.length - 1 ? <SaveIcon /> : null}
                    >
                      {index === steps.length - 1 ? 'Save' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      {/* Client Dialog */}
      <Dialog 
        open={clientDialogOpen} 
        onClose={() => setClientDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isNewClient ? 'Add New Client' : 'Edit Client'}
        </DialogTitle>
        <DialogContent>
          <ClientForm
            client={isUpdatingClient && selectedClient ? selectedClient : undefined}
            onSubmit={handleClientSubmit}
            onCancel={() => setClientDialogOpen(false)}
            isEdit={isUpdatingClient}
          />
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Place Order</DialogTitle>
        <DialogContent>
          <OrderForm
            onSubmit={handleOrderSubmit}
            onCancel={() => setOrderDialogOpen(false)}
            initialData={selectedClient ? { clientId: selectedClient.familyNumber } : undefined}
            clients={clients}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
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

export default PhoneLogForm; 