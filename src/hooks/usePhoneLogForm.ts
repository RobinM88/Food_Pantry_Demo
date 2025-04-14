import { useState, useCallback } from 'react';
import { isValidUSPhoneNumber, formatPhoneNumber } from '../utils/phoneNumberUtils';
import { Client } from '../types';
import { CallType, CallOutcome } from '../types/phoneLog';

interface FormState {
  phoneNumber: string;
  callType: CallType;
  callOutcome: CallOutcome;
  notes: string;
  selectedClient: Client | null;
}

const initialState: FormState = {
  phoneNumber: '',
  callType: 'incoming',
  callOutcome: 'successful',
  notes: '',
  selectedClient: null
};

interface UsePhoneLogFormProps {
  onComplete?: () => void;
  onCreateNewClient?: (phoneNumber: string) => void;
}

export const usePhoneLogForm = ({ onComplete, onCreateNewClient }: UsePhoneLogFormProps = {}) => {
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhoneNumberChange = useCallback((value: string) => {
    const formattedNumber = formatPhoneNumber(value);
    setState(prev => ({
      ...prev,
      phoneNumber: formattedNumber,
      selectedClient: null // Clear selected client when phone number changes
    }));

    // Validate phone number
    if (formattedNumber && !isValidUSPhoneNumber(formattedNumber)) {
      setErrors(prev => ({
        ...prev,
        phoneNumber: 'Please enter a valid US phone number: (XXX) XXX-XXXX'
      }));
    } else {
      setErrors(prev => {
        const { phoneNumber, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const handleCallTypeChange = useCallback((value: CallType) => {
    setState(prev => ({
      ...prev,
      callType: value
    }));
  }, []);

  const handleCallOutcomeChange = useCallback((value: CallOutcome) => {
    setState(prev => ({
      ...prev,
      callOutcome: value
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
      selectedClient: client
    }));
    
    // Clear any client-related errors
    setErrors(prev => {
      const { client: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleCreateNewClient = useCallback(() => {
    if (onCreateNewClient && state.phoneNumber) {
      onCreateNewClient(state.phoneNumber);
    }
  }, [state.phoneNumber, onCreateNewClient]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!state.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!isValidUSPhoneNumber(state.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid US phone number: (XXX) XXX-XXXX';
    }

    if (!state.selectedClient) {
      newErrors.client = 'Please select a client or create a new one';
    }

    if (state.selectedClient) {
      if (!state.callType) {
        newErrors.callType = 'Call type is required';
      }
      if (!state.callOutcome) {
        newErrors.callOutcome = 'Call outcome is required';
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