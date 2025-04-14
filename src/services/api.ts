import { createClient } from '@supabase/supabase-js';
import type { Client, Order, PhoneLog, ConnectedFamily } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const api = {
  supabase,
  clients: {
    async getAll() {
      const { data, error } = await supabase
        .from('Client')
        .select('*')
        .order('created_at', { ascending: false });
      
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
      const { error } = await supabase
        .from('Client')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
    async getAll() {
      console.log('Fetching all orders...');
      const { data, error } = await supabase
        .from('Order')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      
      console.log('Fetched orders:', data);
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          client:Client(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
      try {
        // Format data for Supabase - match schema exactly
        const now = new Date().toISOString();
        const orderData = {
          id: uuidv4(),
          family_search_id: order.family_search_id,
          status: 'pending',  // Always set initial status to pending
          pickup_date: order.pickup_date ? new Date(order.pickup_date).toISOString() : null,
          notes: order.notes || null,
          delivery_type: order.delivery_type || 'pickup',
          is_new_client: order.is_new_client || false,
          approval_status: 'pending',  // Always set initial approval status to pending
          number_of_boxes: order.number_of_boxes || 1,
          additional_people: {
            adults: order.additional_people?.adults || 0,
            small_children: order.additional_people?.small_children || 0,
            school_aged: order.additional_people?.school_aged || 0
          },
          visit_contact: order.visit_contact || null,
          created_at: now,
          updated_at: now
        };

        console.log('Creating order with data:', orderData);

        const { data, error } = await supabase
          .from('Order')
          .insert([orderData])
          .select()
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

        console.log('Created order:', data);
        return data;
      } catch (error) {
        console.error('Detailed error:', error);
        throw error;
      }
    },

    async update(id: string, updates: Partial<Order>) {
      // Format the update data
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        // If there's a pickup_date, ensure it's in ISO format
        ...(updates.pickup_date && {
          pickup_date: new Date(updates.pickup_date).toISOString()
        })
      };

      console.log('Updating order with data:', updateData);

      const { data, error } = await supabase
        .from('Order')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('Order')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    async getByClientId(clientId: string) {
      const { data, error } = await supabase
        .from('Order')
        .select('*')
        .eq('family_search_id', clientId)
        .order('created_at', { ascending: false });
      
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

    async create(phoneLog: Omit<PhoneLog, 'id' | 'createdAt' | 'updatedAt'>) {
      // Format data for Supabase - match schema exactly
      const now = new Date().toISOString();
      const phoneLogData = {
        id: uuidv4(), // Generate ID for the phone log
        family_search_id: phoneLog.familySearchId,
        phone_number: phoneLog.phoneNumber,
        call_type: phoneLog.callType,
        call_outcome: phoneLog.callOutcome,
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
            family_search_id,
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
      if (updates.familySearchId) dbUpdates.family_search_id = updates.familySearchId;
      if (updates.phoneNumber) dbUpdates.phone_number = updates.phoneNumber;
      if (updates.callType) dbUpdates.call_type = updates.callType;
      if (updates.callOutcome) dbUpdates.call_outcome = updates.callOutcome;
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
        .eq('family_search_id', clientId)
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
          client_id,
          connected_to,
          client:Client(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(connectedFamily: Omit<ConnectedFamily, 'id'>) {
      // Format data for Supabase - match schema exactly
      const connectedFamilyData = {
        client_id: connectedFamily.client_id,
        connected_to: connectedFamily.connected_to
      };

      console.log('Creating connected family with formatted data:', connectedFamilyData); // Debug log

      try {
        const { data, error } = await supabase
          .from('ConnectedFamily')
          .insert([connectedFamilyData])
          .select(`
            id,
            client_id,
            connected_to
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

    async getByClientId(clientId: string) {
      const { data, error } = await supabase
        .from('ConnectedFamily')
        .select(`
          id,
          client_id,
          connected_to,
          connected_client:Client!connected_to(*)
        `)
        .eq('client_id', clientId);
      
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

    async deleteConnection(clientId: string, connectedTo: string) {
      const { error } = await supabase
        .from('ConnectedFamily')
        .delete()
        .match({ client_id: clientId, connected_to: connectedTo });
      
      if (error) throw error;
    }
  }
}; 