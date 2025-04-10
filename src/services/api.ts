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
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
      const { connectedFamilies, ...clientData } = client;
      
      const { data, error } = await supabase
        .from('Client')
        .insert([clientData])
        .select('id, familyNumber, firstName, lastName, email, address, aptNumber, zipCode, phone1, phone2, isUnhoused, isTemporary, adults, schoolAged, smallChildren, temporaryMembers, familySize, foodNotes, officeNotes, totalVisits, totalThisMonth, memberStatus, createdAt, updatedAt, lastVisit')
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Client>) {
      const { connectedFamilies, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('Client')
        .update(updateData)
        .eq('id', id)
        .select('id, familyNumber, firstName, lastName, email, address, aptNumber, zipCode, phone1, phone2, isUnhoused, isTemporary, adults, schoolAged, smallChildren, temporaryMembers, familySize, foodNotes, officeNotes, totalVisits, totalThisMonth, memberStatus, createdAt, updatedAt, lastVisit')
        .single();
      
      if (error) throw error;
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
        .order('createdAt', { ascending: false });
      
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

    async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
      // Format data for Supabase - match schema exactly
      const now = new Date().toISOString();
      const orderData = {
        id: uuidv4(), // Generate ID for the order
        familySearchId: order.familySearchId,
        status: order.status,
        pickupDate: order.pickupDate?.toISOString() || null,
        notes: order.notes || null,
        deliveryType: order.deliveryType,
        isNewClient: order.isNewClient || false,
        approvalStatus: order.approvalStatus,
        numberOfBoxes: order.numberOfBoxes || 1,
        additionalPeople: order.additionalPeople ? {
          adults: order.additionalPeople.adults || 0,
          smallChildren: order.additionalPeople.smallChildren || 0,
          schoolAged: order.additionalPeople.schoolAged || 0
        } : {
          adults: 0,
          smallChildren: 0,
          schoolAged: 0
        },
        seasonalItems: order.seasonalItems || [],
        visitContact: order.visitContact || null,
        createdAt: now,
        updatedAt: now
      };

      console.log('Creating order with formatted data:', orderData); // Debug log

      try {
        const { data, error } = await supabase
          .from('Order')
          .insert([orderData])
          .select(`
            id,
            familySearchId,
            status,
            pickupDate,
            notes,
            deliveryType,
            isNewClient,
            approvalStatus,
            numberOfBoxes,
            additionalPeople,
            seasonalItems,
            visitContact,
            createdAt,
            updatedAt
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

    async update(id: string, updates: Partial<Order>) {
      // Format the update data
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        // If there's a pickupDate, ensure it's in ISO format
        ...(updates.pickupDate && {
          pickupDate: new Date(updates.pickupDate).toISOString()
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
        .eq('familySearchId', clientId)
        .order('createdAt', { ascending: false });
      
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
        .order('createdAt', { ascending: false });
      
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
        familySearchId: phoneLog.familySearchId,
        phoneNumber: phoneLog.phoneNumber,
        callType: phoneLog.callType,
        callOutcome: phoneLog.callOutcome,
        notes: phoneLog.notes || null,
        createdAt: now,
        updatedAt: now
      };

      console.log('Creating phone log with formatted data:', phoneLogData); // Debug log

      try {
        const { data, error } = await supabase
          .from('PhoneLog')
          .insert([phoneLogData])
          .select(`
            id,
            familySearchId,
            phoneNumber,
            callType,
            callOutcome,
            notes,
            createdAt,
            updatedAt
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
      const { data, error } = await supabase
        .from('PhoneLog')
        .update(updates)
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
        .eq('familySearchId', clientId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByPhoneNumber(phoneNumber: string) {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select('*')
        .eq('phoneNumber', phoneNumber)
        .order('createdAt', { ascending: false });
      
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
          clientId,
          connectedTo,
          client:Client(*)
        `)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(connectedFamily: Omit<ConnectedFamily, 'id'>) {
      // Format data for Supabase - match schema exactly
      const connectedFamilyData = {
        clientId: connectedFamily.clientId,
        connectedTo: connectedFamily.connectedTo
      };

      console.log('Creating connected family with formatted data:', connectedFamilyData); // Debug log

      try {
        const { data, error } = await supabase
          .from('ConnectedFamily')
          .insert([connectedFamilyData])
          .select(`
            id,
            clientId,
            connectedTo
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
          clientId,
          connectedTo,
          connectedClient:Client!connectedTo(*)
        `)
        .eq('clientId', clientId);
      
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
        .match({ clientId, connectedTo });
      
      if (error) throw error;
    }
  }
}; 