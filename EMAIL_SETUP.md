# Resend Email Integration Setup

This document explains how to set up and use the Resend email integration in your Safari Quote application.

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Domain Verification**: Verify your domain in Resend dashboard
3. **API Key**: Get your API key from the Resend dashboard

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here

# Email Configuration
FROM_EMAIL=noreply@yourdomain.com
REPLY_TO_EMAIL=support@yourdomain.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Features

### Email Templates

The integration includes the following email templates:

1. **Welcome Email** - Sent to new users upon registration
2. **Email Confirmation** - For email verification
3. **Password Reset** - For password recovery
4. **Company Approval Request** - Notification to admin about new company registration
5. **Company Approved** - Confirmation when company is approved
6. **Quote Generated** - Notification when a new quote is created
7. **Invoice Generated** - Notification when a new invoice is generated

### Email Service

The `EmailService` class provides methods for sending different types of emails:

```typescript
import { EmailService } from '@/lib/email';

// Send welcome email
await EmailService.sendWelcomeEmail('user@example.com', { 
  name: 'John Doe', 
  companyName: 'Safari Co' 
});

// Send company approval request
await EmailService.sendCompanyApprovalRequest('admin@example.com', {
  companyName: 'Safari Co',
  ownerName: 'John Doe',
  ownerEmail: 'john@safari.com',
  companyDetails: { website: 'safari.com', phone: '+1234567890' }
});

// Send quote generated notification
await EmailService.sendQuoteGenerated('customer@example.com', {
  name: 'Jane Smith',
  quoteId: 'Q-001',
  quoteAmount: 1500,
  quoteDetails: '3-day safari package'
});
```

## API Endpoints

### Test Email
- **POST** `/api/email/test`
- Send a test email with any template

### Welcome Email
- **POST** `/api/email/welcome`
- Send welcome email to new users

### Company Approval
- **POST** `/api/email/company-approval`
- Send company approval request to admin

### Company Approved
- **POST** `/api/email/company-approved`
- Send confirmation when company is approved

### Quote Generated
- **POST** `/api/email/quote-generated`
- Send notification when quote is generated

### Invoice Generated
- **POST** `/api/email/invoice-generated`
- Send notification when invoice is generated

## Testing

Visit `/test-email` to test the email functionality with different templates.

## Integration Examples

### In Sign-up Flow

```typescript
// After successful user registration
await EmailService.sendWelcomeEmail(user.email, {
  name: user.name,
  companyName: company.name
});

// Send company approval request to admin
await EmailService.sendCompanyApprovalRequest(adminEmail, {
  companyName: company.name,
  ownerName: user.name,
  ownerEmail: user.email,
  companyDetails: company
});
```

### In Quote Generation

```typescript
// After generating a quote
await EmailService.sendQuoteGenerated(customer.email, {
  name: customer.name,
  quoteId: quote.id,
  quoteAmount: quote.totalAmount,
  quoteDetails: quote.description
});
```

### In Invoice Generation

```typescript
// After generating an invoice
await EmailService.sendInvoiceGenerated(customer.email, {
  name: customer.name,
  invoiceId: invoice.id,
  invoiceAmount: invoice.totalAmount,
  dueDate: invoice.dueDate
});
```

## Customization

### Adding New Templates

1. Add template configuration to `lib/email/config.ts`
2. Create template function in `lib/email/templates.ts`
3. Add method to `EmailService` class
4. Create API endpoint if needed

### Styling

Email templates use inline CSS for maximum compatibility. You can customize colors, fonts, and layout in the template functions.

### Localization

To support multiple languages, you can:
1. Create language-specific template functions
2. Pass language preference in the data object
3. Use translation libraries like `react-i18next`

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Ensure your `RESEND_API_KEY` is correct
2. **Domain Not Verified**: Verify your domain in Resend dashboard
3. **Email Not Sending**: Check browser console and server logs for errors
4. **Template Errors**: Ensure all required data fields are provided

### Debug Mode

Enable debug logging by checking the browser console and server logs when sending emails.

### Rate Limiting

Resend has rate limits based on your plan. Monitor your usage in the Resend dashboard.

## Security Considerations

1. **API Key**: Never expose your Resend API key in client-side code
2. **Input Validation**: Always validate email addresses and data before sending
3. **Rate Limiting**: Implement rate limiting on your API endpoints
4. **Authentication**: Ensure only authenticated users can send emails

## Support

For issues with:
- **Resend Service**: Contact [Resend Support](https://resend.com/support)
- **Integration**: Check the application logs and error messages
- **Templates**: Review the template functions in `lib/email/templates.ts`
