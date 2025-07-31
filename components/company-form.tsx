"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle } from "lucide-react";

interface Company {
  id: string;
  owner_id: string;
  company_name: string | null;
  company_email: string | null;
  company_address: string | null;
  phone_number: string | null;
  created_at: string;
}

interface CompanyFormProps {
  initialData?: Company | null;
}

export function CompanyForm({ initialData }: CompanyFormProps) {
  const [company, setCompany] = useState<Company | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    company_address: "",
    phone_number: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (initialData) {
      setCompany(initialData);
      setFormData({
        company_name: initialData.company_name || "",
        company_email: initialData.company_email || "",
        company_address: initialData.company_address || "",
        phone_number: initialData.phone_number || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      let result;
      
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(formData)
          .eq('id', company.id);

        if (error) throw error;
        result = { ...company, ...formData };
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert({
            owner_id: user.id,
            ...formData,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      setCompany(result);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error saving company:', error);
      setErrorMessage(error.message || "An error occurred while saving");
      setShowError(true);
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {showSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">Company information updated successfully!</p>
        </div>
      )}

      {/* Error Alert */}
      {showError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Error updating company information</p>
            {errorMessage && (
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company details. All fields are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Enter your company name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                placeholder="company@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Enter your company address"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              
              {company && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      company_name: company.company_name || "",
                      company_email: company.company_email || "",
                      company_address: company.company_address || "",
                      phone_number: company.phone_number || "",
                    });
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 