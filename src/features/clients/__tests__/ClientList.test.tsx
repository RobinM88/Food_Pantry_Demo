import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import ClientList from '../ClientList';
import { Client, MemberStatus } from '../../../types';

// Mock useMediaQuery hook
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn()
}));

const mockUseMediaQuery = useMediaQuery as jest.Mock;

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    family_number: 'F001',
    first_name: 'John',
    last_name: 'Doe',
    phone1: '(555) 123-4567',
    member_status: MemberStatus.Active,
    is_unhoused: false,
    is_temporary: false,
    adults: 2,
    school_aged: 1,
    small_children: 0,
    last_visit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_visits: 0,
    total_this_month: 0
  },
  {
    id: '2',
    family_number: 'F002',
    first_name: 'Jane',
    last_name: 'Smith',
    phone1: '(555) 987-6543',
    member_status: MemberStatus.Inactive,
    is_unhoused: false,
    is_temporary: false,
    adults: 1,
    school_aged: 2,
    small_children: 1,
    last_visit: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_visits: 3,
    total_this_month: 1
  }
];

const mockHandleViewClient = jest.fn();
const mockHandleEditClient = jest.fn();

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ClientList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Not mobile
    });

    it('renders table view with correct columns', () => {
      renderWithTheme(
        <ClientList 
          clients={mockClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      expect(screen.getByText('Family #')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Visit')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays client data correctly in table', () => {
      renderWithTheme(
        <ClientList 
          clients={mockClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      expect(screen.getByText('F001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      expect(screen.getByText('F002')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('handles view and edit actions', () => {
      renderWithTheme(
        <ClientList 
          clients={mockClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      const editButtons = screen.getAllByRole('button', { name: /edit/i });

      fireEvent.click(viewButtons[0]);
      expect(mockHandleViewClient).toHaveBeenCalledWith(mockClients[0]);

      fireEvent.click(editButtons[0]);
      expect(mockHandleEditClient).toHaveBeenCalledWith(mockClients[0]);
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Is mobile
    });

    it('renders card view for mobile', () => {
      renderWithTheme(
        <ClientList 
          clients={mockClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      expect(screen.getByText('View and manage clients')).toBeInTheDocument();
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(mockClients.length);
    });

    it('displays client data correctly in cards', () => {
      renderWithTheme(
        <ClientList 
          clients={mockClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      expect(screen.getByText('F001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      expect(screen.getByText('F002')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Common Functionality', () => {
    it('filters clients based on search query', () => {
      renderWithTheme(
        <ClientList 
          clients={mockClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search clients/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters by member status', () => {
      renderWithTheme(
        <ClientList 
          clients={mockClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      const statusFilter = screen.getByLabelText(/status/i);
      fireEvent.mouseDown(statusFilter);
      const activeOption = screen.getByRole('option', { name: /active/i });
      fireEvent.click(activeOption);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('handles pagination correctly', () => {
      const manyClients = Array(15).fill(null).map((_, index) => ({
        ...mockClients[0],
        id: `${index + 1}`,
        family_number: `F${String(index + 1).padStart(3, '0')}`
      }));

      renderWithTheme(
        <ClientList 
          clients={manyClients}
          onViewClient={mockHandleViewClient}
          onEditClient={mockHandleEditClient}
        />
      );

      const nextPageButton = screen.getByRole('button', { name: /next page/i });
      fireEvent.click(nextPageButton);

      expect(screen.getByText('F011')).toBeInTheDocument();
      expect(screen.queryByText('F001')).not.toBeInTheDocument();
    });
  });
}); 