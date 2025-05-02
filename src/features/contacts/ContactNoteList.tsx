import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { ContactNote } from '../../types';

interface ContactNoteListProps {
  contactNotes: ContactNote[];
  onViewNote: (note: ContactNote) => void;
  onEditNote: (note: ContactNote) => void;
  onDeleteNote: (note: ContactNote) => void;
}

export default function ContactNoteList({
  contactNotes,
  onViewNote,
  onEditNote,
  onDeleteNote
}: ContactNoteListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');

  const filteredNotes = contactNotes.filter(note => {
    const matchesSearch = note.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === 'all' || note.contact_method === methodFilter;
    const matchesPurpose = purposeFilter === 'all' || note.contact_purpose === purposeFilter;
    return matchesSearch && matchesMethod && matchesPurpose;
  });

  const renderDesktopView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Purpose</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredNotes.map((note) => (
            <TableRow key={note.id}>
              <TableCell>{format(new Date(note.contact_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>{note.contact_method}</TableCell>
              <TableCell>{note.contact_purpose}</TableCell>
              <TableCell>{note.notes}</TableCell>
              <TableCell align="right">
                <Tooltip title="View">
                  <IconButton onClick={() => onViewNote(note)} size="small">
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton onClick={() => onEditNote(note)} size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => onDeleteNote(note)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderMobileView = () => (
    <Box>
      {filteredNotes.map((note) => (
        <Card key={note.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {format(new Date(note.contact_date), 'MMM d, yyyy')}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              {note.contact_method} - {note.contact_purpose}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {note.notes}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <IconButton onClick={() => onViewNote(note)} size="small">
                <ViewIcon />
              </IconButton>
              <IconButton onClick={() => onEditNote(note)} size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => onDeleteNote(note)} size="small">
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Search Notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Contact Method</InputLabel>
            <Select
              value={methodFilter}
              label="Contact Method"
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <MenuItem value="all">All Methods</MenuItem>
              <MenuItem value="phone">Phone</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="in-person">In Person</MenuItem>
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Contact Purpose</InputLabel>
            <Select
              value={purposeFilter}
              label="Contact Purpose"
              onChange={(e) => setPurposeFilter(e.target.value)}
            >
              <MenuItem value="all">All Purposes</MenuItem>
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="scheduling">Scheduling</MenuItem>
              <MenuItem value="follow-up">Follow Up</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {isMobile ? renderMobileView() : renderDesktopView()}
    </Box>
  );
} 