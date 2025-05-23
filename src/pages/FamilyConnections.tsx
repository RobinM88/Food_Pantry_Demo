import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Client } from '../types/client';
import { ConnectedFamily } from '../types/connectedFamily';
import { RelationshipType } from '../types';
import { ConnectedFamilyService } from '../services/connectedFamily.service';
import { ClientService } from '../services/client.service';
import { config } from '../config';

interface FamilyGroup {
  mainClient: Client;
  connections: {
    client: Client;
    connectionId: string;
    relationshipType: RelationshipType;
  }[];
}

export default function FamilyConnections() {
  const [clients, setClients] = useState<Client[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('other');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load all clients and their connections
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clientsData = await ClientService.getAll();
      setClients(clientsData);
      
      // Get all connections first
      let allConnectionsData: ConnectedFamily[] = [];
      
      // In demo mode, handle possible errors silently
      if (config.app.isDemoMode) {
        console.log('Demo mode: Loading connected families data');
        try {
          // First try to get all connections at once
          allConnectionsData = await ConnectedFamilyService.getAll();
          console.log('Demo mode: All connections data:', allConnectionsData);
        } catch (error) {
          console.log('Demo mode: Error getting all connections, trying per client');
          // If that fails, try per client
          for (const client of clientsData) {
            try {
              const clientConnections = await ConnectedFamilyService.getByClientId(client.family_number);
              if (clientConnections && Array.isArray(clientConnections)) {
                allConnectionsData = [...allConnectionsData, ...clientConnections];
              }
            } catch (connError) {
              console.log(`Demo mode: Skipping connections for client ${client.family_number}`);
            }
          }
        }
      } else {
        // Regular mode
        for (const client of clientsData) {
          const clientConnections = await ConnectedFamilyService.getByClientId(client.family_number);
          allConnectionsData = [...allConnectionsData, ...clientConnections];
        }
      }
      
      // Debug log all connections
      console.log('All connection data:', allConnectionsData);
      
      // Build family groups
      const groups: FamilyGroup[] = [];
      const processedClients = new Set<string>();
      const processedGroups = new Set<string>();
      
      // First, identify all connection groups
      const connectionGroups: Record<string, string[]> = {};
      
      for (const conn of allConnectionsData) {
        const groupId = conn.connected_family_number;
        if (!connectionGroups[groupId]) {
          connectionGroups[groupId] = [];
        }
        if (!connectionGroups[groupId].includes(conn.family_number)) {
          connectionGroups[groupId].push(conn.family_number);
        }
      }
      
      console.log('Connection groups:', connectionGroups);
      
      // For each client, create a family group if needed
      for (const client of clientsData) {
        if (processedClients.has(client.family_number)) continue;
        
        // Find all groups this client is part of
        const clientGroupIds = Object.entries(connectionGroups)
          .filter(([_groupId, members]) => members.includes(client.family_number))
          .map(([groupId]) => groupId);
        
        for (const groupId of clientGroupIds) {
          if (processedGroups.has(groupId)) continue;
          processedGroups.add(groupId);
          
          const group: FamilyGroup = {
            mainClient: client,
            connections: []
          };
          
          // Find all other clients in this group
          const otherClients = connectionGroups[groupId]
            .filter(familyNumber => familyNumber !== client.family_number)
            .map(familyNumber => clientsData.find(c => c.family_number === familyNumber))
            .filter(Boolean) as Client[];
          
          // Add each other client as a connection
          for (const otherClient of otherClients) {
            // Find the connection record for this relationship
            const connectionRecord = allConnectionsData.find(
              conn => conn.family_number === client.family_number && 
                     conn.connected_family_number === groupId
            );
            
            if (connectionRecord) {
              group.connections.push({
                client: otherClient,
                connectionId: connectionRecord.id,
                relationshipType: connectionRecord.relationship_type as RelationshipType
              });
            }
          }
          
          if (group.connections.length > 0) {
            groups.push(group);
          }
        }
        
        processedClients.add(client.family_number);
      }
      
      console.log('Final family groups:', groups);
      setFamilyGroups(groups);
    } catch (error) {
      console.error('Error loading data:', error);
      // In demo mode, don't show error notifications
      if (!config.app.isDemoMode) {
        showNotification('Error loading family connections', 'error');
      }
    }
  };

  const handleAddConnection = async (client: Client) => {
    if (!selectedClient) return;

    try {
      // Generate a new connected_family_number for this group
      const cfNumber = await ConnectedFamilyService.generateConnectedFamilyNumber();

      // Create the connection in both directions with the same cf number
      const connection1 = {
        family_number: selectedClient.family_number,
        connected_family_number: cfNumber,
        relationship_type: relationshipType
      };

      const connection2 = {
        family_number: client.family_number,
        connected_family_number: cfNumber,
        relationship_type: relationshipType
      };

      // Create both connections
      await ConnectedFamilyService.create(connection1);
      await ConnectedFamilyService.create(connection2);

      // Refresh the data
      await loadData();
      
      // Reset the UI state
      setSelectedClient(null);
      setIsSearchOpen(false);
      setSearchTerm('');
      setRelationshipType('other');
      
      showNotification('Family connection created successfully', 'success');
    } catch (error) {
      console.error('Error creating connection:', error);
      showNotification('Failed to create family connection', 'error');
    }
  };

  const handleRemoveConnection = async (connectionId: string, client1Id: string, client2Id: string) => {
    try {
      // Remove both directions of the connection
      await ConnectedFamilyService.delete(connectionId);
      
      // In demo mode, don't try to fetch reverse connections which might fail
      if (!config.app.isDemoMode) {
        // Find and remove the reverse connection
        const reverseConnections = await ConnectedFamilyService.getByClientId(client2Id);
        const reverseConnection = reverseConnections.find((c: ConnectedFamily) => c.connected_family_number === client1Id);
        if (reverseConnection) {
          await ConnectedFamilyService.delete(reverseConnection.id);
        }
      }

      await loadData(); // Refresh data
      showNotification('Family connection removed successfully', 'success');
    } catch (error) {
      console.error('Error removing connection:', error);
      // In demo mode, don't show error notifications
      if (!config.app.isDemoMode) {
        showNotification('Error removing family connection', 'error');
      } else {
        // In demo mode, still refresh data to update UI
        await loadData();
      }
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const filteredClients = searchTerm.length >= 2
    ? clients.filter(c =>
        !selectedClient || c.id !== selectedClient.id &&
        (
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.family_number.includes(searchTerm) ||
          c.phone1.includes(searchTerm) ||
          (c.phone2 && c.phone2.includes(searchTerm))
        )
      )
    : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Family Connections
        </Typography>
        
        <Grid container spacing={3}>
          {/* Search for families to connect */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Create New Connection
              </Typography>
              <TextField
                fullWidth
                label="Search for a family by name, number, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <List>
                {filteredClients.map((client) => (
                  <ListItem
                    key={client.id}
                    button
                    onClick={() => {
                      setSelectedClient(client);
                      setIsSearchOpen(true);
                      setSearchTerm('');
                    }}
                  >
                    <ListItemText
                      primary={`${client.first_name} ${client.last_name}`}
                      secondary={`Family #: ${client.family_number} | Phone: ${client.phone1}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Existing family groups */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Existing Family Connections
            </Typography>
            {familyGroups.map((group) => (
              <Paper key={group.mainClient.id} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {group.mainClient.first_name} {group.mainClient.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Family #: {group.mainClient.family_number} | Phone: {group.mainClient.phone1}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Connected Families:
                </Typography>
                <List>
                  {group.connections.map(({ client, connectionId, relationshipType }) => (
                    <ListItem key={connectionId}>
                      <ListItemText
                        primary={`${client.first_name} ${client.last_name}`}
                        secondary={
                          <>
                            Family #: {client.family_number} | Phone: {client.phone1}
                            <br />
                            Relationship: {relationshipType || 'Other'}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveConnection(connectionId, group.mainClient.family_number, client.family_number)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ))}
            {familyGroups.length === 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                  No family connections found. Use the search above to create new connections.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Search Dialog for creating connections */}
      <Dialog
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Connect to {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Relationship Type</InputLabel>
            <Select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
              label="Relationship Type"
            >
              <MenuItem value="parent">Parent</MenuItem>
              <MenuItem value="child">Child</MenuItem>
              <MenuItem value="spouse">Spouse</MenuItem>
              <MenuItem value="sibling">Sibling</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            autoFocus
            margin="dense"
            label="Search by name, family number, or phone"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          <List>
            {filteredClients.map((client) => (
              <ListItem
                key={client.id}
                button
                onClick={() => handleAddConnection(client)}
              >
                <ListItemText
                  primary={`${client.first_name} ${client.last_name}`}
                  secondary={`Family #: ${client.family_number} | Phone: ${client.phone1}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSearchOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 