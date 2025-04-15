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
  MenuItem,
  useTheme,
  useMediaQuery
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
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('other');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load existing connections
  useEffect(() => {
    if (client?.id) {
      console.log('Loading connections for client:', client);
      loadConnections();
    }
  }, [client]);

  const loadConnections = async () => {
    try {
      const data = await ConnectedFamilyService.getByClientId(client.id);
      console.log('Loaded connections:', data);
      console.log('Available clients:', allClients);
      setConnections(data);
      onConnectionsChange?.(data);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  // Memoize search results computation
  const getFilteredResults = React.useCallback((searchTerm: string, allClients: Client[], clientId: string, connections: ConnectedFamily[]) => {
    if (searchTerm.length < 2) return [];
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    const connectedIds = new Set(connections.map(conn => conn.connected_to));

    return allClients.filter(c => {
      if (c.id === clientId || connectedIds.has(c.id)) return false;

      // Debug log to check client data
      console.log('Filtering client:', c);

      const firstName = (c.first_name || '').trim();
      const lastName = (c.last_name || '').trim();
      const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
      const familyNumber = (c.family_number || '').trim();
      const phone1 = (c.phone1 || '').trim();
      const phone2 = (c.phone2 || '').trim();

      return fullName.includes(searchTermLower) ||
             familyNumber.includes(searchTerm) ||
             phone1.includes(searchTerm) ||
             phone2.includes(searchTerm);
    });
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (isSearchOpen) {
        const results = getFilteredResults(searchTerm, allClients, client.id, connections);
        setSearchResults(results);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, allClients, client.id, connections, isSearchOpen, getFilteredResults]);

  const handleAddConnection = async (connectedClient: Client) => {
    setSelectedClient(connectedClient);
  };

  const handleConfirmConnection = async () => {
    if (!selectedClient) return;
    
    try {
      // Create the forward connection
      await ConnectedFamilyService.create({
        client_id: client.id,
        connected_to: selectedClient.id,
        relationship_type: relationshipType
      });

      // Also create the reverse connection
      await ConnectedFamilyService.create({
        client_id: selectedClient.id,
        connected_to: client.id,
        relationship_type: relationshipType
      });

      // Refresh connections
      await loadConnections();
      setSearchTerm('');
      setSelectedClient(null);
      setRelationshipType('other');
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
      const reverseConnection = reverseConnections.find(c => c.connected_to === client.id);
      if (reverseConnection) {
        await ConnectedFamilyService.delete(reverseConnection.id);
      }

      // Refresh connections
      await loadConnections();
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  // Memoize the connections rendering
  const ConnectionsList = React.memo(({ connections, allClients }: { connections: ConnectedFamily[], allClients: Client[] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!connections || connections.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No family connections found. Use the search above to create new connections.
        </Typography>
      );
    }

    return (
      <List>
        {connections.map((connection) => {
          const connectedClient = allClients.find(c => c.id === connection.connected_to);
          
          if (!connectedClient) {
            console.error('Connected client not found:', connection.connected_to);
            console.log('Available clients:', allClients);
            return null;
          }

          // Debug log to check client data
          console.log('Rendering connected client:', connectedClient);

          const firstName = (connectedClient.first_name || '').trim();
          const lastName = (connectedClient.last_name || '').trim();
          
          let fullName = 'Unknown Name';
          if (firstName || lastName) {
            fullName = [firstName, lastName].filter(Boolean).join(' ');
          }

          return (
            <ListItem 
              key={connection.id} 
              component={Paper} 
              variant="outlined" 
              sx={{ 
                mb: 1,
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                p: isMobile ? 2 : 1
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle1">
                    {fullName}
                  </Typography>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? 0.5 : 1,
                      '& > span': {
                        display: 'inline-flex',
                        alignItems: 'center'
                      }
                    }}
                  >
                    <span>{`Family #: ${connectedClient.family_number || 'N/A'}`}</span>
                    {connectedClient.phone1 && <span>{`Phone: ${connectedClient.phone1}`}</span>}
                    {connection.relationship_type && <span>{`Relationship: ${connection.relationship_type}`}</span>}
                  </Typography>
                }
              />
              <ListItemSecondaryAction sx={{ 
                position: isMobile ? 'relative' : 'absolute',
                transform: isMobile ? 'none' : undefined,
                top: isMobile ? undefined : undefined,
                right: isMobile ? undefined : 16,
                mt: isMobile ? 1 : 0
              }}>
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
    );
  });

  // Memoize search results rendering
  const SearchResultsList = React.memo(({ 
    results, 
    onSelect, 
    selectedId 
  }: { 
    results: Client[], 
    onSelect: (client: Client) => void,
    selectedId?: string 
  }) => (
    <List sx={{ mt: 2 }}>
      {results.map((result) => {
        // Debug log to check result data
        console.log('Rendering search result:', result);

        const firstName = (result.first_name || '').trim();
        const lastName = (result.last_name || '').trim();
        
        let fullName = 'Unknown Name';
        if (firstName || lastName) {
          fullName = [firstName, lastName].filter(Boolean).join(' ');
        }
        
        return (
          <ListItem
            key={result.id}
            button
            onClick={() => onSelect(result)}
            selected={selectedId === result.id}
          >
            <ListItemText
              primary={fullName}
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {`Family #: ${result.family_number || 'N/A'}`}
                  {result.phone1 ? ` | Phone: ${result.phone1}` : ''}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
      {results.length === 0 && searchTerm.length >= 2 && (
        <ListItem>
          <ListItemText primary="No matching families found" />
        </ListItem>
      )}
    </List>
  ));

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h6">Connected Families</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setIsSearchOpen(true);
            setSearchTerm('');
            setSearchResults([]);
          }}
          fullWidth={isMobile}
        >
          Add Connection
        </Button>
      </Box>

      <ConnectionsList connections={connections} allClients={allClients} />

      <Dialog 
        open={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Search for Family to Connect</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search by name, family number, or phone"
            type="text"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <SearchResultsList 
            results={searchResults} 
            onSelect={handleAddConnection} 
            selectedId={selectedClient?.id} 
          />
        </DialogContent>
        {selectedClient && (
          <Box sx={{ px: isMobile ? 2 : 3, pb: 2 }}>
            <FormControl fullWidth margin="dense">
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
          </Box>
        )}
        <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
          <Button onClick={() => {
            setIsSearchOpen(false);
            setSearchTerm('');
            setSelectedClient(null);
            setRelationshipType('other');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmConnection}
            disabled={!selectedClient}
            variant="contained"
            color="primary"
          >
            Add Connection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 