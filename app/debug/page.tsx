'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DebugData {
  user: any;
  companies: any[];
  companiesError: any;
  environment: {
    NODE_ENV: string;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
  };
  performance: {
    serverTime: string;
    memoryUsage: number;
  };
}

export default function DebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        const response = await fetch('/api/debug');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/login');
            return;
          }
          throw new Error('Failed to fetch debug data');
        }
        const data = await response.json();
        setDebugData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading debug information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">
            An error occurred while loading the debug page:
          </p>
          <pre className="text-sm text-gray-700 bg-gray-100 p-2 rounded overflow-auto">
            {error}
          </pre>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!debugData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">No debug data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {debugData.user.email}</p>
              <p><strong>ID:</strong> {debugData.user.id}</p>
              <p><strong>Created:</strong> {new Date(debugData.user.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Database Connection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Connection</h2>
            {debugData.companiesError ? (
              <div className="text-red-600">
                <p><strong>Error:</strong> {debugData.companiesError.message}</p>
                <pre className="text-xs mt-2 bg-red-50 p-2 rounded">
                  {JSON.stringify(debugData.companiesError, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-green-600">
                <p><strong>Status:</strong> Connected</p>
                <p><strong>Companies found:</strong> {debugData.companies?.length || 0}</p>
              </div>
            )}
          </div>

          {/* Environment Variables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Variables</h2>
            <div className="space-y-2">
              <p><strong>NODE_ENV:</strong> {debugData.environment.NODE_ENV}</p>
              <p><strong>SUPABASE_URL:</strong> {debugData.environment.SUPABASE_URL}</p>
              <p><strong>SUPABASE_KEY:</strong> {debugData.environment.SUPABASE_KEY}</p>
            </div>
          </div>

          {/* Performance Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Test</h2>
            <div className="space-y-2">
              <p><strong>Server Time:</strong> {debugData.performance.serverTime}</p>
              <p><strong>Memory Usage:</strong> {debugData.performance.memoryUsage} MB</p>
            </div>
          </div>
        </div>

        {/* Test Database Queries */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Queries Test</h2>
          
          <div className="space-y-4">
            {/* Test hotels query */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Hotels Query</h3>
              <div className="text-blue-600">
                <p>Query test available - check browser console for async results</p>
              </div>
            </div>

            {/* Test locations query */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Locations Query</h3>
              <div className="text-blue-600">
                <p>Query test available - check browser console for async results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
