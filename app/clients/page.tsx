import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientsTabs } from "@/components/clients-tabs";
import { ClientsNav } from "@/components/clients-nav";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-fade">
      <ClientsNav userEmail={user?.email || ''} />

      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-gray2">Manage your customers and agents.</p>
          </div>

          <ClientsTabs />
        </div>
      </main>
    </div>
  );
}
