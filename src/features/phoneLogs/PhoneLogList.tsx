import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Visibility as ViewIcon,
  Call as CallIcon,
  CallEnd as CallEndIcon,
  Voicemail as VoicemailIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PhoneLog, Client } from '../../types';
import PhoneLogDetails from './PhoneLogDetails';
import { formatPhoneNumber } from '../../utils/phoneNumberUtils';

interface PhoneLogListProps {
  phoneLogs: PhoneLog[];
  clients: Client[];
  onViewLog: (phoneLog: PhoneLog) => void;
}

type CallType = 'incoming' | 'outgoing';
type CallOutcome = 'completed' | 'voicemail' | 'no_answer' | 'wrong_number';

export default function PhoneLogList({
  phoneLogs,
  clients,
  onViewLog,
}: PhoneLogListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCallType, setFilterCallType] = useState<CallType | 'all'>('all');
  const [filterCallOutcome, setFilterCallOutcome] = useState<CallOutcome | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPhoneLog, setSelectedPhoneLog] = useState<PhoneLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Format phone number to xxx-xxx-xxxx
  const formatPhoneNumberDisplay = (value: string): string => {
    return formatPhoneNumber(value);
  };

  // Filter phone logs based on search query and filters
  const filteredPhoneLogs = phoneLogs.filter(log => {
    const client = clients.find(c => c.familyNumber === log.familySearchId);
    const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) || 
      log.phoneNumber.toLowerCase().includes(searchLower) ||
      log.notes?.toLowerCase().includes(searchLower) || '';
    
    const matchesCallType = filterCallType === 'all' || log.callType === filterCallType;
    const matchesCallOutcome = filterCallOutcome === 'all' || log.callOutcome === filterCallOutcome;
    
    return matchesSearch && matchesCallType && matchesCallOutcome;
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleFilterCallTypeChange = (event: SelectChangeEvent) => {
    setFilterCallType(event.target.value as CallType | 'all');
    setPage(0);
  };

  const handleFilterCallOutcomeChange = (event: SelectChangeEvent) => {
    setFilterCallOutcome(event.target.value as CallOutcome | 'all');
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewPhoneLog = (phoneLog: PhoneLog) => {
    setSelectedPhoneLog(phoneLog);
    setDetailsDialogOpen(true);
    onViewLog(phoneLog);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
  };

  const getClientName = (familySearchId: string) => {
    const client = clients.find(c => c.familyNumber === familySearchId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  };

  const getCallTypeIcon = (callType: CallType) => {
    switch (callType) {
      case 'incoming':
        return <CallIcon fontSize="small" color="primary" />;
      case 'outgoing':
        return <CallEndIcon fontSize="small" color="secondary" />;
      default:
        return <PhoneIcon fontSize="small" />;
    }
  };

  const getCallOutcomeIcon = (callOutcome: CallOutcome) => {
    switch (callOutcome) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'voicemail':
        return <VoicemailIcon fontSize="small" color="info" />;
      case 'no_answer':
        return <PhoneDisabledIcon fontSize="small" color="warning" />;
      case 'wrong_number':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <PhoneIcon fontSize="small" />;
    }
  };

  const getCallTypeColor = (callType: CallType) => {
    switch (callType) {
      case 'incoming':
        return 'primary';
      case 'outgoing':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCallOutcomeColor = (callOutcome: CallOutcome) => {
    switch (callOutcome) {
      case 'completed':
        return 'success';
      case 'voicemail':
        return 'info';
      case 'no_answer':
        return 'warning';
      case 'wrong_number':
        return 'error';
      default:
        return 'default';
    }
  };

  const commonInputStyles = {
    height: '40px',
    '.MuiOutlinedInput-root': {
      height: '40px',
    },
    '.MuiOutlinedInput-input': {
      padding: '8px 14px',
      height: '24px',
      lineHeight: '24px',
    },
    '.MuiSelect-select': {
      padding: '8px 14px !important',
      height: '24px !important',
      lineHeight: '24px !important',
      display: 'flex !important',
      alignItems: 'center !important',
    },
    '.MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '.MuiInputAdornment-root': {
      height: '40px',
      maxHeight: '40px',
      marginTop: '0 !important',
    },
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            View and manage phone call logs
          </Typography>
        </Box>

        {/* Search and Filters Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Search Field */}
          <Grid item xs={12} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0 }}
            >
              Search
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search phone logs..."
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                ...commonInputStyles,
                mt: 0
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" sx={{ ml: 0.5, height: '20px' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Call Type Filter */}
          <Grid item xs={12} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0 }}
            >
              Filter by Call Type
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filterCallType}
              onChange={handleFilterCallTypeChange}
              displayEmpty
              sx={{
                ...commonInputStyles,
                mt: 0
              }}
            >
              <MenuItem value="all">All Call Types</MenuItem>
              <MenuItem value="incoming">Incoming</MenuItem>
              <MenuItem value="outgoing">Outgoing</MenuItem>
            </Select>
          </Grid>

          {/* Call Outcome Filter */}
          <Grid item xs={12} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0 }}
            >
              Filter by Call Outcome
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filterCallOutcome}
              onChange={handleFilterCallOutcomeChange}
              displayEmpty
              sx={{
                ...commonInputStyles,
                mt: 0
              }}
            >
              <MenuItem value="all">All Outcomes</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="voicemail">Voicemail</MenuItem>
              <MenuItem value="no_answer">No Answer</MenuItem>
              <MenuItem value="wrong_number">Wrong Number</MenuItem>
            </Select>
          </Grid>
        </Grid>

        {/* Phone Logs Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '18%' }}>Date & Time</TableCell>
                <TableCell sx={{ width: '20%' }}>Client</TableCell>
                <TableCell sx={{ width: '15%' }}>Phone Number</TableCell>
                <TableCell sx={{ width: '12%' }}>Call Type</TableCell>
                <TableCell sx={{ width: '12%' }}>Call Outcome</TableCell>
                <TableCell sx={{ width: '18%' }}>Notes</TableCell>
                <TableCell sx={{ width: '5%' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPhoneLogs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{getClientName(log.familySearchId)}</TableCell>
                    <TableCell>{formatPhoneNumberDisplay(log.phoneNumber)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getCallTypeIcon(log.callType)}
                        label={log.callType === 'incoming' ? 'Incoming' : 'Outgoing'}
                        color={getCallTypeColor(log.callType)}
                        size="small"
                        sx={{ minWidth: '90px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getCallOutcomeIcon(log.callOutcome)}
                        label={log.callOutcome.replace('_', ' ')}
                        color={getCallOutcomeColor(log.callOutcome)}
                        size="small"
                        sx={{ minWidth: '90px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography noWrap variant="body2">
                        {log.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewPhoneLog(log)}
                          sx={{ color: 'primary.main' }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
          <TablePagination
            component="div"
            count={filteredPhoneLogs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Phone Log Details</DialogTitle>
        <DialogContent>
          {selectedPhoneLog && (
            <PhoneLogDetails
              phoneLog={selectedPhoneLog}
              client={clients.find(c => c.familyNumber === selectedPhoneLog.familySearchId) || null}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 