import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClientInstance: SupabaseClient | null = null;
let isInitializing = false;

/**
 * Dynamically fetches Supabase configurations from the backend API
 * and returns a lazily initialized Supabase client instance.
 * 
 * This avoids crashing during module load time if keys are not yet configured.
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  if (isInitializing) {
    // Wait slightly and retry if another call is currently initializing the client
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getSupabaseClient();
  }

  isInitializing = true;
  try {
    let response: Response | null = null;
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        response = await fetch('/api/supabase-config');
        if (response.ok) {
          break;
        }
        throw new Error(`Status: ${response.status} ${response.statusText}`);
      } catch (err) {
        attempt++;
        console.warn(`Attempt ${attempt} to fetch Supabase config failed:`, err);
        if (attempt >= maxRetries) {
          throw err;
        }
        // Wait before retrying (linear backoff: 600ms, 1200ms, 1800ms, 2400ms)
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to fetch Supabase config after ${maxRetries} attempts`);
    }

    const data = await response.json();
    const url = data.supabaseUrl;
    const anonKey = data.supabaseAnonKey;

    if (!url || !anonKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be configured in your AI Studio Environment Secrets.'
      );
    }

    supabaseClientInstance = createClient(url, anonKey);
    return supabaseClientInstance;
  } catch (error) {
    console.error('Supabase initialization error:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}
