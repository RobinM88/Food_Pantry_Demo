import React, { useState } from 'react';
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
  SelectChangeEvent,
  Divider
} from '@mui/material';
import { NewOrder, Order } from '../../types/order';
import { Client } from '../../types/client';
import { addOrder, updateOrder } from '../../utils/testDataUtils';

interface OrderFormProps {
  onSubmit: (order: NewOrder) => void;
  onCancel: () => void;
  initialData?: Partial<Order>;
  clients: Client[];
}

const initialFormState: NewOrder = {
  familySearchId: '',
  status: 'pending',
  notes: '',
  pickupDate: new Date(),
  deliveryType: 'pickup',
  isNewClient: false,
  approvalStatus: 'pending',
  numberOfBoxes: 0,
  additionalPeople: {
    adults: 0,
    smallChildren: 0,
    schoolAged: 0
  },
  seasonalItems: []
};

export const OrderForm = ({ onSubmit, onCancel, initialData, clients }: OrderFormProps) => {
  const [formData, setFormData] = useState<NewOrder>({
    ...initialFormState,
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (initialData?.id) {
      // Update existing order
      const updatedOrder: Order = {
        ...formData,
        id: initialData.id,
        createdAt: initialData.createdAt || new Date(),
        updatedAt: new Date()
      };
      updateOrder(updatedOrder);
      onSubmit(formData);
    } else {
      // Add new order
      addOrder(formData);
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof NewOrder) => (
    e: SelectChangeEvent<string>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (field.startsWith('additional')) {
      const personType = field.replace('additional', '').toLowerCase() as keyof typeof formData.additionalPeople;
      setFormData({
        ...formData,
        additionalPeople: {
          ...formData.additionalPeople,
          [personType]: numValue
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: numValue
      });
    }
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
                value={formData.familySearchId}
                onChange={handleChange('familySearchId')}
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
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Additional People</Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Additional Adults"
              value={formData.additionalPeople.adults}
              onChange={(e) => handleNumberChange('additionalAdults', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Additional School Aged"
              value={formData.additionalPeople.schoolAged}
              onChange={(e) => handleNumberChange('additionalSchoolAged', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Additional Small Children"
              value={formData.additionalPeople.smallChildren}
              onChange={(e) => handleNumberChange('additionalSmallChildren', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Order Details</Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Number of Boxes"
              value={formData.numberOfBoxes}
              onChange={(e) => handleNumberChange('numberOfBoxes', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
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