import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientService } from '../services/client.service';
import type { Client, NewClient, UpdateClient } from '../types';

// Validate required fields for a new client
function validateNewClient(client: NewClient): string | null {
  const requiredFields: (keyof NewClient)[] = [
    'first_name',
    'last_name',
    'phone1',
    'zip_code',
    'is_unhoused',
    'is_temporary',
    'adults',
    'school_aged',
    'small_children',
    'member_status',
    'total_visits',
    'total_this_month'
  ];

  const missingFields = requiredFields.filter(field => {
    const value = client[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }

  return null;
}

export function useClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => ClientService.getAll(),
  });

  const createClient = useMutation({
    mutationFn: async (data: NewClient) => {
      const validationError = validateNewClient(data);
      if (validationError) {
        throw new Error(validationError);
      }
      return ClientService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClient }) => {
      if (!id) {
        throw new Error('Client ID is required for updates');
      }
      return ClientService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error('Client ID is required for deletion');
      }
      return ClientService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const getClientByPhone = async (phone: string): Promise<Client[]> => {
    if (!phone) {
      throw new Error('Phone number is required');
    }
    return ClientService.getByPhone(phone);
  };

  return {
    clients: clients || [],
    isLoading,
    error,
    createClient: createClient.mutate,
    updateClient: updateClient.mutate,
    deleteClient: deleteClient.mutate,
    getClientByPhone,
  };
} 