import React from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Order, Client } from '../../types';
import { NewOrder } from '../../types/order';

interface OrderFormProps {
  initialData?: Order;
  clients: Client[];
  onSubmit: (orderData: NewOrder) => Promise<void>;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  clients,
  onSubmit,
  onCancel,
}) => {
  const [orderData, setOrderData] = React.useState<NewOrder>({
    family_search_id: initialData?.family_search_id || '',
    status: 'pending',
    pickup_date: initialData?.pickup_date,
    notes: initialData?.notes || '',
    delivery_type: initialData?.delivery_type || 'pickup',
    is_new_client: initialData?.is_new_client || false,
    approval_status: 'pending',
    number_of_boxes: initialData?.number_of_boxes || 1,
    additional_people: initialData?.additional_people || {
      adults: 0,
      small_children: 0,
      school_aged: 0
    },
    visit_contact: initialData?.visit_contact || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!orderData.family_search_id) {
        alert('Please select a client');
        return;
      }
      await onSubmit(orderData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit order. Please try again.');
    }
  };

  const handleDateChange = (date: Date | null) => {
    setOrderData(prev => ({
      ...prev,
      pickup_date: date === null ? undefined : date
    }));
  };

  const handleChange = (field: keyof NewOrder, value: any) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Order' : 'New Order'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Client</InputLabel>
              <Select
                value={orderData.family_search_id}
                onChange={(e) => handleChange('family_search_id', e.target.value)}
                label="Client"
              >
                {clients.map(client => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name} ({client.family_number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Delivery Type</InputLabel>
              <Select
                value={orderData.delivery_type}
                onChange={(e) => handleChange('delivery_type', e.target.value as 'pickup' | 'delivery')}
                label="Delivery Type"
              >
                <MenuItem value="pickup">Pickup</MenuItem>
                <MenuItem value="delivery">Delivery</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Pickup Date"
              value={orderData.pickup_date ?? null}
              onChange={handleDateChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Number of Boxes"
              value={orderData.number_of_boxes}
              onChange={(e) => handleChange('number_of_boxes', parseInt(e.target.value))}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Additional People
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Adults"
                  value={orderData.additional_people.adults}
                  onChange={(e) => handleChange('additional_people', {
                    ...orderData.additional_people,
                    adults: parseInt(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="School-aged Children"
                  value={orderData.additional_people.school_aged}
                  onChange={(e) => handleChange('additional_people', {
                    ...orderData.additional_people,
                    school_aged: parseInt(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Small Children"
                  value={orderData.additional_people.small_children}
                  onChange={(e) => handleChange('additional_people', {
                    ...orderData.additional_people,
                    small_children: parseInt(e.target.value)
                  })}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={orderData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Visit Contact"
              value={orderData.visit_contact}
              onChange={(e) => handleChange('visit_contact', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {initialData ? 'Update Order' : 'Create Order'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}; 