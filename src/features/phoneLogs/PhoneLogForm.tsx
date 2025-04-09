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
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Client, PhoneLog } from '../../types';
import { usePhoneLogForm } from '../../hooks/usePhoneLogForm';
import { useNavigate } from 'react-router-dom';

interface PhoneLogFormProps {
  phoneLog?: PhoneLog | null;
  clients: Client[];
  onSavePhoneLog: (phoneLog: PhoneLog) => void;
  onComplete?: () => void;
  open?: boolean;
  onClose?: () => void;
  initialPhoneNumber?: string;
}

const PhoneLogForm: React.FC<PhoneLogFormProps> = ({
  clients,
  onSavePhoneLog,
  onComplete = () => {},
  open = true,
  onClose = () => {},
  initialPhoneNumber = '',
}) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [matchingClients, setMatchingClients] = useState<Client[]>([]);

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
      // Navigate to new client form with phone number pre-filled
      navigate('/clients/add', { 
        state: { 
          phoneNumber,
          fromPhoneLog: true,
          phoneLogState: {
            callType: state.callType,
            callOutcome: state.callOutcome,
            notes: state.notes
          }
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

  useEffect(() => {
    if (state.phoneNumber && state.phoneNumber.length >= 7) {
      const normalizedSearchNumber = state.phoneNumber.replace(/\D/g, '');
      const filteredClients = clients.filter(client => {
        const phone1Normalized = client.phone1?.replace(/\D/g, '') || '';
        const phone2Normalized = client.phone2?.replace(/\D/g, '') || '';
        return phone1Normalized.includes(normalizedSearchNumber) || 
               phone2Normalized.includes(normalizedSearchNumber);
      });
      setMatchingClients(filteredClients);
    } else {
      setMatchingClients([]);
    }
  }, [state.phoneNumber, clients]);

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
        onSavePhoneLog(newPhoneLog);
        onComplete();
        handleClose();
        
        // Add navigation state to track the flow
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
      <DialogTitle>Phone Log Entry</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Phone Number"
            value={state.phoneNumber}
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            fullWidth
            disabled={isSaving}
            placeholder="(XXX) XXX-XXXX"
            autoFocus
          />

          {matchingClients.length > 0 ? (
            <Box>
              <Typography variant="subtitle1">Select a Client:</Typography>
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
                      backgroundColor: state.selectedClient?.familyNumber === client.familyNumber ? 'action.selected' : 'inherit'
                    }}
                  >
                    <ListItemText
                      primary={`${client.firstName} ${client.lastName}`}
                      secondary={
                        <>
                          {client.phone1 && `Primary: ${client.phone1}`}
                          {client.phone2 && <><br />Secondary: {client.phone2}</>}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : state.phoneNumber && !errors.phoneNumber && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                No clients found with this phone number
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateNewClient}
                disabled={isSaving}
              >
                Create New Client
              </Button>
            </Box>
          )}

          {state.selectedClient && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.callType}>
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

              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.callOutcome}>
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

              <TextField
                label="Notes"
                value={state.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                multiline
                rows={4}
                fullWidth
                disabled={isSaving}
              />
            </Box>
          )}

          {errors.client && (
            <Typography color="error" variant="caption">
              {errors.client}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        {state.selectedClient && (
          <Button
            onClick={handleSave}
            disabled={Object.keys(errors).length > 0 || isSaving}
            variant="contained"
            color="primary"
          >
            {isSaving ? 'Saving...' : 'Save Phone Log'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default PhoneLogForm; 