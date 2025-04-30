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
  SelectChangeEvent
} from '@mui/material';
import { format } from 'date-fns';
import { ContactNote, NewContactNote, ContactMethod, ContactPurpose } from '../../types';
import { DatePicker } from '@mui/x-date-pickers';

interface ContactNoteFormProps {
  contactNote?: ContactNote;
  familyNumber: string;
  onSubmit: (note: NewContactNote) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const initialFormState: NewContactNote = {
  family_number: '',
  contact_date: new Date(),
  notes: '',
  contact_purpose: 'general',
  contact_method: 'phone'
};

export default function ContactNoteForm({
  contactNote,
  familyNumber,
  onSubmit,
  onCancel,
  isEdit = false
}: ContactNoteFormProps) {
  const [formData, setFormData] = useState<NewContactNote>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contactNote) {
      setFormData({
        family_number: contactNote.family_number,
        contact_date: contactNote.contact_date,
        notes: contactNote.notes,
        contact_purpose: contactNote.contact_purpose,
        contact_method: contactNote.contact_method
      });
    } else {
      setFormData({
        ...initialFormState,
        family_number: familyNumber
      });
    }
  }, [contactNote, familyNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        contact_date: date
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.contact_date) {
      newErrors.contact_date = 'Contact date is required';
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
            <DatePicker
              label="Contact Date"
              value={formData.contact_date}
              onChange={handleDateChange}
              sx={{ width: '100%' }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Contact Method</InputLabel>
              <Select
                name="contact_method"
                value={formData.contact_method}
                onChange={handleSelectChange}
                label="Contact Method"
              >
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="in-person">In Person</MenuItem>
                <MenuItem value="text">Text</MenuItem>
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
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Contact Purpose</InputLabel>
              <Select
                name="contact_purpose"
                value={formData.contact_purpose}
                onChange={handleSelectChange}
                label="Contact Purpose"
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="scheduling">Scheduling</MenuItem>
                <MenuItem value="follow-up">Follow Up</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
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