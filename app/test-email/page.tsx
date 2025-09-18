'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [template, setTemplate] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const templates = [
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'company-approval', label: 'Company Approval Request' },
    { value: 'company-approved', label: 'Company Approved' },
    { value: 'quote-generated', label: 'Quote Generated' },
    { value: 'invoice-generated', label: 'Invoice Generated' },
  ];

  const handleSendEmail = async () => {
    if (!email || !name) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let endpoint = '/api/email/';
      let payload: any = {};

      switch (template) {
        case 'welcome':
          endpoint += 'welcome';
          payload = { to: email, name, companyName };
          break;
        case 'company-approval':
          endpoint += 'company-approval';
          payload = { 
            to: email, 
            companyName: companyName || 'Test Company', 
            ownerName: name, 
            ownerEmail: email,
            companyDetails: { website: 'test.com', phone: '+1234567890' }
          };
          break;
        case 'company-approved':
          endpoint += 'company-approved';
          payload = { to: email, name, companyName: companyName || 'Test Company' };
          break;
        case 'quote-generated':
          endpoint += 'quote-generated';
          payload = { 
            to: email, 
            name, 
            quoteId: 'Q-001', 
            quoteAmount: 1500, 
            quoteDetails: '3-day safari package with accommodation and transport' 
          };
          break;
        case 'invoice-generated':
          endpoint += 'invoice-generated';
          payload = { 
            to: email, 
            name, 
            invoiceId: 'INV-001', 
            invoiceAmount: 1500, 
            dueDate: '2024-12-31' 
          };
          break;
        default:
          throw new Error('Invalid template');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Email Functionality</CardTitle>
            <CardDescription>
              Test the Resend email integration with different templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Recipient Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Email Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendEmail} 
              disabled={loading || !email || !name}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm font-medium">Email sent successfully!</p>
                <pre className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Templates</CardTitle>
            <CardDescription>
              Overview of the email templates you can test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((t) => (
                <div key={t.value} className="border rounded-lg p-4">
                  <h3 className="font-medium">{t.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t.value === 'welcome' && 'Welcome email for new users'}
                    {t.value === 'company-approval' && 'Notification to admin about new company registration'}
                    {t.value === 'company-approved' && 'Confirmation email when company is approved'}
                    {t.value === 'quote-generated' && 'Notification when a new quote is created'}
                    {t.value === 'invoice-generated' && 'Notification when a new invoice is generated'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
