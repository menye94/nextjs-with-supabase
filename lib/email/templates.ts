import { emailConfig } from './config';

export function generateEmailTemplate(templateName: string, data: Record<string, any>) {
  switch (templateName) {
    case 'welcome':
      return generateWelcomeTemplate(data);
    case 'email-confirmation':
      return generateEmailConfirmationTemplate(data);
    case 'password-reset':
      return generatePasswordResetTemplate(data);
    case 'company-approval':
      return generateCompanyApprovalTemplate(data);
    case 'company-approved':
      return generateCompanyApprovedTemplate(data);
    case 'quote-generated':
      return generateQuoteGeneratedTemplate(data);
    case 'invoice-generated':
      return generateInvoiceGeneratedTemplate(data);
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}

function generateWelcomeTemplate(data: { name: string; companyName?: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Safari Quote</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Welcome to Safari Quote!</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.name}!</h2>
          <p>Welcome to Safari Quote, your comprehensive platform for managing safari tours, equipment, and customer relationships.</p>
          ${data.companyName ? `<p>We're excited to have <strong>${data.companyName}</strong> on board!</p>` : ''}
          <p>With Safari Quote, you can:</p>
          <ul>
            <li>Create and manage detailed safari quotes</li>
            <li>Track equipment and inventory</li>
            <li>Manage customer relationships</li>
            <li>Generate professional invoices</li>
            <li>And much more!</li>
          </ul>
          <a href="${emailConfig.companyWebsite}/dashboard" class="button">Get Started</a>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${emailConfig.companyName}. All rights reserved.</p>
          <p>This email was sent to you because you signed up for Safari Quote.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Safari Quote!

Hello ${data.name}!

Welcome to Safari Quote, your comprehensive platform for managing safari tours, equipment, and customer relationships.

${data.companyName ? `We're excited to have ${data.companyName} on board!` : ''}

With Safari Quote, you can:
- Create and manage detailed safari quotes
- Track equipment and inventory
- Manage customer relationships
- Generate professional invoices
- And much more!

Get started: ${emailConfig.companyWebsite}/dashboard

If you have any questions, feel free to reach out to our support team.

© 2024 ${emailConfig.companyName}. All rights reserved.
This email was sent to you because you signed up for Safari Quote.
  `;

  return { html, text };
}

function generateEmailConfirmationTemplate(data: { name: string; confirmationLink: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Confirm Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.name}!</h2>
          <p>Please confirm your email address to complete your Safari Quote account setup.</p>
          <a href="${data.confirmationLink}" class="button">Confirm Email Address</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${data.confirmationLink}</p>
          <p>This link will expire in 24 hours for security reasons.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${emailConfig.companyName}. All rights reserved.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Confirm Your Email

Hello ${data.name}!

Please confirm your email address to complete your Safari Quote account setup.

Confirm Email Address: ${data.confirmationLink}

If the link doesn't work, copy and paste it into your browser.

This link will expire in 24 hours for security reasons.

© 2024 ${emailConfig.companyName}. All rights reserved.
If you didn't create this account, you can safely ignore this email.
  `;

  return { html, text };
}

function generatePasswordResetTemplate(data: { name: string; resetLink: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.name}!</h2>
          <p>We received a request to reset your Safari Quote account password.</p>
          <a href="${data.resetLink}" class="button">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${data.resetLink}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email and ensure your account is secure.</p>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 ${emailConfig.companyName}. All rights reserved.</p>
          <p>This is an automated email - please do not reply to it.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset Your Password

Hello ${data.name}!

We received a request to reset your Safari Quote account password.

Reset Password: ${data.resetLink}

If the link doesn't work, copy and paste it into your browser.

⚠️ Security Notice:
This link will expire in 1 hour for security reasons.
If you didn't request this password reset, please ignore this email and ensure your account is secure.

© 2024 ${emailConfig.companyName}. All rights reserved.
This is an automated email - please do not reply to it.
  `;

  return { html, text };
}

function generateCompanyApprovalTemplate(data: { 
  companyName: string; 
  ownerName: string; 
  ownerEmail: string;
  companyDetails: Record<string, any>;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Company Approval Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Company Approval Request</h1>
        </div>
        <div class="content">
          <h2>New Company Registration</h2>
          <p>A new company has requested approval to join Safari Quote.</p>
          
          <div class="details">
            <h3>Company Details:</h3>
            <p><strong>Company Name:</strong> ${data.companyName}</p>
            <p><strong>Owner Name:</strong> ${data.ownerName}</p>
            <p><strong>Owner Email:</strong> ${data.ownerEmail}</p>
            ${Object.entries(data.companyDetails).map(([key, value]) => 
              `<p><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value}</p>`
            ).join('')}
          </div>
          
          <a href="${emailConfig.companyWebsite}/admin/approvals" class="button">Review Request</a>
          <p>Please review this request and approve or reject it from the admin panel.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${emailConfig.companyName}. All rights reserved.</p>
          <p>This is an automated notification for administrators.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Company Approval Request

New Company Registration

A new company has requested approval to join Safari Quote.

Company Details:
Company Name: ${data.companyName}
Owner Name: ${data.ownerName}
Owner Email: ${data.ownerEmail}
${Object.entries(data.companyDetails).map(([key, value]) => 
  `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`
).join('\n')}

Review Request: ${emailConfig.companyWebsite}/admin/approvals

Please review this request and approve or reject it from the admin panel.

© 2024 ${emailConfig.companyName}. All rights reserved.
This is an automated notification for administrators.
  `;

  return { html, text };
}

