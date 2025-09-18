import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, template, data } = await req.json();

    if (!to || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: to, template' },
        { status: 400 }
      );
    }

    // Send test email
    const result = await EmailService.sendCustomEmail(to, 'Test Email', template, data || {});

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
