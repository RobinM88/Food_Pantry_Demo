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
import { addNewClient, updateClient } from '../../utils/testDataUtils';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: NewClient | UpdateClient) => void;
  onCancel: () => void;
  isEdit?: boolean;
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
  connectedFamilies: [],
  memberStatus: MemberStatus.Pending
};

export default function ClientForm({ 
  client, 
  onSubmit, 
  onCancel,
  isEdit = false
}: ClientFormProps) {
  const [formData, setFormData] = useState<NewClient>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        // Remove calculated fields
        searchKey: undefined,
        familySize: undefined,
        totalVisits: undefined,
        totalThisMonth: undefined,
        softAddressCheck: undefined,
        hardAddressCheck: undefined,
        phoneCheck1: undefined,
        phoneCheck2: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        lastVisit: undefined
      } as NewClient);
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

  const handleTemporaryMemberChange = (field: keyof typeof formData.temporaryMembers) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      temporaryMembers: {
        ...prev.temporaryMembers,
        [field]: numValue
      }
    }));
  };

  const handleCheckboxChange = (field: 'isUnhoused' | 'isTemporary') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.checked
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
    
    if (formData.phone1 && !isValidUSPhoneNumber(formData.phone1)) {
      newErrors.phone1 = 'Please enter a valid US phone number';
    }
    
    if (formData.phone2 && !isValidUSPhoneNumber(formData.phone2)) {
      newErrors.phone2 = 'Please enter a valid US phone number';
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

    if (formData.isTemporary) {
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (isEdit && client) {
        // Update existing client
        const updatedClient: Client = {
          ...client,
          ...formData,
          updatedAt: new Date()
        };
        updateClient(updatedClient);
      } else {
        // Add new client
        addNewClient(formData);
      }
      onSubmit(formData);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isEdit ? 'Edit Client' : 'Add New Client'}
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
              disabled={!formData.isUnhoused}
              required={formData.isUnhoused}
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

          {formData.isTemporary && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Temporary Household Members</Typography>
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
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? 'Update Client' : 'Add Client'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 