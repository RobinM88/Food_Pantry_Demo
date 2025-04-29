import { useState, useCallback } from 'react';
import { isValidUSPhoneNumber, formatPhoneNumber } from '../utils/phoneNumberUtils';
import { Client } from '../types';
import { CallType, CallOutcome, PhoneLogFormState } from '../types/phoneLog';

const initialState: PhoneLogFormState = {
  phone_number: '',
  call_type: 'incoming',
  call_outcome: 'successful',
  notes: '',
  selected_client: null,
  matching_clients: [],
  show_new_client_form: false
};

interface UsePhoneLogFormProps {
  onComplete?: () => void;
  onCreateNewClient?: (phone_number: string) => void;
}

export const usePhoneLogForm = ({ onComplete, onCreateNewClient }: UsePhoneLogFormProps = {}) => {
  const [state, setState] = useState<PhoneLogFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhoneNumberChange = useCallback((value: string) => {
    const formattedNumber = formatPhoneNumber(value);
    setState(prev => ({
      ...prev,
      phone_number: formattedNumber,
      selected_client: null // Clear selected client when phone number changes
    }));

    // Validate phone number
    if (formattedNumber && !isValidUSPhoneNumber(formattedNumber)) {
      setErrors(prev => ({
        ...prev,
        phone_number: 'Please enter a valid US phone number: (XXX) XXX-XXXX'
      }));
    } else {
      setErrors(prev => {
        const { phone_number, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const handleCallTypeChange = useCallback((value: CallType) => {
    setState(prev => ({
      ...prev,
      call_type: value
    }));
  }, []);

  const handleCallOutcomeChange = useCallback((value: CallOutcome) => {
    setState(prev => ({
      ...prev,
      call_outcome: value
    }));
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      notes: value
    }));
  }, []);

  const handleClientSelect = useCallback((client: Client | null) => {
    setState(prev => ({
      ...prev,
      selected_client: client
    }));
    
    // Clear any client-related errors
    setErrors(prev => {
      const { client: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleCreateNewClient = useCallback(() => {
    if (onCreateNewClient && state.phone_number) {
      onCreateNewClient(state.phone_number);
    }
  }, [state.phone_number, onCreateNewClient]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!state.phone_number) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!isValidUSPhoneNumber(state.phone_number)) {
      newErrors.phone_number = 'Please enter a valid US phone number: (XXX) XXX-XXXX';
    }

    if (!state.selected_client) {
      newErrors.client = 'Please select a client or create a new one';
    }

    if (state.selected_client) {
      if (!state.call_type) {
        newErrors.call_type = 'Call type is required';
      }
      if (!state.call_outcome) {
        newErrors.call_outcome = 'Call outcome is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [state]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return false;
    }

    if (onComplete) {
      onComplete();
    }

    return true;
  }, [validate, onComplete]);

  const reset = useCallback(() => {
    setState(initialState);
    setErrors({});
  }, []);

  return {
    state,
    errors,
    handlePhoneNumberChange,
    handleCallTypeChange,
    handleCallOutcomeChange,
    handleNotesChange,
    handleClientSelect,
    handleCreateNewClient,
    handleSubmit,
    reset
  };
}; 