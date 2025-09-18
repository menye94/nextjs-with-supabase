import { resend, emailConfig, emailTemplates, type EmailData } from './config';
import { generateEmailTemplate } from './templates';

export class EmailService {
  /**
   * Send a transactional email using a template
   */
  static async sendEmail(emailData: EmailData) {
    try {
      const template = generateEmailTemplate(emailData.template, emailData.data);
      
      const result = await resend.emails.send({
        from: emailConfig.from,
        to: emailData.to,
        subject: emailData.subject,
        html: template.html,
        text: template.text,
        replyTo: emailConfig.replyTo,
      });

      if (result.error) {
        console.error('Email sending failed:', result.error);
        throw new Error(`Failed to send email: ${result.error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(to: string, data: { name: string; companyName?: string }) {
    return this.sendEmail({
      to,
      subject: emailTemplates.welcome.subject,
      template: emailTemplates.welcome.template,
      data,
    });
  }

  /**
   * Send email confirmation link
   */
  static async sendEmailConfirmation(to: string, data: { name: string; confirmationLink: string }) {
    return this.sendEmail({
      to,
      subject: emailTemplates.emailConfirmation.subject,
      template: emailTemplates.emailConfirmation.template,
      data,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(to: string, data: { name: string; resetLink: string }) {
    return this.sendEmail({
      to,
      subject: emailTemplates.passwordReset.subject,
      template: emailTemplates.passwordReset.template,
      data,
    });
  }

  /**
   * Send company approval request to admin
   */
  static async sendCompanyApprovalRequest(to: string, data: { 
    companyName: string; 
    ownerName: string; 
    ownerEmail: string;
    companyDetails: Record<string, any>;
  }) {
    return this.sendEmail({
      to,
      subject: emailTemplates.companyApproval.subject,
      template: emailTemplates.companyApproval.template,
      data,
    });
  }

  /**
   * Send company approval confirmation to user
   */
  static async sendCompanyApproved(to: string, data: { name: string; companyName: string }) {
    return this.sendEmail({
      to,
      subject: emailTemplates.companyApproved.subject,
      template: emailTemplates.companyApproved.template,
      data,
    });
  }

  /**
   * Send quote generated notification
   */
  static async sendQuoteGenerated(to: string, data: { 
    name: string; 
    quoteId: string; 
    quoteAmount: number;
    quoteDetails: string;
  }) {
    return this.sendEmail({
      to,
      subject: emailTemplates.quoteGenerated.subject,
      template: emailTemplates.quoteGenerated.template,
      data,
    });
  }

  /**
   * Send invoice generated notification
   */
  static async sendInvoiceGenerated(to: string, data: { 
    name: string; 
    invoiceId: string; 
    invoiceAmount: number;
    dueDate: string;
  }) {
    return this.sendEmail({
      to,
      subject: emailTemplates.invoiceGenerated.subject,
      template: emailTemplates.invoiceGenerated.template,
      data,
    });
  }

  /**
   * Send custom email with custom template
   */
  static async sendCustomEmail(to: string, subject: string, template: string, data: Record<string, any>) {
    return this.sendEmail({
      to,
      subject,
      template,
      data,
    });
  }
}
