import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, name, quoteId, quoteAmount, quoteDetails } = await req.json();

    if (!to || !name || !quoteId || quoteAmount === undefined || !quoteDetails) {
      return NextResponse.json(
        { error: 'Missing required fields: to, name, quoteId, quoteAmount, quoteDetails' },
        { status: 400 }
      );
    }

    // Send quote generated email
    const result = await EmailService.sendQuoteGenerated(to, {
      name,
      quoteId,
      quoteAmount: Number(quoteAmount),
      quoteDetails,
    });

    return NextResponse.json({
      success: true,
      message: 'Quote generated email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Quote generated email error:', error);
    return NextResponse.json(
      { error: 'Failed to send quote generated email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
