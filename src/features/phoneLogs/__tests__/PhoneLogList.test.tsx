import { render, screen, fireEvent, within } from '@testing-library/react';
import PhoneLogList from '../PhoneLogList';
import { PhoneLog, Client, MemberStatus } from '../../../types';

// Mock the PhoneLogDetails component
jest.mock('../PhoneLogDetails', () => {
  return function MockPhoneLogDetails({ phoneLog }: { phoneLog: any }) {
    return (
      <div data-testid="mock-phone-log-details">
        <h3>Phone Log Details</h3>
        <p>Phone Number: {phoneLog.phoneNumber}</p>
        <p>Call Type: {phoneLog.callType}</p>
        <p>Call Outcome: {phoneLog.callOutcome}</p>
      </div>
    );
  };
});

const mockPhoneLogs: PhoneLog[] = [
  {
    id: '1',
    familySearchId: '1',
    phoneNumber: '555-123-4567',
    callType: 'incoming',
    callOutcome: 'completed',
    notes: 'Test note 1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    familySearchId: '2',
    phoneNumber: '555-987-6543',
    callType: 'outgoing',
    callOutcome: 'no_answer',
    notes: 'Test note 2',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockClients: Client[] = [
  {
    familyNumber: 'f1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    address: '123 Main St',
    aptNumber: '',
    zipCode: '12345',
    phone1: '(555) 123-4567',
    phone2: '',
    isUnhoused: false,
    isTemporary: false,
    adults: 1,
    schoolAged: 0,
    smallChildren: 0,
    temporaryMembers: {
      adults: 0,
      schoolAged: 0,
      smallChildren: 0
    },
    familySize: 1,
    foodNotes: 'Prefers gluten-free items',
    officeNotes: '',
    totalVisits: 5,
    totalThisMonth: 1,
    connectedFamilies: [],
    memberStatus: MemberStatus.Active,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    lastVisit: new Date('2023-03-10')
  },
  {
    familyNumber: 'f2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave',
    aptNumber: '',
    zipCode: '67890',
    phone1: '(555) 987-6543',
    phone2: '',
    isUnhoused: false,
    isTemporary: false,
    adults: 2,
    schoolAged: 0,
    smallChildren: 0,
    temporaryMembers: {
      adults: 0,
      schoolAged: 0,
      smallChildren: 0
    },
    familySize: 2,
    foodNotes: 'Allergic to peanuts',
    officeNotes: '',
    totalVisits: 3,
    totalThisMonth: 0,
    connectedFamilies: [],
    memberStatus: MemberStatus.Active,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
    lastVisit: new Date('2023-02-15')
  },
  {
    familyNumber: 'f3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    address: '789 Pine Rd',
    aptNumber: '',
    zipCode: '54321',
    phone1: '(555) 555-5555',
    phone2: '',
    isUnhoused: true,
    isTemporary: true,
    adults: 2,
    schoolAged: 2,
    smallChildren: 0,
    temporaryMembers: {
      adults: 1,
      schoolAged: 1,
      smallChildren: 0
    },
    familySize: 5,
    foodNotes: 'Prefers gluten-free options',
    officeNotes: '',
    totalVisits: 2,
    totalThisMonth: 1,
    connectedFamilies: [],
    memberStatus: MemberStatus.Inactive,
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-03-01'),
    lastVisit: new Date('2023-03-15')
  }
];

describe('PhoneLogList', () => {
  const mockOnViewLog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the phone log list', () => {
    render(<PhoneLogList phoneLogs={mockPhoneLogs} clients={mockClients} onViewLog={mockOnViewLog} />);
    
    // Check if all phone logs are displayed
    const rows = screen.getAllByRole('row');
    mockPhoneLogs.forEach((phoneLog, index) => {
      const row = rows[index + 1]; // +1 to skip header row
      expect(within(row).getByText(phoneLog.phoneNumber)).toBeInTheDocument();
    });
  });

  it('displays client information when available', () => {
    render(<PhoneLogList phoneLogs={mockPhoneLogs} clients={mockClients} onViewLog={mockOnViewLog} />);
    
    const rows = screen.getAllByRole('row');
    mockPhoneLogs.forEach((phoneLog, index) => {
      const row = rows[index + 1]; // +1 to skip header row
      const client = mockClients.find(c => c.familyNumber === phoneLog.familySearchId);
      if (client) {
        expect(within(row).getByText(`${client.firstName} ${client.lastName}`)).toBeInTheDocument();
      }
    });
  });

  it('displays "No client information" when client is not found', () => {
    const phoneLogsWithoutClient = [
      {
        ...mockPhoneLogs[0],
        familySearchId: 'non-existent'
      }
    ];
    
    render(<PhoneLogList phoneLogs={phoneLogsWithoutClient} clients={mockClients} onViewLog={mockOnViewLog} />);
    
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('No client information')).toBeInTheDocument();
  });

  it('filters phone logs by search query', () => {
    render(<PhoneLogList phoneLogs={mockPhoneLogs} clients={mockClients} onViewLog={mockOnViewLog} />);
    
    const searchInput = screen.getByPlaceholderText('Search phone logs...');
    fireEvent.change(searchInput, { target: { value: mockPhoneLogs[0].phoneNumber } });
    
    // Check if only matching phone logs are displayed
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2); // Header row + 1 matching row
    expect(within(rows[1]).getByText(mockPhoneLogs[0].phoneNumber)).toBeInTheDocument();
  });

  it('filters phone logs by call type', () => {
    render(<PhoneLogList phoneLogs={mockPhoneLogs} clients={mockClients} onViewLog={mockOnViewLog} />);
    
    const callTypeSelect = screen.getByLabelText('Filter by Call Type');
    fireEvent.mouseDown(callTypeSelect);
    
    // Get the listbox that appears when the select is clicked
    const listbox = screen.getByRole('listbox');
    const incomingOption = within(listbox).getByText('Incoming');
    fireEvent.click(incomingOption);
    
    // Check if only incoming calls are displayed
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2); // Header row + 1 matching row
    expect(within(rows[1]).getByText(mockPhoneLogs[0].phoneNumber)).toBeInTheDocument();
  });

  it('filters phone logs by call outcome', () => {
    render(<PhoneLogList phoneLogs={mockPhoneLogs} clients={mockClients} onViewLog={mockOnViewLog} />);
    
    const callOutcomeSelect = screen.getByLabelText('Filter by Call Outcome');
    fireEvent.mouseDown(callOutcomeSelect);
    
    // Get the listbox that appears when the select is clicked
    const listbox = screen.getByRole('listbox');
    const completedOption = within(listbox).getByText('Completed');
    fireEvent.click(completedOption);
    
    // Check if only completed calls are displayed
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2); // Header row + 1 matching row
    expect(within(rows[1]).getByText(mockPhoneLogs[0].phoneNumber)).toBeInTheDocument();
  });

  it('calls onViewLog when a phone log is clicked', () => {
    render(<PhoneLogList phoneLogs={mockPhoneLogs} clients={mockClients} onViewLog={mockOnViewLog} />);
    
    // Click on the first phone log's view button
    const rows = screen.getAllByRole('row');
    const viewButton = within(rows[1]).getByRole('button', { name: /view details/i });
    fireEvent.click(viewButton);
    
    // Check if onViewLog was called with the correct phone log
    expect(mockOnViewLog).toHaveBeenCalledWith(mockPhoneLogs[0]);
  });
}); 