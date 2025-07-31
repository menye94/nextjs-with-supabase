import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { CompanyForm } from "@/components/company-form";

export default async function CompanyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch existing company data
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('No company record found for user, will create one when needed');
    } else {
      console.error('Error fetching company:', error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userEmail={user.email || ''} />
      
      <div className="flex">
        <DashboardSidebar />
        
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
              <p className="text-gray-500">Manage your company information</p>
            </div>
            
            <div className="max-w-2xl">
              <CompanyForm initialData={company} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 