import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneLogForm from '../PhoneLogForm';
import { Client, PhoneLog, MemberStatus } from '../../../types';

const mockClients: Client[] = [
  {
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
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('PhoneLogForm', () => {
  const mockOnSavePhoneLog = jest.fn();
  const mockOnSaveClient = jest.fn();
  const mockOnSaveOrder = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Call Information', () => {
    it('should start with the Call Information step', () => {
      render(
        <PhoneLogForm
          clients={mockClients}
          onSavePhoneLog={mockOnSavePhoneLog}
          onSaveClient={mockOnSaveClient}
          onSaveOrder={mockOnSaveOrder}
        />
      );

      expect(screen.getByText('Call Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/call type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/call outcome/i)).toBeInTheDocument();
    });

    it('should format phone numbers correctly', async () => {
      const user = userEvent.setup();
      render(
        <PhoneLogForm
          clients={mockClients}
          onSavePhoneLog={mockOnSavePhoneLog}
          onSaveClient={mockOnSaveClient}
          onSaveOrder={mockOnSaveOrder}
        />
      );

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '5551234567');
      expect(phoneInput).toHaveValue('(555) 123-4567');
    });

    it('should require valid phone number to proceed', async () => {
      const user = userEvent.setup();
      render(
        <PhoneLogForm
          clients={mockClients}
          onSavePhoneLog={mockOnSavePhoneLog}
          onSaveClient={mockOnSaveClient}
          onSaveOrder={mockOnSaveOrder}
        />
      );

      // Try to continue with invalid phone number
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '123');
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // Should show validation error
      expect(screen.getByText(/enter.*valid.*phone number/i)).toBeInTheDocument();
      
      // Should not proceed to next step
      expect(screen.getByText('Call Information')).toBeInTheDocument();
    });

    it('should allow proceeding with valid call information', async () => {
      const user = userEvent.setup();
      render(
        <PhoneLogForm
          clients={mockClients}
          onSavePhoneLog={mockOnSavePhoneLog}
          onSaveClient={mockOnSaveClient}
          onSaveOrder={mockOnSaveOrder}
        />
      );

      // Fill in required fields
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '5551234567');

      const callTypeSelect = screen.getByLabelText(/call type/i);
      await user.click(callTypeSelect);
      const incomingOption = screen.getByRole('option', { name: /incoming/i });
      await user.click(incomingOption);

      const outcomeSelect = screen.getByLabelText(/call outcome/i);
      await user.click(outcomeSelect);
      const completedOption = screen.getByRole('option', { name: /completed/i });
      await user.click(completedOption);

      // Click continue
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // Should proceed to next step
      expect(screen.getByText('Client Information')).toBeInTheDocument();
    });
  });

  describe('Step 2: Client Information', () => {
    const setupClientStep = async () => {
      const user = userEvent.setup();
      render(
        <PhoneLogForm
          clients={mockClients}
          onSavePhoneLog={mockOnSavePhoneLog}
          onSaveClient={mockOnSaveClient}
          onSaveOrder={mockOnSaveOrder}
        />
      );

      // Fill step 1 and continue
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '5551234567');

      const callTypeSelect = screen.getByLabelText(/call type/i);
      await user.click(callTypeSelect);
      await user.click(screen.getByRole('option', { name: /incoming/i }));

      const outcomeSelect = screen.getByLabelText(/call outcome/i);
      await user.click(outcomeSelect);
      await user.click(screen.getByRole('option', { name: /completed/i }));

      await user.click(screen.getByRole('button', { name: /continue/i }));

      return { user };
    };

    it('should show matching client when phone number matches', async () => {
      const { user } = await setupClientStep();

      // Client search should show matching client
      const clientSearch = screen.getByLabelText(/search clients/i);
      expect(clientSearch).toBeInTheDocument();

      // Should show John Doe in the results
      const clientOption = screen.getByText(/john doe/i);
      expect(clientOption).toBeInTheDocument();
    });

    it('should allow adding new client when no match found', async () => {
      const { user } = await setupClientStep();

      // Click New Client button
      const newClientButton = screen.getByRole('button', { name: /new client/i });
      await user.click(newClientButton);

      // Should open client dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should allow proceeding after selecting client', async () => {
      const { user } = await setupClientStep();

      // Select the client
      const clientSearch = screen.getByLabelText(/search clients/i);
      await user.click(clientSearch);
      await user.click(screen.getByText(/john doe/i));

      // Continue to next step
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Should show review step
      expect(screen.getByText('Review & Save')).toBeInTheDocument();
    });
  });

  describe('Step 3: Review & Save', () => {
    const setupReviewStep = async () => {
      const user = userEvent.setup();
      render(
        <PhoneLogForm
          clients={mockClients}
          onSavePhoneLog={mockOnSavePhoneLog}
          onSaveClient={mockOnSaveClient}
          onSaveOrder={mockOnSaveOrder}
        />
      );

      // Fill step 1
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '5551234567');

      const callTypeSelect = screen.getByLabelText(/call type/i);
      await user.click(callTypeSelect);
      await user.click(screen.getByRole('option', { name: /incoming/i }));

      const outcomeSelect = screen.getByLabelText(/call outcome/i);
      await user.click(outcomeSelect);
      await user.click(screen.getByRole('option', { name: /completed/i }));

      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Fill step 2
      const clientSearch = screen.getByLabelText(/search clients/i);
      await user.click(clientSearch);
      await user.click(screen.getByText(/john doe/i));

      await user.click(screen.getByRole('button', { name: /continue/i }));

      return { user };
    };

    it('should display summary of entered information', async () => {
      await setupReviewStep();

      // Check call summary
      expect(screen.getByText(/call summary/i)).toBeInTheDocument();
      expect(screen.getByText(/incoming/i)).toBeInTheDocument();
      expect(screen.getByText(/\(555\) 123-4567/)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();

      // Check client information
      expect(screen.getByText(/client information/i)).toBeInTheDocument();
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    it('should save phone log when save button is clicked', async () => {
      const { user } = await setupReviewStep();

      // Click save
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Check if onSavePhoneLog was called with correct data
      expect(mockOnSavePhoneLog).toHaveBeenCalledWith(
        expect.objectContaining({
          callType: 'incoming',
          phoneNumber: '(555) 123-4567',
          callOutcome: 'completed',
          clientId: '1'
        })
      );
    });
  });
}); 