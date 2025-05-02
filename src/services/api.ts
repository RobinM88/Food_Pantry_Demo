import { createClient } from '@supabase/supabase-js';
import type { Client, PhoneLog, ConnectedFamily } from '../types';
import type { Database } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { db } from '../lib/indexedDB';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Environment Check:', {
  url: supabaseUrl,
  keyLength: supabaseKey.length,
  keyPrefix: supabaseKey.substring(0, 10)
});

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Initialize Supabase connection
async function initializeSupabase() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }

    console.log('Supabase initialized:', {
      hasSession: !!session,
      authenticated: !!session?.access_token
    });

    if (session) {
      // Test database connection with auth token
      const { error } = await supabase
        .from('Client')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
      } else {
        console.log('Database connection test successful');
      }
    }
  } catch (error) {
    console.error('Supabase initialization error:', error);
  }
}

// Initialize on load
initializeSupabase();

export const api = {
  supabase,
  clients: {
    async getAll() {
      try {
        console.log('Fetching clients...');
        
        const { data, error } = await supabase
          .from('Client')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching clients:', {
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log(`Successfully fetched ${data?.length || 0} clients`);
        return data;
      } catch (error) {
        console.error('Unexpected error in getAll:', error);
        throw error;
      }
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('Client')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
      // Convert camelCase to snake_case for database
      const now = new Date().toISOString();
      const clientData = {
        id: uuidv4(), // Add generated UUID
        family_number: client.family_number,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        address: client.address,
        apt_number: client.apt_number,
        zip_code: client.zip_code,
        phone1: client.phone1,
        phone2: client.phone2,
        is_unhoused: client.is_unhoused,
        is_temporary: client.is_temporary,
        adults: client.adults,
        school_aged: client.school_aged,
        small_children: client.small_children,
        temporary_members: client.temporary_members,
        family_size: client.family_size,
        food_notes: client.food_notes,
        office_notes: client.office_notes,
        total_visits: client.total_visits,
        total_this_month: client.total_this_month,
        member_status: client.member_status,
        last_visit: client.last_visit,
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('Client')
        .insert([clientData])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return data;
    },

    async update(id: string, updates: Partial<Client>) {
      // Convert camelCase to snake_case for database
      const { connected_families, ...clientData } = updates;
      
      const { data, error } = await supabase
        .from('Client')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return data;
    },

    async delete(id: string) {
      try {
        // Log what we're trying to delete
        console.log('Attempting to delete client with ID:', id);
        
        // Make explicit call to supabase with error handling
        const { error } = await supabase
          .from('Client')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('Successfully deleted client from Supabase:', id);
        
        // Also delete from IndexedDB if offline mode is enabled
        if (config.features.offlineMode) {
          try {
            // Using the correct store name 'clients' from STORES.CLIENTS
            await db.delete('clients', id);
            console.log('Successfully deleted client from IndexedDB:', id);
          } catch (e) {
            console.error('Failed to delete from IndexedDB:', e);
          }
        }
      } catch (error) {
        console.error('Client deletion failed:', error);
        throw error;
      }
    },

    async getByPhone(phone: string) {
      const { data, error } = await supabase
        .from('Client')
        .select('*')
        .or(`phone1.eq.${phone},phone2.eq.${phone}`);
      
      if (error) throw error;
      return data;
    }
  },

  orders: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          Client:family_number (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    getByFamilyNumber: async (familyNumber: string) => {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          Client:family_number (
            first_name,
            last_name
          )
        `)
        .eq('family_number', familyNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    create: async (data: Database['public']['Tables']['Order']['Insert']) => {
      const { data: newOrder, error } = await supabase
        .from('Order')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return newOrder;
    },
    update: async (id: string, updates: Database['public']['Tables']['Order']['Update']) => {
      const { data: updatedOrder, error } = await supabase
        .from('Order')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedOrder;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('Order')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          Client:family_number (
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  phoneLogs: {
    async getAll() {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select(`
          *,
          client:Client(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select(`
          *,
          client:Client(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(phoneLog: Omit<PhoneLog, 'id' | 'created_at' | 'updated_at'>) {
      // Format data for Supabase - match schema exactly
      const now = new Date().toISOString();
      const phoneLogData = {
        id: uuidv4(), // Generate ID for the phone log
        family_number: phoneLog.family_number,
        phone_number: phoneLog.phone_number,
        call_type: phoneLog.call_type,
        call_outcome: phoneLog.call_outcome,
        notes: phoneLog.notes || undefined,
        created_at: now,
        updated_at: now
      };

      console.log('Creating phone log with formatted data:', phoneLogData); // Debug log

      try {
        const { data, error } = await supabase
          .from('PhoneLog')
          .insert([phoneLogData])
          .select(`
            id,
            family_number,
            phone_number,
            call_type,
            call_outcome,
            notes,
            created_at,
            updated_at
          `)
          .single();
        
        if (error) {
          console.error('Supabase error details:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        return data;
      } catch (error) {
        console.error('Detailed error:', error);
        throw error;
      }
    },

    async update(id: string, updates: Partial<PhoneLog>) {
      // Convert camelCase to snake_case
      const dbUpdates: any = {};
      if (updates.family_number) dbUpdates.family_number = updates.family_number;
      if (updates.phone_number) dbUpdates.phone_number = updates.phone_number;
      if (updates.call_type) dbUpdates.call_type = updates.call_type;
      if (updates.call_outcome) dbUpdates.call_outcome = updates.call_outcome;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || undefined;

      const { data, error } = await supabase
        .from('PhoneLog')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('PhoneLog')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    async getByClientId(clientId: string) {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select('*')
        .eq('family_number', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByPhoneNumber(phoneNumber: string) {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  connectedFamilies: {
    async getAll() {
      const { data, error } = await supabase
        .from('ConnectedFamily')
        .select(`
          id,
          family_number,
          connected_family_number,
          relationship_type,
          client:Client(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByClientId(clientId: string) {
      const { data, error } = await supabase
        .from('ConnectedFamily')
        .select(`
          id,
          family_number,
          connected_family_number,
          relationship_type,
          client:Client(*)
        `)
        .eq('family_number', clientId);
      
      if (error) throw error;
      return data;
    },

    async create(connectedFamily: Omit<ConnectedFamily, 'id'>) {
      const { data, error } = await supabase
        .from('ConnectedFamily')
        .insert([{
          family_number: connectedFamily.family_number,
          connected_family_number: connectedFamily.connected_family_number,
          relationship_type: connectedFamily.relationship_type
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('ConnectedFamily')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    async deleteByClientId(clientId: string) {
      const { error } = await supabase
        .from('ConnectedFamily')
        .delete()
        .eq('family_number', clientId);
      
      if (error) throw error;
    },

    async getConnection(clientId: string, connectedTo: string) {
      const { data, error } = await supabase
        .from('ConnectedFamily')
        .select('*')
        .match({ family_number: clientId, connected_family_number: connectedTo })
        .single();
      
      if (error) throw error;
      return data;
    }
  }
}; 