import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Environment Variables:</h2>
            <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</p>
            <p>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Authentication Status:</h2>
            {error ? (
              <p className="text-red-600">❌ Error: {error.message}</p>
            ) : user ? (
              <p className="text-green-600">✅ Authenticated: {user.email}</p>
            ) : (
              <p className="text-yellow-600">⚠️ Not authenticated</p>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Database Test:</h2>
            <DatabaseTest />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Connection Error</h1>
        <p className="text-red-600">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}

async function DatabaseTest() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('countries').select('count').limit(1);
    
    if (error) {
      return <p className="text-red-600">❌ Database Error: {error.message}</p>;
    }
    
    return <p className="text-green-600">✅ Database connection successful</p>;
  } catch (error) {
    return <p className="text-red-600">❌ Database Error: {error instanceof Error ? error.message : 'Unknown error'}</p>;
  }
} 