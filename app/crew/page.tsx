import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CrewNav } from "@/components/crew-nav";
import { CrewTabs } from "@/components/crew-tabs";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function CrewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-fade">
      <CrewNav userEmail={user.email || ''} />
      
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Crew Management</h1>
            <p className="mt-2 text-gray2">Manage your crew categories, products, and pricing configurations.</p>
          </div>

          <CrewTabs />
        </div>
      </main>
    </div>
  );
}
