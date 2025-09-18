import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, name, companyName } = await req.json();

    if (!to || !name || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields: to, name, companyName' },
        { status: 400 }
      );
    }

    // Send company approved email
    const result = await EmailService.sendCompanyApproved(to, { name, companyName });

    return NextResponse.json({
      success: true,
      message: 'Company approved email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Company approved email error:', error);
    return NextResponse.json(
      { error: 'Failed to send company approved email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
