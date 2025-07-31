import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY is not set');
    }

    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
