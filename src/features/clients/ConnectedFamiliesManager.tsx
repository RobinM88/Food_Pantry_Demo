import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Client } from '../../types/client';
import { ConnectedFamily, RelationshipType } from '../../types/connectedFamily';
import { ConnectedFamilyService } from '../../services/connectedFamily.service';

interface ConnectedFamiliesManagerProps {
  client: Client;
  allClients: Client[];
  onConnectionsChange?: (connections: ConnectedFamily[]) => void;
}

export const ConnectedFamiliesManager: React.FC<ConnectedFamiliesManagerProps> = ({
  client,
  allClients,
  onConnectionsChange
}) => {
  const [connections, setConnections] = useState<ConnectedFamily[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('Other');

  // Load existing connections
  useEffect(() => {
    if (client?.id) {
      loadConnections();
    }
  }, [client]);

  const loadConnections = async () => {
    try {
      const data = await ConnectedFamilyService.getByClientId(client.id);
      setConnections(data);
      onConnectionsChange?.(data);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const results = allClients.filter(c => 
        c.id !== client.id && // Don't show current client
        !connections.some(conn => conn.connectedTo === c.id) && // Don't show already connected clients
        (
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.familyNumber.includes(searchTerm) ||
          c.phone1.includes(searchTerm) ||
          (c.phone2 && c.phone2.includes(searchTerm))
        )
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, allClients, client.id, connections]);

  const handleAddConnection = async (connectedClient: Client) => {
    setSelectedClient(connectedClient);
  };

  const handleConfirmConnection = async () => {
    if (!selectedClient) return;
    
    try {
      const newConnection = await ConnectedFamilyService.create({
        clientId: client.id,
        connectedTo: selectedClient.id,
        relationshipType
      });

      // Also create the reverse connection
      await ConnectedFamilyService.create({
        clientId: selectedClient.id,
        connectedTo: client.id,
        relationshipType
      });

      // Refresh connections
      await loadConnections();
      setSearchTerm('');
      setSelectedClient(null);
      setRelationshipType('Other');
      setIsSearchOpen(false);
    } catch (error) {
      console.error('Error adding connection:', error);
    }
  };

  const handleRemoveConnection = async (connectionId: string, connectedClientId: string) => {
    try {
      // Remove both directions of the connection
      await ConnectedFamilyService.delete(connectionId);
      
      // Find and remove the reverse connection
      const reverseConnections = await ConnectedFamilyService.getByClientId(connectedClientId);
      const reverseConnection = reverseConnections.find(c => c.connectedTo === client.id);
      if (reverseConnection) {
        await ConnectedFamilyService.delete(reverseConnection.id);
      }

      // Refresh connections
      await loadConnections();
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Connected Families</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsSearchOpen(true)}
        >
          Add Connection
        </Button>
      </Box>

      {/* List of current connections */}
      <List>
        {connections.map((connection) => {
          const connectedClient = allClients.find(c => c.id === connection.connectedTo);
          if (!connectedClient) return null;

          return (
            <ListItem key={connection.id} component={Paper} variant="outlined" sx={{ mb: 1 }}>
              <ListItemText
                primary={`${connectedClient.firstName} ${connectedClient.lastName}`}
                secondary={`Family #: ${connectedClient.familyNumber} | Phone: ${connectedClient.phone1}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleRemoveConnection(connection.id, connectedClient.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Family Connection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search by name, family number, or phone"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {selectedClient ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Family: {selectedClient.firstName} {selectedClient.lastName}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Relationship Type</InputLabel>
                <Select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
                  label="Relationship Type"
                >
                  <MenuItem value="Siblings">Siblings</MenuItem>
                  <MenuItem value="Parent/Child">Parent/Child</MenuItem>
                  <MenuItem value="Extended Family">Extended Family</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ) : (
            <List>
              {searchResults.map((result) => (
                <ListItem
                  key={result.id}
                  button
                  onClick={() => handleAddConnection(result)}
                  component={Paper}
                  variant="outlined"
                  sx={{ mb: 1 }}
                >
                  <ListItemText
                    primary={`${result.firstName} ${result.lastName}`}
                    secondary={`Family #: ${result.familyNumber} | Phone: ${result.phone1}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsSearchOpen(false);
            setSelectedClient(null);
            setRelationshipType('Other');
          }}>
            Cancel
          </Button>
          {selectedClient && (
            <Button onClick={handleConfirmConnection} color="primary">
              Add Connection
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 