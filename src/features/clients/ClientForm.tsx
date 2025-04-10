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
import { Client, NewClient, UpdateClient, MemberStatus } from '../../types';
import { formatPhoneNumber, isValidUSPhoneNumber } from '../../utils/phoneNumberUtils';
import { ConnectedFamilyService } from '../../services/connectedFamily.service';
import { ConnectedFamiliesManager } from './ConnectedFamiliesManager';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: NewClient | UpdateClient) => void;
  onCancel: () => void;
  initialData?: Partial<NewClient>;
  allClients: Client[];
}

const initialFormState: NewClient = {
  familyNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  aptNumber: '',
  zipCode: '',
  phone1: '',
  phone2: '',
  isUnhoused: false,
  isTemporary: false,
  adults: 1,
  schoolAged: 0,
  smallChildren: 0,
  temporaryMembers: {
    adults: 0,
    schoolAged: 0,
    smallChildren: 0
  },
  foodNotes: '',
  officeNotes: '',
  memberStatus: MemberStatus.Pending,
  totalVisits: 0,
  totalThisMonth: 0
};

export default function ClientForm({ 
  client, 
  onSubmit, 
  onCancel,
  initialData,
  allClients
}: ClientFormProps) {
  const [formData, setFormData] = useState<NewClient>(
    client
      ? {
          familyNumber: client.familyNumber,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email || '',
          address: client.address,
          aptNumber: client.aptNumber || '',
          zipCode: client.zipCode,
          phone1: client.phone1,
          phone2: client.phone2 || '',
          isUnhoused: client.isUnhoused,
          isTemporary: client.isTemporary,
          adults: client.adults,
          schoolAged: client.schoolAged,
          smallChildren: client.smallChildren,
          temporaryMembers: client.temporaryMembers || {
            adults: 0,
            schoolAged: 0,
            smallChildren: 0
          },
          foodNotes: client.foodNotes || '',
          officeNotes: client.officeNotes || '',
          memberStatus: client.memberStatus,
          totalVisits: client.totalVisits,
          totalThisMonth: client.totalThisMonth
        }
      : { ...initialFormState, ...initialData, memberStatus: MemberStatus.Pending }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for connected families
  const [connectedFamilyIds, setConnectedFamilyIds] = useState<string[]>([]);

  useEffect(() => {
    if (client) {
      const { createdAt, updatedAt, lastVisit, familySize, ...clientData } = client;
      const newFormData: NewClient = {
        ...clientData,
        email: client.email || '',
        aptNumber: client.aptNumber || '',
        phone2: client.phone2 || '',
        temporaryMembers: client.isTemporary ? {
          adults: client.temporaryMembers?.adults ?? 0,
          schoolAged: client.temporaryMembers?.schoolAged ?? 0,
          smallChildren: client.temporaryMembers?.smallChildren ?? 0
        } : undefined,
        foodNotes: client.foodNotes || '',
        officeNotes: client.officeNotes || ''
      };
      setFormData(newFormData);
    }
  }, [client]);

  // Load connected families when editing an existing client
  useEffect(() => {
    if (client?.id) {
      ConnectedFamilyService.getByClientId(client.id)
        .then(connections => {
          setConnectedFamilyIds(connections.map(c => c.connectedTo));
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

  const handleTemporaryMemberChange = (field: 'adults' | 'schoolAged' | 'smallChildren') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      temporaryMembers: {
        adults: prev.temporaryMembers?.adults ?? 0,
        schoolAged: prev.temporaryMembers?.schoolAged ?? 0,
        smallChildren: prev.temporaryMembers?.smallChildren ?? 0,
        [field]: numValue
      }
    }));
  };

  const handleCheckboxChange = (field: 'isUnhoused' | 'isTemporary') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      [field]: checked,
      temporaryMembers: checked && field === 'isTemporary' ? {
        adults: 0,
        schoolAged: 0,
        smallChildren: 0
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone1 || !isValidUSPhoneNumber(formData.phone1)) {
      newErrors.phone1 = 'Please enter a valid US phone number';
    }
    
    if (formData.phone2 && !isValidUSPhoneNumber(formData.phone2)) {
      newErrors.phone2 = 'Please enter a valid US phone number';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    if (!formData.isUnhoused && !formData.address.trim()) {
      newErrors.address = 'Address is required for housed clients';
    }
    
    if (formData.adults < 1) {
      newErrors.adults = 'Must have at least 1 adult';
    }
    
    if (formData.schoolAged < 0) {
      newErrors.schoolAged = 'Cannot be negative';
    }
    
    if (formData.smallChildren < 0) {
      newErrors.smallChildren = 'Cannot be negative';
    }

    if (formData.isTemporary && formData.temporaryMembers) {
      if (formData.temporaryMembers.adults < 0) {
        newErrors.temporaryAdults = 'Cannot be negative';
      }
      if (formData.temporaryMembers.schoolAged < 0) {
        newErrors.temporarySchoolAged = 'Cannot be negative';
      }
      if (formData.temporaryMembers.smallChildren < 0) {
        newErrors.temporarySmallChildren = 'Cannot be negative';
      }
    }
    
    console.log('Form validation errors:', newErrors);
    console.log('Form data:', formData);
    
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Create a clean copy of formData without any fields that don't exist in the database
    const { connectedFamilies, ...clientData } = formData;
    
    // Calculate familySize if not already set
    if (clientData.familySize === undefined) {
      clientData.familySize = clientData.adults + clientData.schoolAged + clientData.smallChildren;
      if (clientData.isTemporary && clientData.temporaryMembers) {
        clientData.familySize += 
          clientData.temporaryMembers.adults + 
          clientData.temporaryMembers.schoolAged + 
          clientData.temporaryMembers.smallChildren;
      }
    }

    // Force new clients to be set to pending status
    if (!client) {
      // Override any potential status changes to ensure new clients are pending
      clientData.memberStatus = MemberStatus.Pending;
      console.log('Setting new client status to pending:', clientData);
    }

    // Submit the client data first
    onSubmit(clientData);
    
    // If we're editing an existing client and have their ID, handle connected families
    if (client?.id) {
      try {
        // Delete existing connections
        await ConnectedFamilyService.deleteByClientId(client.id);
        
        // Create new connections if any exist
        if (connectedFamilyIds.length > 0) {
          await Promise.all(
            connectedFamilyIds.map(connectedTo => 
              ConnectedFamilyService.create({
                clientId: client.id,
                connectedTo,
                relationshipType: 'Other' // Default to 'Other' for backward compatibility
              })
            )
          );
        }
      } catch (error) {
        console.error('Error managing connected families:', error);
      }
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
              name="familyNumber"
              label="Family Number"
              value={formData.familyNumber}
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
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleTextChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleTextChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
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
                  checked={formData.isUnhoused}
                  onChange={handleCheckboxChange('isUnhoused')}
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
              disabled={formData.isUnhoused}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="aptNumber"
              label="Apartment Number"
              value={formData.aptNumber}
              onChange={handleTextChange}
              disabled={formData.isUnhoused}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="zipCode"
              label="ZIP Code"
              value={formData.zipCode}
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
                  checked={formData.isTemporary}
                  onChange={handleCheckboxChange('isTemporary')}
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
              name="schoolAged"
              label="School Aged Children"
              value={formData.schoolAged}
              onChange={handleNumberChange}
              error={!!errors.schoolAged}
              helperText={errors.schoolAged}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              type="number"
              name="smallChildren"
              label="Small Children"
              value={formData.smallChildren}
              onChange={handleNumberChange}
              error={!!errors.smallChildren}
              helperText={errors.smallChildren}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {formData.isTemporary && formData.temporaryMembers && (
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
                  value={formData.temporaryMembers.adults}
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
                  value={formData.temporaryMembers.schoolAged}
                  onChange={handleTemporaryMemberChange('schoolAged')}
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
                  value={formData.temporaryMembers.smallChildren}
                  onChange={handleTemporaryMemberChange('smallChildren')}
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
              name="foodNotes"
              label="Food Notes"
              value={formData.foodNotes}
              onChange={handleTextChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="officeNotes"
              label="Office Notes"
              value={formData.officeNotes}
              onChange={handleTextChange}
            />
          </Grid>

          {client ? (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Member Status</InputLabel>
                <Select
                  name="memberStatus"
                  value={formData.memberStatus}
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
            <ConnectedFamiliesManager
              client={client}
              allClients={allClients}
              onConnectionsChange={(connections) => {
                setConnectedFamilyIds(connections.map(c => c.connectedTo));
              }}
            />
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