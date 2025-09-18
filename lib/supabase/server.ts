import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  try {
    const cookieStore = await cookies();

    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
    
    if (!supabaseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL is not set, using placeholder');
    }
    
    if (!supabaseAnonKey) {
      console.warn('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY is not set, using placeholder');
    }

    return createServerClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        // Add connection pooling and performance optimizations
        global: {
          headers: {
            'X-Client-Info': 'safari-quote-app',
          },
        },
      },
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return a client with placeholder values to prevent build failures
    const cookieStore = await cookies();
    return createServerClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // No-op for placeholder client
          },
        },
      },
    );
  }
}

// Cache utility functions
export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

// Optimized query function with caching
export async function optimizedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey: string,
  useCache: boolean = true
): Promise<{ data: T | null; error: any }> {
  if (useCache) {
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }
  }

  const result = await queryFn();
  
  if (result.data && useCache) {
    setCachedData(cacheKey, result.data);
  }
  
  return result;
}
