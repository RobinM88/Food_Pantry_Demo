import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ConnectedFamiliesManager from '../ConnectedFamiliesManager';
import { Client } from '../../../types';

// Mock useMediaQuery
jest.mock('@mui/material/useMediaQuery');
const mockUseMediaQuery = useMediaQuery as jest.Mock;

// Mock theme
const theme = createTheme();

// Mock data
const mockMainClient: Client = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  family_number: 'F001',
  phone1: '(555) 123-4567',
  member_status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockConnectedClients: Client[] = [
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    family_number: 'F002',
    phone1: '(555) 234-5678',
    member_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    first_name: 'Bob',
    last_name: 'Johnson',
    family_number: 'F003',
    phone1: '(555) 345-6789',
    member_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockSearchResults: Client[] = [
  {
    id: '4',
    first_name: 'Alice',
    last_name: 'Brown',
    family_number: 'F004',
    phone1: '(555) 456-7890',
    member_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock API functions
const mockLoadConnections = jest.fn();
const mockAddConnection = jest.fn();
const mockRemoveConnection = jest.fn();
const mockSearchClients = jest.fn();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ConnectedFamiliesManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadConnections.mockResolvedValue(mockConnectedClients);
    mockSearchClients.mockResolvedValue(mockSearchResults);
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop view
    });

    it('renders connected families list', async () => {
      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      await waitFor(() => {
        expect(mockLoadConnections).toHaveBeenCalledWith(mockMainClient.id);
      });

      expect(screen.getByText('Connected Families')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('handles search functionality', async () => {
      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search clients...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(mockSearchClients).toHaveBeenCalledWith('Alice');
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });
    });

    it('handles adding connection', async () => {
      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      // Search for a client
      const searchInput = screen.getByPlaceholderText('Search clients...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });

      // Click add button
      const addButton = screen.getByTestId('add-connection-4'); // Using client ID
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockAddConnection).toHaveBeenCalledWith(mockMainClient.id, '4');
      });
    });

    it('handles removing connection', async () => {
      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Click remove button
      const removeButton = screen.getByTestId('remove-connection-2'); // Using client ID
      fireEvent.click(removeButton);

      // Confirm removal
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRemoveConnection).toHaveBeenCalledWith(mockMainClient.id, '2');
      });
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile view
    });

    it('renders with mobile-friendly layout', async () => {
      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      await waitFor(() => {
        expect(mockLoadConnections).toHaveBeenCalled();
      });

      const container = screen.getByTestId('connected-families-container');
      expect(container).toHaveStyle({ padding: '16px' });
    });

    it('displays search results in mobile-friendly format', async () => {
      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search clients...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        const searchResults = screen.getByTestId('search-results-container');
        expect(searchResults).toHaveStyle({ maxHeight: '200px' });
      });
    });
  });

  describe('Common Functionality', () => {
    it('handles loading state', async () => {
      mockLoadConnections.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('handles error state', async () => {
      mockLoadConnections.mockRejectedValue(new Error('Failed to load connections'));

      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error loading connections')).toBeInTheDocument();
      });
    });

    it('prevents connecting to self', async () => {
      renderWithTheme(
        <ConnectedFamiliesManager
          client={mockMainClient}
          onLoadConnections={mockLoadConnections}
          onAddConnection={mockAddConnection}
          onRemoveConnection={mockRemoveConnection}
          onSearchClients={mockSearchClients}
        />
      );

      // Search for the main client
      const searchInput = screen.getByPlaceholderText('Search clients...');
      fireEvent.change(searchInput, { target: { value: 'John Doe' } });

      await waitFor(() => {
        expect(screen.getByText('Cannot connect to self')).toBeInTheDocument();
      });
    });
  });
}); 