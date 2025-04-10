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
import { addOrder } from '../../utils/testDataUtils';

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
    notes: '',
    pickupDate: new Date(),
    deliveryType: 'pickup',
    isNewClient: false,
    approvalStatus: 'pending',
    numberOfBoxes: 1,
    additionalPeople: {
      adults: 0,
      smallChildren: 0,
      schoolAged: 0
    },
    seasonalItems: [],
    items: []
  });

  const {
    state,
    errors,
    handlePhoneNumberChange,
    handleCallTypeChange,
    handleCallOutcomeChange,
    handleNotesChange,
    handleClientSelect,
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

        // Save the order if we're creating one
        if (isCreatingOrder) {
          const newOrder: NewOrder = {
            ...orderData,
            familySearchId: state.selectedClient.familyNumber,
            notes: `${orderData.notes}\n\nPhone Log Notes: ${state.notes}`.trim(),
            isNewClient: false
          };
          
          if (onSaveOrder) {
            onSaveOrder(newOrder);
          } else {
            addOrder(newOrder);
          }
        }

        onSavePhoneLog(newPhoneLog);
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
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Phone Log Entry</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={isSaving}
            variant="outlined"
            size="large"
          >
            Cancel
          </Button>
          {state.selectedClient && (
            <Button
              onClick={handleSave}
              disabled={Object.keys(errors).length > 0 || isSaving}
              variant="contained"
              color="primary"
              size="large"
              sx={{ minWidth: 120 }}
            >
              {isSaving ? 'Saving...' : 'Save Phone Log'}
            </Button>
          )}
        </Box>
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

          {matchingClients.length > 0 ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Select a Client:</Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List>
                  {matchingClients.map((client: Client) => (
                    <ListItem
                      key={client.familyNumber}
                      button
                      onClick={() => handleClientSelect(client)}
                      selected={state.selectedClient?.familyNumber === client.familyNumber}
                      disabled={isSaving}
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' },
                        backgroundColor: state.selectedClient?.familyNumber === client.familyNumber ? 'action.selected' : 'inherit',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {`${client.firstName} ${client.lastName}`}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {client.phone1 && (
                              <Typography variant="body2" color="text.secondary">
                                Primary: {client.phone1}
                              </Typography>
                            )}
                            {client.phone2 && (
                              <Typography variant="body2" color="text.secondary">
                                Secondary: {client.phone2}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          ) : ((state.phoneNumber.length >= 3 || nameSearch.length >= 2) && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              backgroundColor: 'action.hover',
              borderRadius: 1
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                No clients found
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateNewClient}
                disabled={isSaving}
                size="large"
                sx={{ minWidth: 200 }}
              >
                Create New Client
              </Button>
            </Box>
          ))}

          {state.selectedClient && (
            <>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Call Details</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.callType}>
                      <InputLabel>Call Type</InputLabel>
                      <Select
                        value={state.callType}
                        onChange={(e) => handleCallTypeChange(e.target.value as 'incoming' | 'outgoing')}
                        label="Call Type"
                        disabled={isSaving}
                        sx={{ backgroundColor: 'background.paper' }}
                      >
                        <MenuItem value="incoming">Incoming</MenuItem>
                        <MenuItem value="outgoing">Outgoing</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.callOutcome}>
                      <InputLabel>Call Outcome</InputLabel>
                      <Select
                        value={state.callOutcome}
                        onChange={(e) => handleCallOutcomeChange(e.target.value as 'completed' | 'voicemail' | 'no_answer' | 'wrong_number')}
                        label="Call Outcome"
                        disabled={isSaving}
                        sx={{ backgroundColor: 'background.paper' }}
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
                      sx={{ 
                        '& .MuiInputBase-root': { 
                          backgroundColor: 'background.paper',
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>Service Request</Typography>
                  <Button
                    variant={isCreatingOrder ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setIsCreatingOrder(!isCreatingOrder)}
                    size="large"
                  >
                    {isCreatingOrder ? 'Cancel Order' : 'Create Order'}
                  </Button>
                </Box>

                {isCreatingOrder && (
                  <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Delivery Type</InputLabel>
                          <Select
                            value={orderData.deliveryType}
                            onChange={(e) => setOrderData(prev => ({
                              ...prev,
                              deliveryType: e.target.value as 'pickup' | 'delivery'
                            }))}
                            label="Delivery Type"
                          >
                            <MenuItem value="pickup">Pickup</MenuItem>
                            <MenuItem value="delivery">Delivery</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Pickup/Delivery Date"
                          value={orderData.pickupDate?.toISOString().split('T')[0] || ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            setOrderData(prev => ({
                              ...prev,
                              pickupDate: date
                            }));
                          }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Number of Boxes"
                          value={orderData.numberOfBoxes}
                          onChange={(e) => setOrderData(prev => ({
                            ...prev,
                            numberOfBoxes: parseInt(e.target.value) || 1
                          }))}
                          inputProps={{ min: 1 }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Additional People</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
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
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              type="number"
                              label="School-Aged Children"
                              value={orderData.additionalPeople.schoolAged}
                              onChange={(e) => setOrderData(prev => ({
                                ...prev,
                                additionalPeople: {
                                  ...prev.additionalPeople,
                                  schoolAged: parseInt(e.target.value) || 0
                                }
                              }))}
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
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
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Order Notes"
                          value={orderData.notes}
                          onChange={(e) => setOrderData(prev => ({
                            ...prev,
                            notes: e.target.value
                          }))}
                          multiline
                          rows={3}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
            </>
          )}

          {errors.client && (
            <Typography 
              color="error" 
              variant="body2" 
              sx={{ 
                mt: 2,
                p: 1,
                backgroundColor: 'error.light',
                color: 'error.dark',
                borderRadius: 1
              }}
            >
              {errors.client}
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default PhoneLogForm; 