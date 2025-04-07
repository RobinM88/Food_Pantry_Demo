import { render, screen, fireEvent, within } from '@testing-library/react';
import PhoneLogs from '../PhoneLogs';

// Mock the child components
jest.mock('../../features/phoneLogs/PhoneLogForm', () => ({
  __esModule: true,
  default: ({ onSave }: { onSave: () => void }) => (
    <div data-testid="mock-phone-log-form">
      <button onClick={onSave}>Save Phone Log</button>
    </div>
  ),
}));

jest.mock('../../features/phoneLogs/PhoneLogList', () => ({
  __esModule: true,
  default: ({ onViewLog }: { onViewLog: () => void }) => (
    <div data-testid="mock-phone-log-list">
      <button onClick={onViewLog}>View Phone Log</button>
    </div>
  ),
}));

jest.mock('../../features/phoneLogs/PhoneLogDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-phone-log-details">Phone Log Details</div>,
}));

describe('PhoneLogs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders the phone logs page', () => {
    render(<PhoneLogs />);

    // Check if the page renders
    expect(screen.getByText('Add Phone Log')).toBeInTheDocument();
    expect(screen.getByTestId('mock-phone-log-list')).toBeInTheDocument();
  });

  test('opens the phone log form when clicking Add Phone Log', () => {
    render(<PhoneLogs />);

    // Click the Add Phone Log button
    fireEvent.click(screen.getByText('Add Phone Log'));

    // Check if the form is opened
    expect(screen.getByTestId('mock-phone-log-form')).toBeInTheDocument();
  });

  it('adds a new phone log and shows notification', async () => {
    render(<PhoneLogs />);

    // Click the add button
    fireEvent.click(screen.getByText('Add Phone Log'));

    // Fill out the form (mock form submission)
    const mockForm = screen.getByTestId('mock-phone-log-form');
    const saveButton = within(mockForm).getByText('Save Phone Log');
    fireEvent.click(saveButton);

    // Check if the success notification is displayed
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('Phone log added successfully')).toBeInTheDocument();

    // Wait for the notification to auto-hide
    jest.advanceTimersByTime(6000);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('views a phone log when clicked', () => {
    render(<PhoneLogs />);

    // Click the view button in the list
    const phoneLogList = screen.getByTestId('mock-phone-log-list');
    const viewButton = within(phoneLogList).getByText('View Phone Log');
    fireEvent.click(viewButton);

    // Check if the phone log details dialog is opened
    const dialog = screen.getByTestId('mock-phone-log-details');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Phone Log Details')).toBeInTheDocument();
  });

  it('closes the phone log details dialog when clicking close', () => {
    render(<PhoneLogs />);

    // Open the dialog
    const phoneLogList = screen.getByTestId('mock-phone-log-list');
    const viewButton = within(phoneLogList).getByText('View Phone Log');
    fireEvent.click(viewButton);

    // Click the close button
    const dialog = screen.getByTestId('mock-phone-log-details');
    const closeButton = within(dialog).getByTitle('Close');
    fireEvent.click(closeButton);

    // Check if the dialog is closed
    expect(screen.queryByTestId('mock-phone-log-details')).not.toBeInTheDocument();
  });

  it('closes the success notification after a delay', () => {
    render(<PhoneLogs />);

    // Click the add button
    fireEvent.click(screen.getByText('Add Phone Log'));

    // Fill out the form (mock form submission)
    const mockForm = screen.getByTestId('mock-phone-log-form');
    const saveButton = within(mockForm).getByText('Save Phone Log');
    fireEvent.click(saveButton);

    // Check if the success notification is displayed
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('Phone log added successfully')).toBeInTheDocument();

    // Advance the timer by 6 seconds
    jest.advanceTimersByTime(6000);

    // Check if the notification is hidden
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
}); 