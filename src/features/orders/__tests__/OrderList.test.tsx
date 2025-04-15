import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import OrderList from '../OrderList';
import { Order, Client } from '../../../types';

// Mock useMediaQuery hook
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn()
}));

const mockUseMediaQuery = useMediaQuery as jest.Mock;

// Mock data
const mockClients: Client[] = [
  {
    id: 'F001',
    family_number: 'F001',
    first_name: 'John',
    last_name: 'Doe',
    phone1: '(555) 123-4567',
    member_status: 'active',
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
    id: 'F002',
    family_number: 'F002',
    first_name: 'Jane',
    last_name: 'Smith',
    phone1: '(555) 987-6543',
    member_status: 'active',
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

const mockOrders: Order[] = [
  {
    id: '1',
    family_search_id: 'F001',
    number_of_boxes: 2,
    pickup_date: new Date('2024-03-20').toISOString(),
    status: 'pending',
    created_at: new Date('2024-03-15').toISOString(),
    updated_at: new Date('2024-03-15').toISOString(),
    delivery_type: 'pickup',
    is_new_client: false,
    approval_status: 'pending',
    additional_people: {
      adults: 0,
      school_aged: 0,
      small_children: 0
    }
  },
  {
    id: '2',
    family_search_id: 'F002',
    number_of_boxes: 1,
    pickup_date: new Date('2024-03-21').toISOString(),
    status: 'completed',
    created_at: new Date('2024-03-16').toISOString(),
    updated_at: new Date('2024-03-16').toISOString(),
    delivery_type: 'delivery',
    is_new_client: true,
    approval_status: 'approved',
    additional_people: {
      adults: 1,
      school_aged: 2,
      small_children: 1
    }
  }
];

const mockHandleViewOrder = jest.fn();
const mockHandleEditOrder = jest.fn();
const mockHandleDeleteOrder = jest.fn();
const mockHandleStatusChange = jest.fn();

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('OrderList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Not mobile
    });

    it('renders table view with correct columns', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      expect(screen.getByText('Client')).toBeInTheDocument();
      expect(screen.getByText('Boxes')).toBeInTheDocument();
      expect(screen.getByText('Pickup Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays order data correctly in table', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('2 boxes')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('handles order actions correctly', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      const editButtons = screen.getAllByRole('button', { name: /edit/i });

      fireEvent.click(viewButtons[0]);
      expect(mockHandleViewOrder).toHaveBeenCalledWith(mockOrders[0]);

      fireEvent.click(editButtons[0]);
      expect(mockHandleEditOrder).toHaveBeenCalledWith(mockOrders[0]);
    });

    it('handles status change through menu', async () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      // Open menu for the pending order
      const moreButtons = screen.getAllByRole('button', { name: /more actions/i });
      fireEvent.click(moreButtons[0]);

      // Click approve option
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      expect(mockHandleStatusChange).toHaveBeenCalledWith(mockOrders[0], 'approved');
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Is mobile
    });

    it('renders card view for mobile', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      expect(screen.getByText('Orders')).toBeInTheDocument();
      const cards = screen.getAllByTestId('order-card');
      expect(cards).toHaveLength(mockOrders.length);
    });

    it('displays order data correctly in cards', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('2 boxes')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('handles actions in mobile view', () => {
      renderWithTheme(
        <OrderList
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      const viewButtons = screen.getAllByRole('button', { name: /view details/i });
      fireEvent.click(viewButtons[0]);
      expect(mockHandleViewOrder).toHaveBeenCalledWith(mockOrders[0]);

      const editButtons = screen.getAllByRole('button', { name: /edit order/i });
      fireEvent.click(editButtons[0]);
      expect(mockHandleEditOrder).toHaveBeenCalledWith(mockOrders[0]);
    });
  });

  describe('Common Functionality', () => {
    it('filters orders based on search query', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search orders/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters by order status', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      const statusFilter = screen.getByLabelText(/status/i);
      fireEvent.mouseDown(statusFilter);
      const pendingOption = screen.getByRole('option', { name: /pending/i });
      fireEvent.click(pendingOption);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters by delivery type', () => {
      renderWithTheme(
        <OrderList 
          orders={mockOrders}
          clients={mockClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      const typeFilter = screen.getByLabelText(/type/i);
      fireEvent.mouseDown(typeFilter);
      const deliveryOption = screen.getByRole('option', { name: /delivery/i });
      fireEvent.click(deliveryOption);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('handles pagination correctly', () => {
      const manyOrders = Array(15).fill(null).map((_, index) => ({
        ...mockOrders[0],
        id: `${index + 1}`,
        family_search_id: `F${String(index + 1).padStart(3, '0')}`
      }));

      const manyClients = Array(15).fill(null).map((_, index) => ({
        ...mockClients[0],
        id: `F${String(index + 1).padStart(3, '0')}`,
        family_number: `F${String(index + 1).padStart(3, '0')}`,
        first_name: `John${index + 1}`,
        last_name: `Doe${index + 1}`
      }));

      renderWithTheme(
        <OrderList 
          orders={manyOrders}
          clients={manyClients}
          onViewOrder={mockHandleViewOrder}
          onEditOrder={mockHandleEditOrder}
          onDeleteOrder={mockHandleDeleteOrder}
          onStatusChange={mockHandleStatusChange}
        />
      );

      const nextPageButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextPageButton);

      expect(screen.getByText('John11 Doe11')).toBeInTheDocument();
      expect(screen.queryByText('John1 Doe1')).not.toBeInTheDocument();
    });
  });
}); 