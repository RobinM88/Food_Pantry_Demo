import { render, screen, within } from '@testing-library/react';
import PhoneLogDetails from '../PhoneLogDetails';
import { PhoneLog, Client, MemberStatus } from '../../../types';
import { jest } from '@jest/globals';

jest.mock('@mui/icons-material/Call', () => ({
  __esModule: true,
  default: () => <div data-testid="CallTypeIcon">CallIcon</div>
}));

jest.mock('@mui/icons-material/CheckCircle', () => ({
  __esModule: true,
  default: () => <div data-testid="CallOutcomeIcon">CallIcon</div>
}));

jest.mock('@mui/icons-material/Phone', () => ({
  __esModule: true,
  default: () => <div data-testid="PhoneIcon">PhoneIcon</div>
}));

const mockPhoneLog: PhoneLog = {
  id: '1',
  familySearchId: '1',
  phoneNumber: '555-123-4567',
  callType: 'incoming',
  callOutcome: 'completed',
  notes: 'Test note',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockClient: Client = {
  familyNumber: '1',
  searchKey: 'johndoe1',
  firstName: 'John',
  lastName: 'Doe',
  phone1: '(555) 123-4567',
  phone2: '',
  address: '123 Main St',
  aptNumber: '',
  zipCode: '12345',
  adults: 1,
  schoolAged: 1,
  smallChildren: 1,
  familySize: 3,
  foodNotes: 'Prefers gluten-free items',
  officeNotes: '',
  totalVisits: 5,
  totalThisMonth: 1,
  connectedFamilies: [],
  memberStatus: MemberStatus.Active,
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2023-01-15'),
  lastVisit: new Date('2023-03-10')
};

const phoneLogWithoutNotes: PhoneLog = {
  ...mockPhoneLog,
  notes: ''
};

describe('PhoneLogDetails', () => {
  it('renders phone log details', () => {
    render(<PhoneLogDetails phoneLog={mockPhoneLog} client={mockClient} />);
    
    expect(screen.getByText('Phone Log Details')).toBeInTheDocument();
    expect(screen.getByText('Phone Number: 555-123-4567')).toBeInTheDocument();
    expect(screen.getByText('Call Type: incoming')).toBeInTheDocument();
    expect(screen.getByText('Call Outcome: completed')).toBeInTheDocument();
    expect(screen.getByText('Notes: Test note')).toBeInTheDocument();
  });

  it('renders client information when available', () => {
    render(<PhoneLogDetails phoneLog={mockPhoneLog} client={mockClient} />);
    
    expect(screen.getByText('Client Information')).toBeInTheDocument();
    expect(screen.getByText('Name: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Phone: (555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('Address: 123 Main St')).toBeInTheDocument();
  });

  it('renders "No client information" when client is not provided', () => {
    render(<PhoneLogDetails phoneLog={mockPhoneLog} client={null} />);
    
    expect(screen.getByText('No client information')).toBeInTheDocument();
  });

  it('renders phone log details with client information', () => {
    render(<PhoneLogDetails phoneLog={mockPhoneLog} client={mockClient} />);

    // Check if basic information is displayed
    expect(screen.getByText('Call Information')).toBeInTheDocument();
    expect(screen.getByText('Apr 6, 2025 5:44 PM')).toBeInTheDocument();

    // Check phone number in call information section
    const callInfoSection = screen.getByText('Call Information').closest('div');
    expect(within(callInfoSection!).getByText('555-123-4567')).toBeInTheDocument();

    expect(screen.getByText('Incoming')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();

    // Check client information
    const clientInfoSection = screen.getByText('Client Information').closest('div');
    expect(within(clientInfoSection!).getByText('John Doe')).toBeInTheDocument();
    expect(within(clientInfoSection!).getByText('(555) 123-4567')).toBeInTheDocument();
    expect(within(clientInfoSection!).getByText('active')).toBeInTheDocument();

    // Check notes
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Test note')).toBeInTheDocument();
  });

  it('displays no notes message when notes are empty', () => {
    render(<PhoneLogDetails phoneLog={phoneLogWithoutNotes} client={mockClient} />);
    expect(screen.getByText('No notes')).toBeInTheDocument();
  });

  it('displays call type icons', () => {
    render(<PhoneLogDetails phoneLog={mockPhoneLog} client={mockClient} />);
    expect(screen.getByTestId('CallTypeIcon')).toBeInTheDocument();
    expect(screen.getByTestId('CallTypeChipIcon')).toBeInTheDocument();
  });

  it('displays call outcome icons', () => {
    render(<PhoneLogDetails phoneLog={mockPhoneLog} client={mockClient} />);
    expect(screen.getByTestId('CallOutcomeIcon')).toBeInTheDocument();
    expect(screen.getByTestId('CallOutcomeChipIcon')).toBeInTheDocument();
  });

  it('displays no client information message when client is null', () => {
    render(<PhoneLogDetails phoneLog={mockPhoneLog} client={null} />);
    expect(screen.getByText('No client information available')).toBeInTheDocument();
  });
}); 