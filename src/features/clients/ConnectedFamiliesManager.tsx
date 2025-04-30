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
import { Client, ConnectedFamily, RelationshipType } from '../../types';
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
    if (client?.family_number) {
      console.log('Loading connections for client:', client);
      loadConnections();
    }
  }, [client]);

  const loadConnections = async () => {
    try {
      console.log('Loading connections for client family number:', client.family_number);
      const data = await ConnectedFamilyService.getByClientId(client.family_number);
      console.log('Raw connections data:', data);
      
      // Filter out any invalid connections and the current client's own connection
      const validConnections = data.filter(conn => {
        // Skip the current client's own connection record
        if (conn.family_number === client.family_number) return false;

        const connectedClient = allClients.find(c => c.family_number === conn.family_number);
        if (!connectedClient) {
          console.warn('Connected client not found for family number:', conn.family_number);
          return false;
        }
        return true;
      });

      console.log('Valid connections:', validConnections);
      setConnections(validConnections);
      onConnectionsChange?.(validConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  // Memoize search results computation
  const getFilteredResults = React.useCallback((searchTerm: string, allClients: Client[], clientId: string, connections: ConnectedFamily[]) => {
    if (searchTerm.length < 2) return [];
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    // Get all family numbers that are already connected (using connection groups)
    const connectedGroups = new Set(connections.map(conn => conn.connected_family_number));
    const connectedFamilies = new Set(connections.map(conn => conn.family_number));

    return allClients.filter(c => {
      // Skip if this is the current client or already connected
      if (c.family_number === clientId || connectedFamilies.has(c.family_number)) return false;

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
        const results = getFilteredResults(searchTerm, allClients, client.family_number, connections);
        setSearchResults(results);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, allClients, client.family_number, connections, isSearchOpen, getFilteredResults]);

  const handleAddConnection = async (connectedClient: Client) => {
    setSelectedClient(connectedClient);
  };

  const handleConfirmConnection = async () => {
    if (!selectedClient) return;
    
    try {
      // Generate a new connected_family_number for this group
      const cfNumber = await ConnectedFamilyService.generateConnectedFamilyNumber();

      // Create a new connection with the generated cf number
      await ConnectedFamilyService.create({
        family_number: client.family_number,
        connected_family_number: cfNumber,
        relationship_type: relationshipType
      });

      // Create the reverse connection with the same cf number
      await ConnectedFamilyService.create({
        family_number: selectedClient.family_number,
        connected_family_number: cfNumber,
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
      // This will remove all connections in the same group
      await ConnectedFamilyService.delete(connectionId);
      
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
          // Find the connected client using the family_number
          const connectedClient = allClients.find(c => c.family_number === connection.family_number);
          
          if (!connectedClient) {
            console.warn('Connected client not found:', connection.family_number);
            return null;
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
                  <Typography variant="subtitle1" component="span">
                    {`${connectedClient.first_name} ${connectedClient.last_name}`}
                  </Typography>
                }
                secondary={
                  <Box component="span" sx={{ 
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 0.5 : 1,
                    mt: 0.5
                  }}>
                    <Typography variant="body2" color="text.secondary" component="span">
                      Family #: {connectedClient.family_number}
                    </Typography>
                    {connectedClient.phone1 && (
                      <Typography variant="body2" color="text.secondary" component="span">
                        Phone: {connectedClient.phone1}
                      </Typography>
                    )}
                    {connection.relationship_type && (
                      <Typography variant="body2" color="text.secondary" component="span">
                        Relationship: {connection.relationship_type}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleRemoveConnection(connection.id, connectedClient.family_number)}
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