function generateCompanyApprovedTemplate(data: { name: string; companyName: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Company Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Company Approved!</h1>
        </div>
        <div class="content">
          <h2>Congratulations ${data.name}!</h2>
          <p>Great news! Your company <strong>${data.companyName}</strong> has been approved for Safari Quote.</p>
          <p>You now have full access to all features and can start creating quotes, managing equipment, and growing your business.</p>
          <a href="${emailConfig.companyWebsite}/dashboard" class="button">Access Dashboard</a>
          <p>If you have any questions or need assistance getting started, our support team is here to help.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${emailConfig.companyName}. All rights reserved.</p>
          <p>Welcome to the Safari Quote family!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Company Approved!

Congratulations ${data.name}!

Great news! Your company ${data.companyName} has been approved for Safari Quote.

You now have full access to all features and can start creating quotes, managing equipment, and growing your business.

Access Dashboard: ${emailConfig.companyWebsite}/dashboard

If you have any questions or need assistance getting started, our support team is here to help.

© 2024 ${emailConfig.companyName}. All rights reserved.
Welcome to the Safari Quote family!
  `;

  return { html, text };
}

function generateQuoteGeneratedTemplate(data: { 
  name: string; 
  quoteId: string; 
  quoteAmount: number;
  quoteDetails: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Safari Quote is Ready</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .quote-box { background: white; border: 2px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
        .amount { font-size: 24px; font-weight: bold; color: #f59e0b; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Your Safari Quote is Ready</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.name}!</h2>
          <p>Your safari quote has been generated and is ready for review.</p>
          
          <div class="quote-box">
            <p><strong>Quote ID:</strong> ${data.quoteId}</p>
            <p class="amount">$${data.quoteAmount.toLocaleString()}</p>
            <p><strong>Details:</strong></p>
            <p>${data.quoteDetails}</p>
          </div>
          
          <a href="${emailConfig.companyWebsite}/safari-quote/${data.quoteId}" class="button">View Quote</a>
          <p>Please review the details and let us know if you have any questions or need modifications.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${emailConfig.companyName}. All rights reserved.</p>
          <p>Thank you for choosing Safari Quote!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Your Safari Quote is Ready

Hello ${data.name}!

Your safari quote has been generated and is ready for review.

Quote ID: ${data.quoteId}
Amount: $${data.quoteAmount.toLocaleString()}
Details: ${data.quoteDetails}

View Quote: ${emailConfig.companyWebsite}/safari-quote/${data.quoteId}

Please review the details and let us know if you have any questions or need modifications.

© 2024 ${emailConfig.companyName}. All rights reserved.
Thank you for choosing Safari Quote!
  `;

  return { html, text };
}

function generateInvoiceGeneratedTemplate(data: { 
  name: string; 
  invoiceId: string; 
  invoiceAmount: number;
  dueDate: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Invoice Generated</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .invoice-box { background: white; border: 2px solid #dc2626; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
        .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
        .due-date { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 4px; margin: 15px 0; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧾 New Invoice Generated</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.name}!</h2>
          <p>A new invoice has been generated for your safari services.</p>
          
          <div class="invoice-box">
            <p><strong>Invoice ID:</strong> ${data.invoiceId}</p>
            <p class="amount">$${data.invoiceAmount.toLocaleString()}</p>
            <div class="due-date">
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
          </div>
          
          <a href="${emailConfig.companyWebsite}/invoices/${data.invoiceId}" class="button">View Invoice</a>
          <p>Please review the invoice and ensure payment is made by the due date.</p>
          <p>If you have any questions about this invoice, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${emailConfig.companyName}. All rights reserved.</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Invoice Generated

Hello ${data.name}!

A new invoice has been generated for your safari services.

Invoice ID: ${data.invoiceId}
Amount: $${data.invoiceAmount.toLocaleString()}
Due Date: ${data.dueDate}

View Invoice: ${emailConfig.companyWebsite}/invoices/${data.invoiceId}

Please review the invoice and ensure payment is made by the due date.

If you have any questions about this invoice, please contact our support team.

© 2024 ${emailConfig.companyName}. All rights reserved.
Thank you for your business!
  `;

  return { html, text };
}
