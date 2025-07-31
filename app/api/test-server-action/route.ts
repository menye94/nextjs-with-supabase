import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return NextResponse.json({
      success: true,
      message: 'Server action test successful',
      user: user ? 'Authenticated' : 'Not authenticated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Server action test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 