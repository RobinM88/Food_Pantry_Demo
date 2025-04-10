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
import { Order, NewOrder, Client } from '../../types';

interface OrderFormProps {
  initialData?: Order;
  clients: Client[];
  onSubmit: (orderData: NewOrder) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  clients,
  onSubmit,
  onCancel,
}) => {
  const [orderData, setOrderData] = React.useState<NewOrder>({
    familySearchId: initialData?.familySearchId || '',
    status: initialData?.status || 'pending',
    pickupDate: initialData?.pickupDate ? new Date(initialData.pickupDate) : new Date(),
    notes: initialData?.notes || '',
    deliveryType: initialData?.deliveryType || 'pickup',
    isNewClient: false,
    approvalStatus: 'pending',
    numberOfBoxes: initialData?.numberOfBoxes || 1,
    additionalPeople: initialData?.additionalPeople || {
      adults: 0,
      smallChildren: 0,
      schoolAged: 0
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(orderData);
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
                value={orderData.familySearchId}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  familySearchId: e.target.value
                }))}
                label="Client"
              >
                {clients.map(client => (
                  <MenuItem key={client.familyNumber} value={client.familyNumber}>
                    {client.firstName} {client.lastName} ({client.familyNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Delivery Type</InputLabel>
              <Select
                value={orderData.deliveryType}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  deliveryType: e.target.value as 'pickup' | 'delivery'
                }))}
                label="Delivery Type"
              >
                <MenuItem value="pickup">Pickup</MenuItem>
                <MenuItem value="delivery">Delivery</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Pickup/Delivery Date"
              value={orderData.pickupDate}
              onChange={(date) => setOrderData(prev => ({
                ...prev,
                pickupDate: date || new Date()
              }))}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Number of Boxes"
              value={orderData.numberOfBoxes}
              onChange={(e) => setOrderData(prev => ({
                ...prev,
                numberOfBoxes: parseInt(e.target.value) || 1
              }))}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Additional People</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Adults"
                  value={orderData.additionalPeople.adults}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    additionalPeople: {
                      ...prev.additionalPeople,
                      adults: parseInt(e.target.value) || 0
                    }
                  }))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="School-Aged Children"
                  value={orderData.additionalPeople.schoolAged}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    additionalPeople: {
                      ...prev.additionalPeople,
                      schoolAged: parseInt(e.target.value) || 0
                    }
                  }))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Small Children"
                  value={orderData.additionalPeople.smallChildren}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    additionalPeople: {
                      ...prev.additionalPeople,
                      smallChildren: parseInt(e.target.value) || 0
                    }
                  }))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Order Notes"
              value={orderData.notes}
              onChange={(e) => setOrderData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              multiline
              rows={3}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onCancel} variant="outlined">
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