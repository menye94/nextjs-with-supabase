// Email configuration
export const emailConfig = {
  from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
  replyTo: process.env.REPLY_TO_EMAIL || 'support@yourdomain.com',
  companyName: 'Safari Quote',
  companyWebsite: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

// Email templates configuration
export const emailTemplates = {
  welcome: {
    subject: 'Welcome to Safari Quote!',
    template: 'welcome',
  },
  emailConfirmation: {
    subject: 'Confirm your email address',
    template: 'email-confirmation',
  },
  passwordReset: {
    subject: 'Reset your password',
    template: 'password-reset',
  },
  companyApproval: {
    subject: 'Company approval request',
    template: 'company-approval',
  },
  companyApproved: {
    subject: 'Your company has been approved!',
    template: 'company-approved',
  },
  quoteGenerated: {
    subject: 'Your Safari Quote is ready',
    template: 'quote-generated',
  },
  invoiceGenerated: {
    subject: 'New invoice generated',
    template: 'invoice-generated',
  },
};

// Email types for TypeScript
export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Resend client - completely isolated to prevent build-time issues
export const getResendClient = async () => {
  try {
    // Only import Resend at runtime
    const { Resend } = await import('resend');
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    
    return new Resend(apiKey);
  } catch (error) {
    console.error('Failed to initialize Resend client:', error);
    throw new Error('Email service is not available');
  }
};

// Export resend for backward compatibility
export const resend = {
  emails: {
    send: async (options: any) => {
      const client = await getResendClient();
      return client.emails.send(options);
    }
  }
};
