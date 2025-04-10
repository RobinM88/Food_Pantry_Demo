import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Grid,
  Paper,
} from '@mui/material';
import { Client } from '../../types/client';
import { PhoneLog } from '../../types';
import { NewOrder } from '../../types/order';
import { usePhoneLogForm } from '../../hooks/usePhoneLogForm';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../../services/order.service';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface PhoneLogFormProps {
  phoneLog?: PhoneLog | null;
  clients: Client[];
  onSavePhoneLog: (phoneLog: PhoneLog) => void;
  onSaveOrder?: (order: NewOrder) => void;
  onComplete?: () => void;
  open?: boolean;
  onClose?: () => void;
  initialPhoneNumber?: string;
}

const PhoneLogForm: React.FC<PhoneLogFormProps> = ({
  phoneLog,
  clients,
  onSavePhoneLog,
  onSaveOrder,
  onComplete = () => {},
  open = true,
  onClose = () => {},
  initialPhoneNumber = '',
}) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [matchingClients, setMatchingClients] = useState<Client[]>([]);
  const [nameSearch, setNameSearch] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderData, setOrderData] = useState<NewOrder>({
    familySearchId: '',
    status: 'pending',
    pickupDate: new Date(),
    notes: '',
    deliveryType: 'pickup',
    isNewClient: false,
    approvalStatus: 'pending',
    numberOfBoxes: 1,
    additionalPeople: {
      adults: 0,
      smallChildren: 0,
      schoolAged: 0
    },
    seasonalItems: []
  });

  const {
    state,
    errors,
    handlePhoneNumberChange,
    handleCallTypeChange,
    handleCallOutcomeChange,
    handleNotesChange,
    handleClientSelect: originalHandleClientSelect,
    handleCreateNewClient,
    handleSubmit,
    reset
  } = usePhoneLogForm({
    onComplete: () => {
      onClose();
      reset();
      onComplete();
    },
    onCreateNewClient: (phoneNumber) => {
      navigate('/clients/add', { 
        state: { 
          phoneNumber,
          nameSearch,
          fromPhoneLog: true
        } 
      });
    }
  });

  // Enhanced handleClientSelect that also updates phone number
  const handleClientSelect = (client: Client) => {
    // Get the partial search number without any formatting
    const searchNumber = state.phoneNumber.replace(/\D/g, '');
    
    // Get client's phone numbers without any formatting
    const phone1 = client.phone1?.replace(/\D/g, '') || '';
    const phone2 = client.phone2?.replace(/\D/g, '') || '';
    
    // If we have a partial search, find which phone number matches
    if (searchNumber) {
      if (phone1.includes(searchNumber)) {
        handlePhoneNumberChange(client.phone1 || '');
      } else if (phone2.includes(searchNumber)) {
        handlePhoneNumberChange(client.phone2 || '');
      }
    } else {
      // If no search number, default to phone1
      handlePhoneNumberChange(client.phone1 || '');
    }
    
    // Call the original handler
    originalHandleClientSelect(client);
  };

  // Initialize with phone number if provided
  useEffect(() => {
    if (initialPhoneNumber && !state.phoneNumber) {
      handlePhoneNumberChange(initialPhoneNumber);
    }
  }, [initialPhoneNumber, state.phoneNumber, handlePhoneNumberChange]);

  // Auto-select client if there's exactly one match
  useEffect(() => {
    if (matchingClients.length === 1 && !state.selectedClient) {
      handleClientSelect(matchingClients[0]);
    }
  }, [matchingClients, state.selectedClient, handleClientSelect]);

  // Update search results when either phone or name changes
  useEffect(() => {
    const searchByPhone = state.phoneNumber.length >= 3;
    const searchByName = nameSearch.length >= 2;

    if (searchByPhone || searchByName) {
      const filteredClients = clients.filter(client => {
        // Phone number search
        const normalizedSearchNumber = state.phoneNumber.replace(/\D/g, '');
        const phone1Normalized = client.phone1?.replace(/\D/g, '') || '';
        const phone2Normalized = client.phone2?.replace(/\D/g, '') || '';
        const matchesPhone = searchByPhone ? 
          (phone1Normalized.includes(normalizedSearchNumber) || 
           phone2Normalized.includes(normalizedSearchNumber)) : false;

        // Name search
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        const matchesName = searchByName ? 
          fullName.includes(nameSearch.toLowerCase()) : false;

        return matchesPhone || matchesName;
      });
      setMatchingClients(filteredClients);
    } else {
      setMatchingClients([]);
    }
  }, [state.phoneNumber, nameSearch, clients]);

  const handleClose = () => {
    if (!isSaving) {
      reset();
      setMatchingClients([]);
      onClose();
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      const success = await handleSubmit();
      
      if (success && state.selectedClient) {
        // Create the phone log
        if (isCreatingOrder && orderData) {
          try {
            console.log('Preparing order data...'); // Debug log
            const orderWithDates: NewOrder = {
              ...orderData,
              familySearchId: state.selectedClient.familyNumber,
              notes: `${orderData.notes || ''}\n\nPhone Log Notes: ${state.notes || ''}`.trim(),
            };

            console.log('Saving order with data:', orderWithDates); // Debug log
            
            try {
              if (onSaveOrder) {
                await onSaveOrder(orderWithDates);
              } else {
                await OrderService.create(orderWithDates);
              }
              console.log('Order saved successfully'); // Debug log
            } catch (error: any) {
              console.error('Error saving order:', {
                error,
                message: error.message,
                details: error.details,
                hint: error.hint
              });
              throw error;
            }
          } catch (error) {
            console.error('Error in order creation:', error);
            // Don't throw here, we still want to save the phone log
          }
        }

        try {
          const newPhoneLog: PhoneLog = {
            id: Date.now().toString(),
            familySearchId: state.selectedClient.familyNumber,
            phoneNumber: state.phoneNumber,
            callType: state.callType,
            callOutcome: state.callOutcome,
            notes: state.notes,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await onSavePhoneLog(newPhoneLog);
          onComplete();
          handleClose();
          
          navigate('/phone-logs', {
            state: {
              fromPhoneLog: true,
              phoneNumber: state.phoneNumber,
              success: true,
              phoneLogState: {
                callType: state.callType,
                callOutcome: state.callOutcome,
                notes: state.notes
              }
            },
            replace: true
          });
        } catch (error) {
          console.error('Error saving phone log:', error);
        }
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add UI for creating an order
  const toggleOrderCreation = () => {
    setIsCreatingOrder(!isCreatingOrder);
    if (!isCreatingOrder) {
      // Initialize order data when enabling order creation
      setOrderData({
        familySearchId: state.selectedClient?.familyNumber || '',
        status: 'pending',
        notes: state.notes || '',
        pickupDate: new Date(),
        deliveryType: 'pickup',
        isNewClient: false,
        approvalStatus: 'pending',
        numberOfBoxes: 1,
        additionalPeople: {
          adults: state.selectedClient?.adults || 0,
          smallChildren: state.selectedClient?.smallChildren || 0,
          schoolAged: state.selectedClient?.schoolAged || 0
        },
        seasonalItems: []
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          {phoneLog ? 'Edit Phone Log' : 'New Phone Log'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone Number"
                value={state.phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber || "Enter phone number to search"}
                fullWidth
                disabled={isSaving}
                placeholder="(XXX) XXX-XXXX"
                size="medium"
                sx={{ '& .MuiInputBase-root': { backgroundColor: 'background.paper' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Search by Name"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                fullWidth
                disabled={isSaving}
                placeholder="Enter client name"
                size="medium"
                sx={{ '& .MuiInputBase-root': { backgroundColor: 'background.paper' } }}
              />
            </Grid>
          </Grid>

          {/* Client search results */}
          {matchingClients.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2, mb: 3 }}>
              <List>
                {matchingClients.map((client) => (
                  <ListItem
                    key={client.id}
                    button
                    onClick={() => handleClientSelect(client)}
                    selected={state.selectedClient?.id === client.id}
                  >
                    <ListItemText
                      primary={`${client.firstName} ${client.lastName}`}
                      secondary={`Family #: ${client.familyNumber} | Phone: ${client.phone1}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Form fields */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Call Type</InputLabel>
                <Select
                  value={state.callType}
                  onChange={(e) => handleCallTypeChange(e.target.value as 'incoming' | 'outgoing')}
                  label="Call Type"
                  disabled={isSaving}
                >
                  <MenuItem value="incoming">Incoming</MenuItem>
                  <MenuItem value="outgoing">Outgoing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Call Outcome</InputLabel>
                <Select
                  value={state.callOutcome}
                  onChange={(e) => handleCallOutcomeChange(e.target.value as 'completed' | 'voicemail' | 'no_answer' | 'wrong_number')}
                  label="Call Outcome"
                  disabled={isSaving}
                >
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="voicemail">Voicemail</MenuItem>
                  <MenuItem value="no_answer">No Answer</MenuItem>
                  <MenuItem value="wrong_number">Wrong Number</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={state.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                multiline
                rows={4}
                fullWidth
                disabled={isSaving}
              />
            </Grid>
          </Grid>

          {/* Order Creation Toggle */}
          {state.selectedClient && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant={isCreatingOrder ? "contained" : "outlined"}
                color="primary"
                onClick={toggleOrderCreation}
                disabled={isSaving}
              >
                {isCreatingOrder ? 'Cancel Order Creation' : 'Create Order'}
              </Button>
            </Box>
          )}

          {/* Order Form */}
          {isCreatingOrder && state.selectedClient && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Order Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Delivery Type</InputLabel>
                    <Select
                      value={orderData.deliveryType}
                      onChange={(e) => setOrderData(prev => ({ ...prev, deliveryType: e.target.value as 'pickup' | 'delivery' }))}
                      label="Delivery Type"
                    >
                      <MenuItem value="pickup">Pickup</MenuItem>
                      <MenuItem value="delivery">Delivery</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Pickup Date"
                      value={orderData.pickupDate}
                      onChange={(newValue) => {
                        if (newValue) {
                          setOrderData(prev => ({ ...prev, pickupDate: newValue }));
                        }
                      }}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of Boxes"
                    value={orderData.numberOfBoxes}
                    onChange={(e) => setOrderData(prev => ({ ...prev, numberOfBoxes: parseInt(e.target.value) || 1 }))}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Additional People
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Adults"
                        value={orderData.additionalPeople.adults}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          additionalPeople: {
                            ...prev.additionalPeople,
                            adults: parseInt(e.target.value) || 0
                          }
                        }))}
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Small Children"
                        value={orderData.additionalPeople.smallChildren}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          additionalPeople: {
                            ...prev.additionalPeople,
                            smallChildren: parseInt(e.target.value) || 0
                          }
                        }))}
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="School Aged"
                        value={orderData.additionalPeople.schoolAged}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          additionalPeople: {
                            ...prev.additionalPeople,
                            schoolAged: parseInt(e.target.value) || 0
                          }
                        }))}
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Order Notes"
                    value={orderData.notes}
                    onChange={(e) => setOrderData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 2 }}>
            <Box>
              {!state.selectedClient && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateNewClient}
                  disabled={isSaving || !state.phoneNumber}
                >
                  Create New Client
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isSaving || !state.selectedClient || !state.phoneNumber}
              >
                Save {isCreatingOrder ? 'Phone Log & Order' : 'Phone Log'}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default PhoneLogForm; 