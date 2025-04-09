import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Chip, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Notes as NotesIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Client, MemberStatus } from '../../types';
import { format } from 'date-fns';

interface ClientDetailsProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onStatusChange?: (client: Client, newStatus: MemberStatus) => void;
}

export default function ClientDetails({ 
  client, 
  onEdit, 
  onDelete,
  onStatusChange 
}: ClientDetailsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(client);
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleStatusChange = (newStatus: MemberStatus) => {
    if (onStatusChange) {
      onStatusChange(client, newStatus);
    }
    handleStatusClose();
  };

  const getStatusColor = (status: Client['memberStatus']) => {
    switch (status) {
      case MemberStatus.Active:
        return 'success';
      case MemberStatus.Inactive:
        return 'error';
      case MemberStatus.Pending:
        return 'warning';
      case MemberStatus.Suspended:
        return 'warning';
      case MemberStatus.Banned:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Client Details
          </Typography>
          <Box>
            <IconButton 
              aria-label="edit" 
              onClick={() => onEdit(client)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              aria-label="delete" 
              onClick={handleDeleteClick}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={`${client.firstName} ${client.lastName}`} 
                  secondary="Full Name" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={client.familySize} 
                  secondary="Household Size" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <IconButton size="small" onClick={handleStatusClick}>
                    <MoreVertIcon />
                  </IconButton>
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={client.memberStatus} 
                        color={getStatusColor(client.memberStatus) as any}
                        size="small"
                      />
                      {onStatusChange && (
                        <Typography variant="caption" color="text.secondary">
                          (Click dots to change)
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary="Status" 
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <List>
              {client.phone1 && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={client.phone1} 
                    secondary="Phone" 
                  />
                </ListItem>
              )}
              {(client.address || client.zipCode) && (
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${client.address || ''} ${client.aptNumber ? `Apt ${client.aptNumber}` : ''}, ${client.zipCode || ''}`}
                    secondary="Address" 
                  />
                </ListItem>
              )}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Additional Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={client.lastVisit ? format(client.lastVisit, 'MMMM d, yyyy') : 'Never'} 
                  secondary="Last Visit" 
                />
              </ListItem>
              {(client.foodNotes || client.officeNotes) && (
                <ListItem>
                  <ListItemIcon>
                    <NotesIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={client.foodNotes || client.officeNotes} 
                    secondary="Notes" 
                  />
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusClose}
      >
        <MenuItem 
          onClick={() => handleStatusChange(MemberStatus.Active)}
          disabled={client.memberStatus === MemberStatus.Active}
        >
          <Chip 
            label="Active" 
            color="success" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          Set as Active
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange(MemberStatus.Pending)}
          disabled={client.memberStatus === MemberStatus.Pending}
        >
          <Chip 
            label="Pending" 
            color="warning" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          Set as Pending
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange(MemberStatus.Inactive)}
          disabled={client.memberStatus === MemberStatus.Inactive}
        >
          <Chip 
            label="Inactive" 
            color="error" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          Set as Inactive
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange(MemberStatus.Suspended)}
          disabled={client.memberStatus === MemberStatus.Suspended}
        >
          <Chip 
            label="Suspended" 
            color="warning" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          Set as Suspended
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange(MemberStatus.Banned)}
          disabled={client.memberStatus === MemberStatus.Banned}
        >
          <Chip 
            label="Banned" 
            color="error" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          Set as Banned
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {client.firstName} {client.lastName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 