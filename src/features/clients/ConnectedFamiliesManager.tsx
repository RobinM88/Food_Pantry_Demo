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
import { config } from '../../config';

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

  // Demo client data for well-known family numbers
  const getDemoClient = (familyNumber: string): Partial<Client> | null => {
    const demoClientMap: Record<string, Partial<Client>> = {
      'f1001': { first_name: 'John', last_name: 'Smith', phone1: '5551234567' },
      'f1002': { first_name: 'Jane', last_name: 'Doe', phone1: '5552345678' },
      'f1003': { first_name: 'Robert', last_name: 'Johnson', phone1: '5553456789' },
      'f1004': { first_name: 'Mary', last_name: 'Williams', phone1: '5554567890' },
    };
    return familyNumber in demoClientMap ? demoClientMap[familyNumber] : null;
  };

  const loadConnections = async () => {
    try {
      console.log('Loading connections for client family number:', client.family_number);
      
      // Get connections for this client
      const data = await ConnectedFamilyService.getByClientId(client.family_number);
      console.log('Raw connections data:', data);
      
      // Special handling for demo mode
      if (config.app.isDemoMode) {
        // Make sure data is not empty and handle demo families specifically
        if (client.family_number.startsWith('f100')) {
          const knownDemoFamilies = ['f1001', 'f1002', 'f1003', 'f1004'];
          const clientIndex = knownDemoFamilies.indexOf(client.family_number);
          
          if (clientIndex >= 0) {
            // Get paired family based on demo family number
            let pairedFamily: string | undefined;
            if (clientIndex === 0) pairedFamily = 'f1002';      // f1001 <-> f1002 (parent/child)
            else if (clientIndex === 1) pairedFamily = 'f1001'; // f1002 <-> f1001 (child/parent)
            else if (clientIndex === 2) pairedFamily = 'f1004'; // f1003 <-> f1004 (spouse/spouse)
            else if (clientIndex === 3) pairedFamily = 'f1003'; // f1004 <-> f1003 (spouse/spouse)
            
            // Find the paired client
            const pairedClient = allClients.find(c => c.family_number === pairedFamily);
            
            if (pairedClient && pairedFamily) {
              // Create a demo connection
              const demoConnections: ConnectedFamily[] = [{
                id: `demo-conn-${Date.now()}`,
                family_number: pairedFamily,
                connected_family_number: client.family_number.replace('f', 'cf'),
                relationship_type: clientIndex <= 1 ? (clientIndex === 0 ? 'child' : 'parent') : 'spouse'
              }];
              
              console.log('Demo mode: Created demo connection for display', demoConnections);
              setConnections(demoConnections);
              onConnectionsChange?.(demoConnections);

              // Add client info to the connection for display purposes
              if (pairedFamily) {
                const demoClientInfo = getDemoClient(pairedFamily);
                if (demoClientInfo) {
                  // Create a modified copy with client information
                  const enhancedConnections = demoConnections.map(conn => ({
                    ...conn,
                    client: {
                      id: `demo-${conn.family_number}`,
                      family_number: conn.family_number,
                      ...demoClientInfo,
                      // Add other required fields with defaults
                      adults: 1,
                      school_aged: 0,
                      small_children: 0,
                      family_size: 1,
                      member_status: 'active',
                      // Convert string dates to Date objects to match Client type
                      created_at: new Date(),
                      updated_at: new Date()
                    } as unknown as Client
                  }));
                  
                  setConnections(enhancedConnections);
                }
              }

              return;
            }
          }
        }
      }
      
      // Normal processing for non-demo mode or if demo special case didn't apply
      const validConnections = (data || []).filter(conn => {
        // Skip connections for the current client (we want to show the other client)
        if (conn.family_number === client.family_number) {
          // This is the client's own connection, find others in the group
          const connectedFamily = allClients.find(c => 
            conn.connected_family_number.startsWith('f') && 
            c.family_number === conn.connected_family_number
          );
          return !!connectedFamily;
        }
        
        // This shows other clients connected to this one
        const connectedClient = allClients.find(c => c.family_number === conn.family_number);
        return !!connectedClient;
      });

      console.log('Valid connections after filtering:', validConnections);
      setConnections(validConnections);
      onConnectionsChange?.(validConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
      setConnections([]);
      onConnectionsChange?.([]);
    }
  };

  // Memoize search results computation
  const getFilteredResults = React.useCallback((searchTerm: string, allClients: Client[], clientId: string, connections: ConnectedFamily[]) => {
    if (searchTerm.length < 2) return [];
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    // Get all family numbers that are already connected
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
      // In demo mode, suppress errors and still update UI
      if (config?.app?.isDemoMode) {
        console.log('Demo mode: Silently handling connection creation error');
        await loadConnections(); // Still refresh UI
        setSearchTerm('');
        setSelectedClient(null);
        setRelationshipType('other');
        setIsSearchOpen(false);
        return;
      }
      console.error('Error adding connection:', error);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      // This will remove all connections in the same group
      await ConnectedFamilyService.delete(connectionId);
      
      // Refresh connections
      await loadConnections();
    } catch (error) {
      // In demo mode, suppress errors in the console
      if (config?.app?.isDemoMode) {
        console.log('Demo mode: Silently handling connection removal error');
        await loadConnections(); // Still refresh UI
        return;
      }
      console.error('Error removing connection:', error);
    }
  };

  // Memoize the connections rendering
  const ConnectionsList = React.memo(({ connections, allClients }: { connections: ConnectedFamily[], allClients: Client[] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    console.log('ConnectionsList render with connections:', connections);

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
          // Try to use attached client property first (from demo mode)
          const connectedClient = (connection as any).client || 
            // Fall back to finding client in the allClients array
            allClients.find(c => c.family_number === connection.family_number);
          
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
                  onClick={() => handleRemoveConnection(connection.id)}
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