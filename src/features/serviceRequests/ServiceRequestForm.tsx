import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { format } from 'date-fns';
import { ServiceRequest, NewServiceRequest, Client } from '../../types';

interface ServiceRequestFormProps {
  serviceRequest?: ServiceRequest;
  client: Client;
  onSubmit: (request: NewServiceRequest) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const initialFormState: NewServiceRequest = {
  familySearchId: '',
  requestDate: new Date(),
  notes: '',
  contactMethod: 'phone',
  actionTaken: '',
  assignedVisitDate: new Date(),
  additionalPeople: {
    adults: 0,
    smallChildren: 0,
    schoolAged: 0
  },
  visitNotes: '',
  visitType: 'Pick Up',
  crateStatus: 'pending',
  visitStatus: 'scheduled',
  numberOfBoxes: 0,
  seasonalItems: [],
  isNewClient: false,
  approvalStatus: 'pending',
  deliveryType: 'pickup'
};

export default function ServiceRequestForm({
  serviceRequest,
  client,
  onSubmit,
  onCancel,
  isEdit = false
}: ServiceRequestFormProps) {
  const [formData, setFormData] = useState<NewServiceRequest>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (serviceRequest) {
      setFormData({
        ...serviceRequest,
        // Remove calculated fields
        visitTotals: undefined,
        createdAt: undefined,
        updatedAt: undefined
      } as NewServiceRequest);
    } else {
      setFormData({
        ...initialFormState,
        familySearchId: client.familyNumber
      });
    }
  }, [serviceRequest, client]);

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
    
    if (name.startsWith('additional')) {
      const field = name.replace('additional', '').toLowerCase() as keyof typeof formData.additionalPeople;
      setFormData(prev => ({
        ...prev,
        additionalPeople: {
          ...prev.additionalPeople,
          [field]: numValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateChange = (name: string) => (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.requestDate) {
      newErrors.requestDate = 'Request date is required';
    }
    
    if (!formData.assignedVisitDate) {
      newErrors.assignedVisitDate = 'Visit date is required';
    }
    
    if (formData.additionalPeople.adults < 0) {
      newErrors.additionalAdults = 'Cannot be negative';
    }
    
    if (formData.additionalPeople.schoolAged < 0) {
      newErrors.additionalSchoolAged = 'Cannot be negative';
    }
    
    if (formData.additionalPeople.smallChildren < 0) {
      newErrors.additionalSmallChildren = 'Cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isEdit ? 'Edit Service Request' : 'New Service Request'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* Request Information */}
          <Grid item xs={12}>
            <Typography variant="h6">Request Information</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              name="requestDate"
              label="Request Date"
              value={format(formData.requestDate, 'yyyy-MM-dd')}
              onChange={handleTextChange}
              error={!!errors.requestDate}
              helperText={errors.requestDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Contact Method</InputLabel>
              <Select
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleSelectChange}
              >
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="in_person">In Person</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              name="notes"
              label="Request Notes"
              value={formData.notes}
              onChange={handleTextChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Visit Details</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              name="assignedVisitDate"
              label="Visit Date"
              value={format(formData.assignedVisitDate, 'yyyy-MM-dd')}
              onChange={handleTextChange}
              error={!!errors.assignedVisitDate}
              helperText={errors.assignedVisitDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Visit Type</InputLabel>
              <Select
                name="visitType"
                value={formData.visitType}
                onChange={handleSelectChange}
              >
                <MenuItem value="Pick Up">Pick Up</MenuItem>
                <MenuItem value="Delivery">Delivery</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.isNewClient && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Approval Status</InputLabel>
                <Select
                  name="approvalStatus"
                  value={formData.approvalStatus}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="pending">Pending Approval</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="denied">Denied</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Additional People</Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              name="additionalAdults"
              label="Additional Adults"
              value={formData.additionalPeople.adults}
              onChange={handleNumberChange}
              error={!!errors.additionalAdults}
              helperText={errors.additionalAdults}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              name="additionalSchoolAged"
              label="Additional School Aged"
              value={formData.additionalPeople.schoolAged}
              onChange={handleNumberChange}
              error={!!errors.additionalSchoolAged}
              helperText={errors.additionalSchoolAged}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              name="additionalSmallChildren"
              label="Additional Small Children"
              value={formData.additionalPeople.smallChildren}
              onChange={handleNumberChange}
              error={!!errors.additionalSmallChildren}
              helperText={errors.additionalSmallChildren}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Service Details</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              name="numberOfBoxes"
              label="Number of Boxes"
              value={formData.numberOfBoxes}
              onChange={handleNumberChange}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Crate Status</InputLabel>
              <Select
                name="crateStatus"
                value={formData.crateStatus}
                onChange={handleSelectChange}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="prepared">Prepared</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              name="visitNotes"
              label="Visit Notes"
              value={formData.visitNotes}
              onChange={handleTextChange}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? 'Update Request' : 'Create Request'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 