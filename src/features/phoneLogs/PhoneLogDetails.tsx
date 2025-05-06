
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  Call as CallIcon,
  CallEnd as CallEndIcon,
  Voicemail as VoicemailIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PhoneLog, Client } from '../../types';
import { CallType, CallOutcome } from '../../types';
import { formatPhoneNumber } from '../../utils/phoneNumberUtils';

interface PhoneLogDetailsProps {
  phoneLog: PhoneLog;
  client: Client | null;
}

export default function PhoneLogDetails({ phoneLog, client }: PhoneLogDetailsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getCallTypeIcon = (callType: CallType, isChip = false) => {
    const testId = isChip ? 'CallTypeChipIcon' : 'CallTypeIcon';
    switch (callType) {
      case 'incoming':
        return <CallIcon fontSize="small" color="primary" data-testid={testId} />;
      case 'outgoing':
        return <CallEndIcon fontSize="small" color="secondary" data-testid={testId} />;
      default:
        return <PhoneIcon fontSize="small" data-testid={testId} />;
    }
  };

  const getCallOutcomeIcon = (callOutcome: CallOutcome, isChip = false) => {
    const testId = isChip ? 'CallOutcomeChipIcon' : 'CallOutcomeIcon';
    switch (callOutcome) {
      case 'successful':
        return <CheckCircleIcon fontSize="small" color="success" data-testid={testId} />;
      case 'voicemail':
        return <VoicemailIcon fontSize="small" color="info" data-testid={testId} />;
      case 'no_answer':
        return <PhoneDisabledIcon fontSize="small" color="warning" data-testid={testId} />;
      case 'wrong_number':
        return <ErrorIcon fontSize="small" color="error" data-testid={testId} />;
      case 'disconnected':
        return <PhoneDisabledIcon fontSize="small" color="error" data-testid={testId} />;
      default:
        return <PhoneIcon fontSize="small" data-testid={testId} />;
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

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Call Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Call Information
            </Typography>
            <List sx={{ py: 0 }}>
              <ListItem sx={{ px: isMobile ? 0 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                      Date & Time
                    </Typography>
                  }
                  secondary={
                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ mt: 0.5 }}>
                      {format(new Date(phoneLog.created_at), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ px: isMobile ? 0 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                      Phone Number
                    </Typography>
                  }
                  secondary={
                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ mt: 0.5 }}>
                      {formatPhoneNumber(phoneLog.phone_number)}
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ px: isMobile ? 0 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  {getCallTypeIcon(phoneLog.call_type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                      Call Type
                    </Typography>
                  }
                  secondary={
                    <Chip
                      icon={getCallTypeIcon(phoneLog.call_type, true)}
                      label={phoneLog.call_type === 'incoming' ? 'Incoming' : 'Outgoing'}
                      size={isMobile ? "small" : "medium"}
                      color={getCallTypeColor(phoneLog.call_type)}
                      sx={{ mt: 0.5 }}
                    />
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              <ListItem sx={{ px: isMobile ? 0 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  {getCallOutcomeIcon(phoneLog.call_outcome)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                      Call Outcome
                    </Typography>
                  }
                  secondary={
                    <Chip
                      icon={getCallOutcomeIcon(phoneLog.call_outcome, true)}
                      label={phoneLog.call_outcome.replace('_', ' ')}
                      size={isMobile ? "small" : "medium"}
                      color={getCallOutcomeColor(phoneLog.call_outcome)}
                      sx={{ mt: 0.5 }}
                    />
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: isMobile ? 1 : 2 }} />
          </Grid>

          {/* Client Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Client Information
            </Typography>
            {client ? (
              <List sx={{ py: 0 }}>
                <ListItem sx={{ px: isMobile ? 0 : 2 }}>
                  <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                        Client Name
                      </Typography>
                    }
                    secondary={
                      <Typography variant={isMobile ? "body1" : "h6"} sx={{ mt: 0.5 }}>
                        {`${client.first_name} ${client.last_name}`}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: isMobile ? 0 : 2 }}>
                  <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                        Client Phone
                      </Typography>
                    }
                    secondary={
                      <Typography variant={isMobile ? "body1" : "h6"} sx={{ mt: 0.5 }}>
                        {client.phone1}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: isMobile ? 0 : 2 }}>
                  <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                        Member Status
                      </Typography>
                    }
                    secondary={
                      <Chip
                        label={client.member_status}
                        color={client.member_status === 'active' ? 'success' : 'warning'}
                        size={isMobile ? "small" : "medium"}
                        sx={{ mt: 0.5 }}
                      />
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ px: isMobile ? 0 : 2 }}>
                No client information available
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: isMobile ? 1 : 2 }} />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Notes
            </Typography>
            {phoneLog.notes ? (
              <Typography sx={{ px: isMobile ? 0 : 2 }}>
                {phoneLog.notes}
              </Typography>
            ) : (
              <Typography color="text.secondary" sx={{ px: isMobile ? 0 : 2 }}>
                No notes
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 