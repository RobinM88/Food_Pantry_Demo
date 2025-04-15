import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import PhoneLogList from '../PhoneLogList';
import { formatPhoneNumber } from '../../../utils/phoneNumberUtils';

// Mock useMediaQuery hook
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

// Mock data
const mockClients = [
  { id: '1', first_name: 'John', last_name: 'Doe' },
  { id: '2', first_name: 'Jane', last_name: 'Smith' }
];

const mockPhoneLogs = [
  {
    id: '1',
    familySearchId: '1',
    phoneNumber: '1234567890',
    callType: 'incoming',
    callOutcome: 'successful',
    notes: 'Test note 1',
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    familySearchId: '2',
    phoneNumber: '0987654321',
    callType: 'outgoing',
    callOutcome: 'no_answer',
    notes: 'Test note 2',
    createdAt: '2024-01-02T11:00:00Z'
  }
];

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PhoneLogList', () => {
  const mockOnViewLog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      (useMediaQuery as jest.Mock).mockReturnValue(false);
    });

    it('renders table view with correct columns', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Date & Time')).toBeInTheDocument();
      expect(screen.getByText('Client')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Call Type')).toBeInTheDocument();
      expect(screen.getByText('Call Outcome')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays phone log data correctly in table', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      // Check first row data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(formatPhoneNumber('1234567890'))).toBeInTheDocument();
      expect(screen.getByText('Incoming')).toBeInTheDocument();
      expect(screen.getByText('successful')).toBeInTheDocument();
      expect(screen.getByText('Test note 1')).toBeInTheDocument();
    });

    it('handles view log action', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      fireEvent.click(viewButtons[0]);

      expect(mockOnViewLog).toHaveBeenCalledWith(mockPhoneLogs[0]);
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      (useMediaQuery as jest.Mock).mockReturnValue(true);
    });

    it('renders card view for mobile', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      const cards = screen.getAllByRole('heading', { level: 6 });
      expect(cards.filter(card => card.textContent !== 'View and manage phone call logs')).toHaveLength(mockPhoneLogs.length);
    });

    it('displays phone log data correctly in cards', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(formatPhoneNumber('1234567890'))).toBeInTheDocument();
      expect(screen.getByText('Incoming')).toBeInTheDocument();
      expect(screen.getByText('successful')).toBeInTheDocument();
      expect(screen.getByText('Test note 1')).toBeInTheDocument();
    });
  });

  describe('Common Functionality', () => {
    it('filters phone logs based on search query', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search phone logs...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters by call type', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      const filterSelect = screen.getByText('All Call Types');
      fireEvent.mouseDown(filterSelect);
      const listbox = screen.getByRole('listbox');
      fireEvent.click(within(listbox).getByText(/incoming/i));

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters by call outcome', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      const filterSelect = screen.getByText('All Outcomes');
      fireEvent.mouseDown(filterSelect);
      const listbox = screen.getByRole('listbox');
      fireEvent.click(within(listbox).getByText(/successful/i));

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('handles pagination correctly', () => {
      renderWithTheme(
        <PhoneLogList
          phoneLogs={mockPhoneLogs}
          clients={mockClients}
          onViewLog={mockOnViewLog}
        />
      );

      const rowsPerPageSelect = screen.getByLabelText('Rows per page:');
      fireEvent.mouseDown(rowsPerPageSelect);
      const listbox = screen.getByRole('listbox');
      fireEvent.click(within(listbox).getByText('5'));

      if (useMediaQuery('(max-width:600px)')) {
        const cards = screen.getAllByRole('heading', { level: 6 });
        expect(cards.filter(card => card.textContent !== 'View and manage phone call logs')).toHaveLength(mockPhoneLogs.length);
      } else {
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(mockPhoneLogs.length + 1); // +1 for header row
      }
    });
  });
}); 