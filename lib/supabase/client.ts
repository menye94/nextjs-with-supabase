import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
    
    if (!supabaseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL is not set, using placeholder');
    }
    
    if (!supabaseAnonKey) {
      console.warn('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY is not set, using placeholder');
    }

    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return a client with placeholder values to prevent build failures
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
    );
  }
}
