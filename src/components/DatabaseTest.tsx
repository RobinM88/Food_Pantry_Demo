import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { useClients } from '../hooks/useClients';
import { MemberStatus } from '../types';

export default function DatabaseTest() {
  const { clients, isLoading, error, createClient } = useClients();

  const handleTestCreate = async () => {
    try {
      const testClient = {
        family_number: 'F001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        address: '123 Main St',
        apt_number: '4B',
        zip_code: '12345',
        phone1: '(555) 123-4567',
        phone2: '',
        is_unhoused: false,
        is_temporary: false,
        member_status: MemberStatus.Active,
        family_size: 3,
        adults: 2,
        school_aged: 1,
        small_children: 0,
        temporary_members: {
          adults: 0,
          school_aged: 0,
          small_children: 0
        },
        food_notes: '',
        office_notes: '',
        total_visits: 0,
        total_this_month: 0,
        last_visit: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      await createClient(testClient);
      alert('Test client created successfully!');
    } catch (error) {
      console.error('Error creating test client:', error);
      alert('Error creating test client. Check console for details.');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Database Connection Test
      </Typography>
      
      <Box my={2}>
        <Button 
          variant="contained" 
          onClick={handleTestCreate}
          disabled={isLoading}
        >
          Create Test Client
        </Button>
      </Box>

      <Box my={2}>
        <Typography variant="subtitle1" gutterBottom>
          Current Clients:
        </Typography>
        
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">
            Error loading clients: {error.message}
          </Typography>
        ) : (
          <ul>
            {clients.map((client) => (
              <li key={client.id}>
                {client.first_name} {client.last_name} ({client.family_number})
              </li>
            ))}
          </ul>
        )}
      </Box>
    </Box>
  );
} 