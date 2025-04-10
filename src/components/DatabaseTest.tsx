import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { useClients } from '../hooks/useClients';

export default function DatabaseTest() {
  const { clients, isLoading, error, createClient } = useClients();

  const handleTestCreate = async () => {
    try {
      const testClient = {
        familyNumber: `TEST-${Date.now()}`,
        firstName: 'Test',
        lastName: 'User',
        phone1: '(555) 123-4567',
        address: '123 Test St',
        zipCode: '12345',
        isUnhoused: false,
        isTemporary: false,
        memberStatus: 'active',
        familySize: 1,
        adults: 1,
        schoolAged: 0,
        smallChildren: 0,
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
                {client.firstName} {client.lastName} ({client.familyNumber})
              </li>
            ))}
          </ul>
        )}
      </Box>
    </Box>
  );
} 