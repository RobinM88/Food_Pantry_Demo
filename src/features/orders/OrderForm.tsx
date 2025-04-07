import React from 'react';
import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Paper,
  SelectChangeEvent
} from '@mui/material';
import { NewOrder, OrderStatus } from '../../types/order';
import { Client } from '../../types/client';

interface OrderFormProps {
  onSubmit: (order: NewOrder) => void;
  onCancel: () => void;
  initialData?: Partial<NewOrder>;
  clients: Client[];
}

const initialFormState: NewOrder = {
  clientId: '',
  status: 'pending',
  notes: '',
  pickupDate: new Date(),
  deliveryType: 'pickup',
  isNewClient: false,
  approvalStatus: 'pending'
};

export const OrderForm = ({ onSubmit, onCancel, initialData, clients }: OrderFormProps) => {
  const [formData, setFormData] = useState<NewOrder>({
    ...initialFormState,
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof NewOrder) => (
    e: SelectChangeEvent<string>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        pickupDate: date
      });
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Client</InputLabel>
              <Select
                value={formData.clientId}
                onChange={handleChange('clientId')}
                label="Client"
              >
                {clients.map((client) => (
                  <MenuItem key={client.familyNumber} value={client.familyNumber}>
                    {client.firstName} {client.lastName} ({client.familyNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="denied">Denied</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="picked_up">Picked Up</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Delivery Type</InputLabel>
              <Select
                value={formData.deliveryType}
                onChange={handleChange('deliveryType')}
                label="Delivery Type"
              >
                <MenuItem value="pickup">Pickup</MenuItem>
                <MenuItem value="delivery">Delivery</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.isNewClient && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={formData.approvalStatus}
                  onChange={handleChange('approvalStatus')}
                  label="Approval Status"
                >
                  <MenuItem value="pending">Pending Approval</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="denied">Denied</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="date"
              label="Pickup Date"
              value={formData.pickupDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const date = new Date(e.target.value);
                handleDateChange(date);
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={formData.notes}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  notes: e.target.value
                });
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" type="button" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="contained" type="submit">
                Save Order
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}; 