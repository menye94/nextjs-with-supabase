"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TroubleshootPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Environment Variables
      results.envVars = {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
      };

      // Test 2: Client Connection
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        results.clientConnection = {
          success: !error,
          error: error?.message,
          user: data.user ? 'Authenticated' : 'Not authenticated'
        };
      } catch (error) {
        results.clientConnection = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Database Query
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('countries').select('count').limit(1);
        results.databaseQuery = {
          success: !error,
          error: error?.message,
          data: data ? 'Data received' : 'No data'
        };
      } catch (error) {
        results.databaseQuery = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 4: Server Action Test
      try {
        const response = await fetch('/api/test-server-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: true }),
        });
        
        if (response.ok) {
          const data = await response.json();
          results.serverAction = {
            success: true,
            data: data
          };
        } else {
          results.serverAction = {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      } catch (error) {
        results.serverAction = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

    } catch (error) {
      results.generalError = error instanceof Error ? error.message : 'Unknown error';
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Troubleshooting Dashboard</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="btn-pri px-6 py-3 mb-8"
      >
        {loading ? 'Running Tests...' : 'Run Diagnostic Tests'}
      </button>

      {testResults && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2">
              <p>SUPABASE_URL: {testResults.envVars?.supabaseUrl ? '✅ Set' : '❌ Not set'}</p>
              <p>SUPABASE_KEY: {testResults.envVars?.supabaseKey ? '✅ Set' : '❌ Not set'}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Client Connection</h2>
            {testResults.clientConnection?.success ? (
              <p className="text-green-600">✅ Success: {testResults.clientConnection.user}</p>
            ) : (
              <p className="text-red-600">❌ Error: {testResults.clientConnection?.error}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Database Query</h2>
            {testResults.databaseQuery?.success ? (
              <p className="text-green-600">✅ Success: {testResults.databaseQuery.data}</p>
            ) : (
              <p className="text-red-600">❌ Error: {testResults.databaseQuery?.error}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Server Action</h2>
            {testResults.serverAction?.success ? (
              <p className="text-green-600">✅ Success: Server action working</p>
            ) : (
              <p className="text-red-600">❌ Error: {testResults.serverAction?.error}</p>
            )}
          </div>

          {testResults.generalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold">General Error</h3>
              <p className="text-red-700">{testResults.generalError}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Common Solutions</h2>
        <div className="space-y-3 text-blue-700">
          <p>1. <strong>Check Environment Variables:</strong> Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY are set in .env.local</p>
          <p>2. <strong>Database Setup:</strong> Run the SQL migration in your Supabase dashboard</p>
          <p>3. <strong>Network Issues:</strong> Check if you can access your Supabase project URL</p>
          <p>4. <strong>Restart Dev Server:</strong> Try stopping and restarting the development server</p>
          <p>5. <strong>Clear Browser Cache:</strong> Clear browser cache and cookies</p>
        </div>
      </div>
    </div>
  );
} 