import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, companyName, ownerName, ownerEmail, companyDetails } = await req.json();

    if (!to || !companyName || !ownerName || !ownerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: to, companyName, ownerName, ownerEmail' },
        { status: 400 }
      );
    }

    // Send company approval request email
    const result = await EmailService.sendCompanyApprovalRequest(to, {
      companyName,
      ownerName,
      ownerEmail,
      companyDetails: companyDetails || {},
    });

    return NextResponse.json({
      success: true,
      message: 'Company approval email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Company approval email error:', error);
    return NextResponse.json(
      { error: 'Failed to send company approval email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
