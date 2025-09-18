import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, name, invoiceId, invoiceAmount, dueDate } = await req.json();

    if (!to || !name || !invoiceId || invoiceAmount === undefined || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: to, name, invoiceId, invoiceAmount, dueDate' },
        { status: 400 }
      );
    }

    // Send invoice generated email
    const result = await EmailService.sendInvoiceGenerated(to, {
      name,
      invoiceId,
      invoiceAmount: Number(invoiceAmount),
      dueDate,
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice generated email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Invoice generated email error:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice generated email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
