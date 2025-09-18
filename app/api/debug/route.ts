import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { error: 'Authentication error', details: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Test database connection
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    // Prepare debug data
    const debugData = {
      user: {
        email: user.email,
        id: user.id,
        created_at: user.created_at,
      },
      companies: companies || [],
      companiesError: companiesError ? {
        message: companiesError.message,
        code: companiesError.code,
      } : null,
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not Set',
        SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ? 'Set' : 'Not Set',
      },
      performance: {
        serverTime: new Date().toISOString(),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };

    return NextResponse.json(debugData);
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}









