import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientService } from '../services/client.service';
import type { Client } from '@prisma/client';

export function useClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => ClientService.getAll(),
  });

  const createClient = useMutation({
    mutationFn: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => 
      ClientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateClient = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      ClientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteClient = useMutation({
    mutationFn: (id: string) => ClientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const getClientByPhone = async (phone: string) => {
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