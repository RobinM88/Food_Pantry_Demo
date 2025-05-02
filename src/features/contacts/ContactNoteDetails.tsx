import { Typography, Box, Grid } from '@mui/material';
import { ContactNote } from '../../types';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Sms as TextIcon,
  MoreHoriz as OtherIcon
} from '@mui/icons-material';

interface ContactNoteDetailsProps {
  contactNote: ContactNote;
}

const methodIcons = {
  phone: PhoneIcon,
  email: EmailIcon,
  'in-person': PersonIcon,
  text: TextIcon,
  other: OtherIcon
};

export default function ContactNoteDetails({ contactNote }: ContactNoteDetailsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const MethodIcon = methodIcons[contactNote.contact_method] || OtherIcon;

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contact Details
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Date & Time
            </Typography>
            <Typography variant="body1">
              {format(new Date(contactNote.contact_date), 'MMM d, yyyy h:mm a')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Contact Method
              </Typography>
              <Chip
                icon={<MethodIcon />}
                label={contactNote.contact_method}
                size={isMobile ? 'small' : 'medium'}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Purpose
            </Typography>
            <Chip
              label={contactNote.contact_purpose}
              size={isMobile ? 'small' : 'medium'}
              color="secondary"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Notes
            </Typography>
            <Card variant="outlined" sx={{ mt: 1, backgroundColor: theme.palette.grey[50] }}>
              <CardContent>
                <Typography variant="body1">
                  {contactNote.notes || 'No notes provided'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Divider />
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Created: {format(new Date(contactNote.created_at), 'MMM d, yyyy h:mm a')}
              </Typography>
              {contactNote.updated_at !== contactNote.created_at && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Last Updated: {format(new Date(contactNote.updated_at), 'MMM d, yyyy h:mm a')}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
} 