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
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack,
  List,
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
import { CallType, CallOutcome } from '../../types/phoneLog';
import PhoneLogDetails from './PhoneLogDetails';
import { formatPhoneNumber } from '../../utils/phoneNumberUtils';

interface PhoneLogListProps {
  phoneLogs: PhoneLog[];
  clients: Client[];
  onViewLog: (phoneLog: PhoneLog) => void;
}

export default function PhoneLogList({
  phoneLogs,
  clients,
  onViewLog,
}: PhoneLogListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Filter phone logs based on search query and filters
  const filteredPhoneLogs = phoneLogs.filter(log => {
    const client = clients.find(c => c.family_number === log.family_number);
    const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : '';
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) || 
      log.phone_number.toLowerCase().includes(searchLower) ||
      log.notes?.toLowerCase().includes(searchLower) || '';
    
    const matchesCallType = filterCallType === 'all' || log.call_type === filterCallType;
    const matchesCallOutcome = filterCallOutcome === 'all' || log.call_outcome === filterCallOutcome;
    
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

  const getClientName = (familyNumber: string) => {
    const client = clients.find(c => c.family_number === familyNumber);
    return client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
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
      case 'successful':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'voicemail':
        return <VoicemailIcon fontSize="small" color="info" />;
      case 'no_answer':
        return <PhoneDisabledIcon fontSize="small" color="warning" />;
      case 'wrong_number':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'disconnected':
        return <PhoneDisabledIcon fontSize="small" color="error" />;
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
      case 'successful':
        return 'success';
      case 'voicemail':
        return 'info';
      case 'no_answer':
        return 'warning';
      case 'wrong_number':
        return 'error';
      case 'disconnected':
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

  // Mobile view for phone logs
  const renderMobileView = () => (
    <List sx={{ px: 0 }}>
      {filteredPhoneLogs
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((log) => (
          <Card key={log.id} sx={{ mb: 2, overflow: 'hidden' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack spacing={1.5}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, flexGrow: 1 }}>
                    {getClientName(log.family_number)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleViewPhoneLog(log)}
                    sx={{ 
                      color: 'primary.main',
                      mr: -1,
                      mt: -0.5
                    }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(log.created_at)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">
                    {formatPhoneNumberDisplay(log.phone_number)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={getCallTypeIcon(log.call_type)}
                    label={log.call_type === 'incoming' ? 'Incoming' : 'Outgoing'}
                    color={getCallTypeColor(log.call_type)}
                    size="small"
                    sx={{ minWidth: '90px', mb: 0.5 }}
                  />
                  <Chip
                    icon={getCallOutcomeIcon(log.call_outcome)}
                    label={log.call_outcome.replace('_', ' ')}
                    color={getCallOutcomeColor(log.call_outcome)}
                    size="small"
                    sx={{ minWidth: '90px', mb: 0.5 }}
                  />
                </Stack>

                {log.notes && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {log.notes}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
    </List>
  );

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" gutterBottom>
            View and manage phone call logs
          </Typography>
        </Box>

        {/* Search and Filters Section */}
        <Grid 
          container 
          spacing={2} 
          sx={{ 
            mb: { xs: 3, sm: 4 }
          }}
        >
          {/* Search Field */}
          <Grid item xs={12} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0.5 }}
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
          <Grid item xs={6} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0.5 }}
            >
              Call Type
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
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="incoming">Incoming</MenuItem>
              <MenuItem value="outgoing">Outgoing</MenuItem>
            </Select>
          </Grid>

          {/* Call Outcome Filter */}
          <Grid item xs={6} md={4}>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mb: 0.5 }}
            >
              Outcome
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
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="successful">Successful</MenuItem>
              <MenuItem value="voicemail">Voicemail</MenuItem>
              <MenuItem value="no_answer">No Answer</MenuItem>
              <MenuItem value="wrong_number">Wrong Number</MenuItem>
              <MenuItem value="disconnected">Disconnected</MenuItem>
            </Select>
          </Grid>
        </Grid>

        {/* Phone Logs Table/List */}
        {isMobile ? (
          renderMobileView()
        ) : (
          <TableContainer sx={{ 
            overflowX: 'auto',
            '.MuiTable-root': {
              minWidth: 800 // ensures table has a minimum width, forcing scroll on smaller screens
            }
          }}>
            <Table size={isMobile ? "small" : "medium"}>
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
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>{getClientName(log.family_number)}</TableCell>
                      <TableCell>{formatPhoneNumberDisplay(log.phone_number)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getCallTypeIcon(log.call_type)}
                          label={log.call_type === 'incoming' ? 'Incoming' : 'Outgoing'}
                          color={getCallTypeColor(log.call_type)}
                          size="small"
                          sx={{ minWidth: '90px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getCallOutcomeIcon(log.call_outcome)}
                          label={log.call_outcome.replace('_', ' ')}
                          color={getCallOutcomeColor(log.call_outcome)}
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
        )}

        {/* Pagination */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          pt: 2,
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            display: { xs: 'none', sm: 'block' }
          },
          '.MuiTablePagination-select, .MuiTablePagination-actions': {
            marginRight: { xs: 0, sm: 2 }
          }
        }}>
          <TablePagination
            component="div"
            count={filteredPhoneLogs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
            labelRowsPerPage={isMobile ? "" : "Rows per page:"}
          />
        </Box>
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Phone Log Details</DialogTitle>
        <DialogContent>
          {selectedPhoneLog && (
            <PhoneLogDetails
              phoneLog={selectedPhoneLog}
              client={clients.find(c => c.family_number === selectedPhoneLog.family_number) || null}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 