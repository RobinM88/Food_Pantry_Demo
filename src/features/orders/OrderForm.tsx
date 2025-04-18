import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Card,
  CardContent,
  Select,
  TextField,
  Typography,
  useTheme,
  Stack,
  Alert,
  Snackbar,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Order, Client } from '../../types';
import { NewOrder } from '../../types/order';
import {
  Person as PersonIcon,
  LocalShipping as DeliveryIcon,
  CalendarToday as CalendarIcon,
  Inventory as BoxesIcon,
  Group as PeopleIcon,
  Notes as NotesIcon,
  ContactPhone as ContactIcon
} from '@mui/icons-material';

interface OrderFormProps {
  initialData?: Order;
  clients: Client[];
  onSubmit: (orderData: NewOrder) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  status?: string;
  family_search_id?: string;
  pickup_date?: string;
  notes?: string;
  delivery_type?: string;
  is_new_client?: string;
  approval_status?: string;
  number_of_boxes?: string;
  additional_people?: {
    adults?: string;
    school_aged?: string;
    small_children?: string;
  };
  visit_contact?: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  clients,
  onSubmit,
  onCancel,
}) => {
  const theme = useTheme();

  const [errors, setErrors] = useState<FormErrors>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });

  const [orderData, setOrderData] = React.useState<NewOrder>({
    family_search_id: initialData?.family_search_id || '',
    status: initialData ? initialData.status : 'pending',
    pickup_date: initialData?.pickup_date ? new Date(initialData.pickup_date) : undefined,
    notes: initialData?.notes || '',
    delivery_type: initialData?.delivery_type || 'pickup',
    is_new_client: initialData?.is_new_client || false,
    approval_status: initialData ? initialData.approval_status : 'pending',
    number_of_boxes: initialData?.number_of_boxes || 1,
    additional_people: initialData?.additional_people || {
      adults: 0,
      small_children: 0,
      school_aged: 0
    },
    visit_contact: initialData?.visit_contact || ''
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!orderData.family_search_id) {
      newErrors.family_search_id = 'Please select a client';
    }
    
    if (orderData.number_of_boxes < 1) {
      newErrors.number_of_boxes = 'Must have at least 1 box';
    }

    if (orderData.additional_people) {
      const peopleErrors: FormErrors['additional_people'] = {};
      if (orderData.additional_people.adults < 0) {
        peopleErrors.adults = 'Cannot be negative';
      }
      if (orderData.additional_people.school_aged < 0) {
        peopleErrors.school_aged = 'Cannot be negative';
      }
      if (orderData.additional_people.small_children < 0) {
        peopleErrors.small_children = 'Cannot be negative';
      }
      if (Object.keys(peopleErrors).length > 0) {
        newErrors.additional_people = peopleErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!validateForm()) {
        setSnackbar({
          open: true,
          message: 'Please fix the errors in the form',
          severity: 'error'
        });
        return;
      }
      await onSubmit(orderData);
      setSnackbar({
        open: true,
        message: 'Order saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit order. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDateChange = (date: Date | null) => {
    try {
      setOrderData(prev => ({
        ...prev,
        pickup_date: date instanceof Date && !isNaN(date.getTime()) ? date : undefined
      }));
    } catch (error) {
      console.error('Error handling date change:', error);
      setOrderData(prev => ({
        ...prev,
        pickup_date: undefined
      }));
    }
  };

  const handleChange = (field: keyof NewOrder, value: any) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const selectedClient = clients.find(c => c.id === orderData.family_search_id);

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ 
            fontWeight: 600, 
            mb: 4,
            color: theme.palette.primary.main 
          }}>
            {initialData ? 'Edit Order' : 'New Order'}
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Client Selection Section */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                      Client Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl 
                          fullWidth 
                          error={!!errors.family_search_id}
                        >
                          <InputLabel>Select Client</InputLabel>
                          <Select
                            value={orderData.family_search_id}
                            onChange={(e) => handleChange('family_search_id', e.target.value)}
                            label="Select Client"
                            startAdornment={
                              <InputAdornment position="start">
                                <PersonIcon color="primary" />
                              </InputAdornment>
                            }
                          >
                            {clients.map(client => (
                              <MenuItem key={client.id} value={client.id}>
                                {client.first_name} {client.last_name} ({client.family_number})
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.family_search_id && (
                            <FormHelperText error>{errors.family_search_id}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      {selectedClient && (
                        <Grid item xs={12} md={6}>
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: theme.palette.grey[50],
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.grey[200]}`
                          }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Selected Client Details:
                            </Typography>
                            <Typography>
                              Phone: {selectedClient.phone1}
                            </Typography>
                            {selectedClient.email && (
                              <Typography>
                                Email: {selectedClient.email}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Order Details Section */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                      Order Details
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Delivery Type</InputLabel>
                          <Select
                            value={orderData.delivery_type}
                            onChange={(e) => handleChange('delivery_type', e.target.value as 'pickup' | 'delivery')}
                            label="Delivery Type"
                            startAdornment={
                              <InputAdornment position="start">
                                <DeliveryIcon color="primary" />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="pickup">Pickup</MenuItem>
                            <MenuItem value="delivery">Delivery</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="Pickup Date"
                          value={orderData.pickup_date instanceof Date && !isNaN(orderData.pickup_date.getTime()) 
                            ? orderData.pickup_date 
                            : null}
                          onChange={handleDateChange}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.pickup_date,
                              helperText: errors.pickup_date,
                              InputProps: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarIcon color="primary" />
                                  </InputAdornment>
                                ),
                              },
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Number of Boxes"
                          value={orderData.number_of_boxes}
                          onChange={(e) => handleChange('number_of_boxes', parseInt(e.target.value))}
                          error={!!errors.number_of_boxes}
                          helperText={errors.number_of_boxes}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BoxesIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Additional People Section */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PeopleIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Additional People
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Adults"
                          value={orderData.additional_people.adults}
                          onChange={(e) => handleChange('additional_people', {
                            ...orderData.additional_people,
                            adults: parseInt(e.target.value)
                          })}
                          error={!!errors.additional_people?.adults}
                          helperText={errors.additional_people?.adults}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="School-aged Children"
                          value={orderData.additional_people.school_aged}
                          onChange={(e) => handleChange('additional_people', {
                            ...orderData.additional_people,
                            school_aged: parseInt(e.target.value)
                          })}
                          error={!!errors.additional_people?.school_aged}
                          helperText={errors.additional_people?.school_aged}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Small Children"
                          value={orderData.additional_people.small_children}
                          onChange={(e) => handleChange('additional_people', {
                            ...orderData.additional_people,
                            small_children: parseInt(e.target.value)
                          })}
                          error={!!errors.additional_people?.small_children}
                          helperText={errors.additional_people?.small_children}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Notes and Contact Section */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                      Additional Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Notes"
                          value={orderData.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <NotesIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Visit Contact"
                          value={orderData.visit_contact}
                          onChange={(e) => handleChange('visit_contact', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <ContactIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Form Actions */}
              <Grid item xs={12}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent="flex-end"
                  sx={{ mt: 2 }}
                >
                  <Button 
                    onClick={onCancel}
                    variant="outlined"
                    sx={{ flex: { xs: '1', sm: '0 0 auto' } }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    variant="contained"
                    sx={{ flex: { xs: '1', sm: '0 0 auto' } }}
                  >
                    {initialData ? 'Save Changes' : 'Create Order'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 