import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Simple Supabase client configuration
const supabase = createClient(supabaseUrl, supabaseKey);

// Add global error handling for common RLS issues
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table) => {
  const query = originalFrom(table);
  
  // Wrap query methods to handle RLS errors
  const wrapQueryMethod = (method) => {
    const original = query[method].bind(query);
    return async (...args) => {
      try {
        const result = await original(...args);
        return result;
      } catch (error) {
        // Handle specific RLS configuration error
        if (error.code === '42704' && error.message.includes('request.user_id')) {
          console.warn('RLS configuration issue detected:', error.message);
          console.warn('This suggests the database RLS policies need to be updated to work with the current authentication system.');
          
          // Re-throw with more context
          const enhancedError = new Error(`Database configuration issue: ${error.message}`);
          enhancedError.code = error.code;
          enhancedError.originalError = error;
          throw enhancedError;
        }
        throw error;
      }
    };
  };
  
  // Wrap common query methods
  if (query.select) query.select = wrapQueryMethod('select');
  if (query.insert) query.insert = wrapQueryMethod('insert');
  if (query.update) query.update = wrapQueryMethod('update');
  if (query.delete) query.delete = wrapQueryMethod('delete');
  
  return query;
};

export default supabase;
