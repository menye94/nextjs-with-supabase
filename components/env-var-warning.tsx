"use client";

import { useEffect, useState } from "react";

export function EnvVarWarning() {
  const [envStatus, setEnvStatus] = useState<{
    hasSupabaseUrl: boolean;
    hasSupabaseKey: boolean;
    supabaseUrl: string;
    supabaseKey: string;
  }>({
    hasSupabaseUrl: false,
    hasSupabaseKey: false,
    supabaseUrl: '',
    supabaseKey: ''
  });

  useEffect(() => {
    setEnvStatus({
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ? 'Set' : 'Not set'
    });
  }, []);

  if (envStatus.hasSupabaseUrl && envStatus.hasSupabaseKey) {
    return null; // Don't show warning if both are set
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Environment Variables Missing
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Some environment variables are not set, which may cause issues with dropdown data:</p>
            <ul className="list-disc list-inside mt-1">
              <li>NEXT_PUBLIC_SUPABASE_URL: {envStatus.supabaseUrl}</li>
              <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: {envStatus.supabaseKey}</li>
            </ul>
            <p className="mt-2">
              Please create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in your project root with these variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
