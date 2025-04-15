import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import PhoneLogDetails from '../PhoneLogDetails';
import { format } from 'date-fns';
import { PhoneLog, Client } from '../../../types';

// Mock useMediaQuery
jest.mock('@mui/material/useMediaQuery');
const mockUseMediaQuery = useMediaQuery as jest.Mock;

// Mock theme
const theme = createTheme();

// Mock data
const mockClient: Client = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  family_number: 'F001',
  phone1: '(555) 123-4567',
  member_status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockPhoneLog: PhoneLog = {
  id: '1',
  familySearchId: '1',
  phoneNumber: '(555) 123-4567',
  callType: 'incoming',
  callOutcome: 'successful',
  notes: 'Test note content',
  createdAt: new Date('2024-01-01T10:00:00').toISOString(),
  updatedAt: new Date('2024-01-01T10:00:00').toISOString()
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PhoneLogDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop view
    });

    it('renders call information correctly', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={mockClient}
        />
      );

      // Check section headers
      expect(screen.getByText('Call Information')).toBeInTheDocument();
      
      // Check date formatting
      const formattedDate = format(new Date(mockPhoneLog.createdAt), 'MMM d, yyyy h:mm a');
      expect(screen.getByText(formattedDate)).toBeInTheDocument();

      // Check phone number
      expect(screen.getByText(mockPhoneLog.phoneNumber)).toBeInTheDocument();

      // Check call type chip
      const callTypeChip = screen.getByText('Incoming');
      expect(callTypeChip).toBeInTheDocument();
      expect(screen.getByTestId('CallTypeChipIcon')).toBeInTheDocument();

      // Check call outcome chip
      const callOutcomeChip = screen.getByText('successful');
      expect(callOutcomeChip).toBeInTheDocument();
      expect(screen.getByTestId('CallOutcomeChipIcon')).toBeInTheDocument();
    });

    it('renders client information correctly', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={mockClient}
        />
      );

      // Check client section
      expect(screen.getByText('Client Information')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(mockClient.phone1)).toBeInTheDocument();
      
      // Check member status chip
      const statusChip = screen.getByText('active');
      expect(statusChip).toBeInTheDocument();
    });

    it('renders notes section correctly', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={mockClient}
        />
      );

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Test note content')).toBeInTheDocument();
    });

    it('uses desktop-specific styles', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={mockClient}
        />
      );

      const header = screen.getByText('Call Information');
      expect(header).toHaveStyle({ fontSize: '1.25rem' });
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile view
    });

    it('renders with mobile-friendly layout', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={mockClient}
        />
      );

      const header = screen.getByText('Call Information');
      expect(header).toHaveStyle({ fontSize: '1.1rem' });
    });

    it('renders mobile-specific spacing', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={mockClient}
        />
      );

      // Check for mobile-specific padding
      const container = screen.getByTestId('phone-log-details-container');
      expect(container).toHaveStyle({ padding: '16px' });
    });

    it('renders chips with mobile size', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={mockClient}
        />
      );

      const callTypeChip = screen.getByText('Incoming').closest('.MuiChip-root');
      expect(callTypeChip).toHaveClass('MuiChip-sizeSmall');
    });
  });

  describe('Common Functionality', () => {
    it('handles missing client data gracefully', () => {
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={mockPhoneLog}
          client={null}
        />
      );

      expect(screen.getByText('No client information available')).toBeInTheDocument();
    });

    it('handles missing notes gracefully', () => {
      const phoneLogWithoutNotes = { ...mockPhoneLog, notes: '' };
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={phoneLogWithoutNotes}
          client={mockClient}
        />
      );

      expect(screen.getByText('No notes')).toBeInTheDocument();
    });

    it('displays correct icons for different call types', () => {
      const outgoingPhoneLog = { ...mockPhoneLog, callType: 'outgoing' as const };
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={outgoingPhoneLog}
          client={mockClient}
        />
      );

      expect(screen.getByTestId('CallTypeIcon')).toBeInTheDocument();
      expect(screen.getByText('Outgoing')).toBeInTheDocument();
    });

    it('displays correct icons for different call outcomes', () => {
      const voicemailPhoneLog = { ...mockPhoneLog, callOutcome: 'voicemail' as const };
      renderWithTheme(
        <PhoneLogDetails
          phoneLog={voicemailPhoneLog}
          client={mockClient}
        />
      );

      expect(screen.getByTestId('CallOutcomeIcon')).toBeInTheDocument();
      expect(screen.getByText('voicemail')).toBeInTheDocument();
    });
  });
}); 