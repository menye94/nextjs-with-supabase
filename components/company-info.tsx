"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface Company {
  id: string;
  owner_id: string;
  company_name: string | null;
  company_email: string | null;
  company_address: string | null;
  phone_number: string | null;
  created_at: string;
}

export function CompanyInfo() {
  const [company, setCompany] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    company_address: "",
    phone_number: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setIsLoading(false);
        return;
      }

      console.log('Fetching company for user:', user.id);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching company:', error);
        // If no company exists, that's okay - we'll create one when needed
        if (error.code === 'PGRST116') {
          console.log('No company record found for user, will create one when needed');
        }
        setIsLoading(false);
        return;
      }

      console.log('Company data fetched:', data);
      setCompany(data);
      setFormData({
        company_name: data.company_name || "",
        company_email: data.company_email || "",
        company_address: data.company_address || "",
        phone_number: data.phone_number || "",
      });
    } catch (error) {
      console.error('Unexpected error in fetchCompany:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', company.id);

      if (error) {
        console.error('Error updating company:', error);
        return;
      }

      setCompany({ ...company, ...formData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      company_name: company?.company_name || "",
      company_email: company?.company_email || "",
      company_address: company?.company_address || "",
      phone_number: company?.phone_number || "",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If no company exists, show a message to create one
  if (!company) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>No company information found</CardDescription>
            </div>
            <Link href="/company">
              <Button variant="outline" size="sm">
                Create Company
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You haven't set up your company information yet. Click the button above to get started.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Company Name</Label>
              <p className="text-sm text-muted-foreground">Not set</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Company Email</Label>
              <p className="text-sm text-muted-foreground">Not set</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Company Address</Label>
              <p className="text-sm text-muted-foreground">Not set</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone Number</Label>
              <p className="text-sm text-muted-foreground">Not set</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Manage your company details</CardDescription>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                Edit
              </Button>
              <Link href="/company">
                <Button variant="outline" size="sm">
                  Full Form
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                placeholder="company@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                placeholder="Enter company address"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Company Name</Label>
              <p className="text-sm text-muted-foreground">
                {company?.company_name || "Not set"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Company Email</Label>
              <p className="text-sm text-muted-foreground">
                {company?.company_email || "Not set"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Company Address</Label>
              <p className="text-sm text-muted-foreground">
                {company?.company_address || "Not set"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone Number</Label>
              <p className="text-sm text-muted-foreground">
                {company?.phone_number || "Not set"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 