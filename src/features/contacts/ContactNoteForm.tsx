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
} from '@mui/material';
import { format } from 'date-fns';
import { ContactNote, NewContactNote, ContactMethod, ContactPurpose } from '../../types';

interface ContactNoteFormProps {
  contactNote?: ContactNote;
  familySearchId: string;
  onSubmit: (note: NewContactNote) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const initialFormState: NewContactNote = {
  familySearchId: '',
  contactDate: new Date(),
  notes: '',
  contactPurpose: ContactPurpose.RequestAssistance,
  contactMethod: ContactMethod.Phone
};

export default function ContactNoteForm({
  contactNote,
  familySearchId,
  onSubmit,
  onCancel,
  isEdit = false
}: ContactNoteFormProps) {
  const [formData, setFormData] = useState<NewContactNote>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contactNote) {
      setFormData({
        ...contactNote,
        createdAt: undefined,
        updatedAt: undefined
      } as NewContactNote);
    } else {
      setFormData({
        ...initialFormState,
        familySearchId
      });
    }
  }, [contactNote, familySearchId]);

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
    
    if (!formData.contactDate) {
      newErrors.contactDate = 'Contact date is required';
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
        {isEdit ? 'Edit Contact Note' : 'New Contact Note'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6">Contact Information</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              name="contactDate"
              label="Contact Date"
              value={format(formData.contactDate, 'yyyy-MM-dd')}
              onChange={handleTextChange}
              error={!!errors.contactDate}
              helperText={errors.contactDate}
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
              label="Contact Notes"
              value={formData.notes}
              onChange={handleTextChange}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Contact Purpose</InputLabel>
              <Select
                name="contactPurpose"
                value={formData.contactPurpose}
                onChange={handleSelectChange}
              >
                <MenuItem value="request_assistance">Request Assistance</MenuItem>
                <MenuItem value="follow_up">Follow Up</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? 'Update Note' : 'Create Note'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 