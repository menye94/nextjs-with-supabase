import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransportNav } from "@/components/transport-nav";
import { TransportTabs } from "@/components/transport-tabs";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TransportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-fade">
      <TransportNav userEmail={user.email || ''} />
      
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Transport</h1>
            <p className="mt-2 text-gray2">Manage your transport types, companies, services, and rates.</p>
          </div>

          <TransportTabs />
        </div>
      </main>
    </div>
  );
} 