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
  useTheme,
  useMediaQuery,
  Stack,
  Divider
} from '@mui/material';
import { Client } from '../../types/client';
import { PhoneLog } from '../../types';
import { NewOrder } from '../../types/order';
import { CallType, CallOutcome } from '../../types/phoneLog';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isSaving, setIsSaving] = useState(false);
  const [matchingClients, setMatchingClients] = useState<Client[]>([]);
  const [nameSearch, setNameSearch] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderData, setOrderData] = useState<NewOrder>({
    family_search_id: '',
    status: 'pending',
    pickup_date: new Date(),
    notes: '',
    delivery_type: 'pickup',
    is_new_client: false,
    approval_status: 'pending',
    number_of_boxes: 1,
    additional_people: {
      adults: 0,
      small_children: 0,
      school_aged: 0
    }
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
    const phone1 = (client.phone1 || '').replace(/\D/g, '');
    const phone2 = (client.phone2 || '').replace(/\D/g, '');
    
    // Check if the search number matches or is contained in either phone number
    if (phone1.includes(searchNumber)) {
      handlePhoneNumberChange(client.phone1 || '');
    } else if (phone2.includes(searchNumber)) {
      handlePhoneNumberChange(client.phone2 || '');
    } else {
      // If no match found, default to phone1
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
    const searchByPhone = state.phoneNumber.replace(/\D/g, '').length >= 3;
    const searchByName = nameSearch.length >= 2;

    if (searchByPhone || searchByName) {
      const filteredClients = clients.filter(client => {
        // Phone number search
        const normalizedSearchNumber = state.phoneNumber.replace(/\D/g, '');
        const phone1Normalized = (client.phone1 || '').replace(/\D/g, '');
        const phone2Normalized = (client.phone2 || '').replace(/\D/g, '');
        
        // More precise phone matching
        const matchesPhone = searchByPhone ? 
          (phone1Normalized.startsWith(normalizedSearchNumber) || 
           phone2Normalized.startsWith(normalizedSearchNumber)) : false;

        // Name search
        const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
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
              family_search_id: state.selectedClient.id,
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
            familySearchId: state.selectedClient.id,
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
        family_search_id: state.selectedClient?.id || '',
        status: 'pending',
        notes: state.notes || '',
        pickup_date: new Date(),
        delivery_type: 'pickup',
        is_new_client: false,
        approval_status: 'pending',
        number_of_boxes: 1,
        additional_people: {
          adults: state.selectedClient?.adults || 0,
          small_children: state.selectedClient?.small_children || 0,
          school_aged: state.selectedClient?.school_aged || 0
        }
      });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Phone Number and Client Search Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            Call Details
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Phone Number"
              value={state.phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
              fullWidth
              size={isMobile ? "small" : "medium"}
            />

            <TextField
              label="Search by Name"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              fullWidth
              size={isMobile ? "small" : "medium"}
            />
          </Stack>
        </Grid>

        {/* Matching Clients Section */}
        {matchingClients.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>
              Matching Clients
            </Typography>
            <Paper variant="outlined" sx={{ mt: 1 }}>
              <List dense={isMobile}>
                {matchingClients.map((client) => (
                  <ListItem
                    key={client.id}
                    button
                    onClick={() => handleClientSelect(client)}
                    selected={state.selectedClient?.id === client.id}
                    sx={{ 
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      py: isMobile ? 1.5 : 1
                    }}
                  >
                    <ListItemText
                      primary={`${client.first_name} ${client.last_name}`}
                      secondary={
                        <Stack 
                          direction={isMobile ? "column" : "row"} 
                          spacing={isMobile ? 0.5 : 2}
                          sx={{ mt: isMobile ? 0.5 : 0 }}
                        >
                          <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            {`Family #: ${client.family_number || 'N/A'}`}
                          </Box>
                          {client.phone1 && (
                            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                              {`Phone: ${client.phone1}`}
                            </Box>
                          )}
                        </Stack>
                      }
                      primaryTypographyProps={{
                        variant: isMobile ? "body1" : "subtitle1",
                        component: "div"
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* No Matches - Create New Client Section */}
        {state.phoneNumber && !matchingClients.length && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>
                  No matching clients found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Would you like to create a new client with this phone number?
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateNewClient}
                  size={isMobile ? "small" : "medium"}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Create New Client
                </Button>
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Call Type and Outcome Section */}
        <Grid item xs={12}>
          <Stack spacing={2}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Call Type</InputLabel>
              <Select
                value={state.callType}
                onChange={(e) => handleCallTypeChange(e.target.value as CallType)}
                label="Call Type"
                error={!!errors.callType}
              >
                <MenuItem value="incoming">Incoming</MenuItem>
                <MenuItem value="outgoing">Outgoing</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Call Outcome</InputLabel>
              <Select
                value={state.callOutcome}
                onChange={(e) => handleCallOutcomeChange(e.target.value as CallOutcome)}
                label="Call Outcome"
                error={!!errors.callOutcome}
              >
                <MenuItem value="successful">Successful</MenuItem>
                <MenuItem value="voicemail">Voicemail</MenuItem>
                <MenuItem value="no_answer">No Answer</MenuItem>
                <MenuItem value="wrong_number">Wrong Number</MenuItem>
                <MenuItem value="disconnected">Disconnected</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Grid>

        {/* Notes Section */}
        <Grid item xs={12}>
          <TextField
            label="Notes"
            multiline
            rows={4}
            value={state.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            error={!!errors.notes}
            helperText={errors.notes}
            fullWidth
            size={isMobile ? "small" : "medium"}
          />
        </Grid>

        {/* Create Order Section */}
        {state.selectedClient && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: isMobile ? 1 : 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="subtitle1" sx={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>
                  Create Service Request
                </Typography>
                <Button
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  onClick={toggleOrderCreation}
                >
                  {isCreatingOrder ? 'Cancel Request' : 'Add Request'}
                </Button>
              </Stack>
            </Grid>
          </>
        )}

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={2} 
            justifyContent="flex-end"
            sx={{ mt: 2 }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              fullWidth={isMobile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={isSaving}
              size={isMobile ? "small" : "medium"}
              fullWidth={isMobile}
            >
              {isSaving ? 'Saving...' : 'Save Phone Log'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PhoneLogForm; 