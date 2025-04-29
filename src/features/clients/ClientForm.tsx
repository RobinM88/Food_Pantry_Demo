import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  Paper,
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Client, MemberStatus, DEFAULT_VALUES } from '../../types';
import { formatPhoneNumber } from '../../utils/phoneNumberUtils';
import { ConnectedFamilyService } from '../../services/connectedFamily.service';
import { ConnectedFamiliesManager } from './ConnectedFamiliesManager';
import { validateClient } from '../../utils/validationUtils';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: Partial<Client>;
  allClients: Client[];
}

export default function ClientForm({ 
  client, 
  onSubmit, 
  onCancel,
  initialData = {},
  allClients
}: ClientFormProps) {
  const getInitialFormData = (): Omit<Client, 'id' | 'created_at' | 'updated_at'> => {
    if (client) {
      const { id, created_at, updated_at, ...clientData } = client;
      return {
        ...clientData,
        last_visit: clientData.last_visit ? new Date(clientData.last_visit) : null,
        family_size: clientData.family_size
      };
    }
    
    return {
      ...DEFAULT_VALUES,
      ...initialData,
      family_number: initialData?.family_number || '',
      family_size: initialData?.family_size || 1,
      total_visits: initialData?.total_visits || 0,
      total_this_month: initialData?.total_this_month || 0,
      last_visit: initialData?.last_visit ? new Date(initialData.last_visit) : new Date(),
      member_status: MemberStatus.Pending
    };
  };

  const [formData, setFormData] = useState<Omit<Client, 'id' | 'created_at' | 'updated_at'>>(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for connected families
  const [connectedFamilyIds, setConnectedFamilyIds] = useState<string[]>([]);

  useEffect(() => {
    if (client?.id) {
      ConnectedFamilyService.getByClientId(client.id)
        .then(connections => {
          setConnectedFamilyIds(connections.map(c => c.connected_family_number));
        })
        .catch(error => {
          console.error('Error loading connected families:', error);
        });
    }
  }, [client]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleTemporaryMemberChange = (field: 'adults' | 'school_aged' | 'small_children') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      temporary_members: {
        adults: prev.temporary_members?.adults ?? 0,
        school_aged: prev.temporary_members?.school_aged ?? 0,
        small_children: prev.temporary_members?.small_children ?? 0,
        [field]: numValue
      }
    }));
  };

  const handleCheckboxChange = (field: 'is_unhoused' | 'is_temporary') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      [field]: checked,
      temporary_members: checked && field === 'is_temporary' ? {
        adults: 0,
        school_aged: 0,
        small_children: 0
      } : undefined
    }));
  };

  const handlePhoneChange = (field: 'phone1' | 'phone2') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: formattedNumber
    }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateClient(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);

      if (client?.id && connectedFamilyIds.length > 0) {
        await ConnectedFamilyService.deleteByClientId(client.id);
        await Promise.all(
          connectedFamilyIds.map(connectedId => 
            ConnectedFamilyService.create({
              family_number: client.id!,
              connected_family_number: connectedId,
              relationship_type: 'other'
            })
          )
        );
      }

      // Find and remove the reverse connection
      if (client) {
        const reverseConnections = await ConnectedFamilyService.getByClientId(client.family_number);
        const reverseConnection = reverseConnections.find(c => c.connected_family_number === client.family_number);
        if (reverseConnection) {
          await ConnectedFamilyService.delete(reverseConnection.id);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {client ? 'Update Client' : 'Add New Client'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6">Basic Information</Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              name="family_number"
              label="Family Number"
              value={formData.family_number}
              onChange={handleTextChange}
              disabled={true}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              name="first_name"
              label="First Name"
              value={formData.first_name}
              onChange={handleTextChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              name="last_name"
              label="Last Name"
              value={formData.last_name}
              onChange={handleTextChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleTextChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_unhoused}
                  onChange={handleCheckboxChange('is_unhoused')}
                />
              }
              label="Unhoused"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Contact Information</Typography>
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              name="address"
              label="Street Address"
              value={formData.address}
              onChange={handleTextChange}
              disabled={formData.is_unhoused}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="apt_number"
              label="Apartment Number"
              value={formData.apt_number}
              onChange={handleTextChange}
              disabled={formData.is_unhoused}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="zip_code"
              label="ZIP Code"
              value={formData.zip_code}
              onChange={handleTextChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="phone1"
              label="Primary Phone"
              value={formData.phone1}
              onChange={handlePhoneChange('phone1')}
              error={!!errors.phone1}
              helperText={errors.phone1}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="phone2"
              label="Secondary Phone"
              value={formData.phone2}
              onChange={handlePhoneChange('phone2')}
              error={!!errors.phone2}
              helperText={errors.phone2}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Household Information</Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_temporary}
                  onChange={handleCheckboxChange('is_temporary')}
                />
              }
              label="Temporary Family Members"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1">Primary Household Members</Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              type="number"
              name="adults"
              label="Number of Adults"
              value={formData.adults}
              onChange={handleNumberChange}
              error={!!errors.adults}
              helperText={errors.adults}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              type="number"
              name="school_aged"
              label="School Aged Children"
              value={formData.school_aged}
              onChange={handleNumberChange}
              error={!!errors.school_aged}
              helperText={errors.school_aged}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              type="number"
              name="small_children"
              label="Small Children"
              value={formData.small_children}
              onChange={handleNumberChange}
              error={!!errors.small_children}
              helperText={errors.small_children}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {formData.is_temporary && formData.temporary_members && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Temporary Family Members
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="temporaryAdults"
                  label="Number of Adults"
                  value={formData.temporary_members.adults}
                  onChange={handleTemporaryMemberChange('adults')}
                  error={!!errors.temporaryAdults}
                  helperText={errors.temporaryAdults}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="temporarySchoolAged"
                  label="School Aged Children"
                  value={formData.temporary_members.school_aged}
                  onChange={handleTemporaryMemberChange('school_aged')}
                  error={!!errors.temporarySchoolAged}
                  helperText={errors.temporarySchoolAged}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="temporarySmallChildren"
                  label="Small Children"
                  value={formData.temporary_members.small_children}
                  onChange={handleTemporaryMemberChange('small_children')}
                  error={!!errors.temporarySmallChildren}
                  helperText={errors.temporarySmallChildren}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Notes</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="food_notes"
              label="Food Notes"
              value={formData.food_notes}
              onChange={handleTextChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="office_notes"
              label="Office Notes"
              value={formData.office_notes}
              onChange={handleTextChange}
            />
          </Grid>

          {client ? (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Member Status</InputLabel>
                <Select
                  name="member_status"
                  value={formData.member_status}
                  onChange={(e) => handleTextChange(e as any)}
                  label="Member Status"
                >
                  <MenuItem value={MemberStatus.Active}>Active</MenuItem>
                  <MenuItem value={MemberStatus.Inactive}>Inactive</MenuItem>
                  <MenuItem value={MemberStatus.Pending}>Pending</MenuItem>
                  <MenuItem value={MemberStatus.Suspended}>Suspended</MenuItem>
                  <MenuItem value={MemberStatus.Banned}>Banned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Typography color="textSecondary">
                New clients will be set to "Pending" status automatically
              </Typography>
            </Grid>
          )}
        </Grid>
        
        {/* Replace the old connected families section with the new component */}
        {client?.id && (
          <Box sx={{ mt: 3 }}>
            {client && (
              <ConnectedFamiliesManager
                client={client}
                allClients={allClients}
                onConnectionsChange={(connections) => {
                  setConnectedFamilyIds(connections.map(c => c.connected_family_number));
                }}
              />
            )}
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained" 
            color="primary"
          >
            {client ? 'Update Client' : 'Add Client'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 