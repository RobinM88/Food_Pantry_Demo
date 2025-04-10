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
  ListItemIcon
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
import { PhoneLog, Client, MemberStatus } from '../../types';

interface PhoneLogDetailsProps {
  phoneLog: PhoneLog;
  client: Client | null;
}

type CallType = 'incoming' | 'outgoing';
type CallOutcome = 'completed' | 'voicemail' | 'no_answer' | 'wrong_number';

export default function PhoneLogDetails({ phoneLog, client }: PhoneLogDetailsProps) {
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
      case 'completed':
        return <CheckCircleIcon fontSize="small" color="success" data-testid={testId} />;
      case 'voicemail':
        return <VoicemailIcon fontSize="small" color="info" data-testid={testId} />;
      case 'no_answer':
        return <PhoneDisabledIcon fontSize="small" color="warning" data-testid={testId} />;
      case 'wrong_number':
        return <ErrorIcon fontSize="small" color="error" data-testid={testId} />;
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

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Call Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Call Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Date & Time"
                  secondary={format(new Date(phoneLog.createdAt), 'MMM d, yyyy h:mm a')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone Number"
                  secondary={phoneLog.phoneNumber}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {getCallTypeIcon(phoneLog.callType)}
                </ListItemIcon>
                <ListItemText
                  primary="Call Type"
                  secondary={
                    <Typography component="div" variant="body2">
                      <Chip
                        icon={getCallTypeIcon(phoneLog.callType, true)}
                        label={phoneLog.callType === 'incoming' ? 'Incoming' : 'Outgoing'}
                        size="small"
                        color={getCallTypeColor(phoneLog.callType) as any}
                      />
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {getCallOutcomeIcon(phoneLog.callOutcome)}
                </ListItemIcon>
                <ListItemText
                  primary="Call Outcome"
                  secondary={
                    <Typography component="div" variant="body2">
                      <Chip
                        icon={getCallOutcomeIcon(phoneLog.callOutcome, true)}
                        label={phoneLog.callOutcome.replace('_', ' ')}
                        size="small"
                        color={getCallOutcomeColor(phoneLog.callOutcome) as any}
                      />
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Client Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Client Information
            </Typography>
            {client ? (
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Name"
                    secondary={`${client.firstName} ${client.lastName}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Client Phone"
                    secondary={client.phone1}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Typography component="div" variant="body2">
                        <Chip
                          label={client.memberStatus}
                          size="small"
                          color={client.memberStatus === MemberStatus.Active ? 'success' : 'default'}
                        />
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            ) : (
              <Typography color="textSecondary">No client information available</Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            {phoneLog.notes ? (
              <Typography>{phoneLog.notes}</Typography>
            ) : (
              <Typography color="textSecondary">No notes</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 