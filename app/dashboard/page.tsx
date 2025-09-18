import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { RecentInvoices } from "@/components/recent-invoices";
import { WelcomeCard } from "@/components/welcome-card";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch company data for welcome message
  const { data: company } = await supabase
    .from('companies')
    .select('company_name')
    .eq('owner_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userEmail={user.email || ''} />
      
      <div className="flex">
        <DashboardSidebar />
        
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <WelcomeCard 
              userName={user.email || ''} 
              companyName={company?.company_name || 'Your Company'} 
            />
            
            <RecentInvoices />
          </div>
        </main>
      </div>
    </div>
  );
} 