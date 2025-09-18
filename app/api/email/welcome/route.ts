import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, name, companyName } = await req.json();

    if (!to || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, name' },
        { status: 400 }
      );
    }

    // Send welcome email
    const result = await EmailService.sendWelcomeEmail(to, { name, companyName });

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
