import React, { useState, useEffect } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import { Client } from '../types/client';
import { ConnectedFamily, RelationshipType } from '../types/connectedFamily';
import { ClientService } from '../services/client.service';
import { ConnectedFamilyService } from '../services/connectedFamily.service';

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
  const [allConnections, setAllConnections] = useState<ConnectedFamily[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>('Other');
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
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
      for (const client of clientsData) {
        const clientConnections = await ConnectedFamilyService.getByClientId(client.id);
        allConnectionsData = [...allConnectionsData, ...clientConnections];
      }
      setAllConnections(allConnectionsData);
      
      // Build family groups
      const groups: FamilyGroup[] = [];
      const processedClients = new Set<string>();

      for (const client of clientsData) {
        if (processedClients.has(client.id)) continue;

        const clientConnections = allConnectionsData.filter(conn => conn.clientId === client.id);
        if (clientConnections.length > 0) {
          const group: FamilyGroup = {
            mainClient: client,
            connections: []
          };

          for (const conn of clientConnections) {
            const connectedClient = clientsData.find(c => c.id === conn.connectedTo);
            if (connectedClient) {
              group.connections.push({
                client: connectedClient,
                connectionId: conn.id,
                relationshipType: conn.relationshipType
              });
              processedClients.add(connectedClient.id);
            }
          }

          groups.push(group);
          processedClients.add(client.id);
        }
      }

      setFamilyGroups(groups);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading family connections', 'error');
    }
  };

  const handleAddConnection = async (targetClient: Client) => {
    if (!selectedClient) return;

    try {
      // Create bi-directional connection
      await ConnectedFamilyService.create({
        clientId: selectedClient.id,
        connectedTo: targetClient.id,
        relationshipType: selectedRelationType
      });

      await ConnectedFamilyService.create({
        clientId: targetClient.id,
        connectedTo: selectedClient.id,
        relationshipType: selectedRelationType
      });

      await loadData(); // Refresh data
      setIsSearchDialogOpen(false);
      setSelectedRelationType('Other'); // Reset for next connection
      showNotification('Family connection created successfully', 'success');
    } catch (error) {
      console.error('Error creating connection:', error);
      showNotification('Error creating family connection', 'error');
    }
  };

  const handleRemoveConnection = async (connectionId: string, client1Id: string, client2Id: string) => {
    try {
      // Remove both directions of the connection
      await ConnectedFamilyService.delete(connectionId);
      
      // Find and remove the reverse connection
      const reverseConnections = await ConnectedFamilyService.getByClientId(client2Id);
      const reverseConnection = reverseConnections.find(c => c.connectedTo === client1Id);
      if (reverseConnection) {
        await ConnectedFamilyService.delete(reverseConnection.id);
      }

      await loadData(); // Refresh data
      showNotification('Family connection removed successfully', 'success');
    } catch (error) {
      console.error('Error removing connection:', error);
      showNotification('Error removing family connection', 'error');
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
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.familyNumber.includes(searchTerm) ||
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
                      setIsSearchDialogOpen(true);
                      setSearchTerm('');
                    }}
                  >
                    <ListItemText
                      primary={`${client.firstName} ${client.lastName}`}
                      secondary={`Family #: ${client.familyNumber} | Phone: ${client.phone1}`}
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
                    {group.mainClient.firstName} {group.mainClient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Family #: {group.mainClient.familyNumber} | Phone: {group.mainClient.phone1}
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
                        primary={`${client.firstName} ${client.lastName}`}
                        secondary={
                          <>
                            Family #: {client.familyNumber} | Phone: {client.phone1}
                            <br />
                            Relationship: {relationshipType || 'Other'}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveConnection(connectionId, group.mainClient.id, client.id)}
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
        open={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Connect to {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : ''}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Relationship Type</InputLabel>
            <Select
              value={selectedRelationType}
              onChange={(e) => setSelectedRelationType(e.target.value as RelationshipType)}
              label="Relationship Type"
            >
              <MenuItem value="Siblings">Siblings</MenuItem>
              <MenuItem value="Parent/Child">Parent/Child</MenuItem>
              <MenuItem value="Extended Family">Extended Family</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
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
                  primary={`${client.firstName} ${client.lastName}`}
                  secondary={`Family #: ${client.familyNumber} | Phone: ${client.phone1}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSearchDialogOpen(false)}>Cancel</Button>
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