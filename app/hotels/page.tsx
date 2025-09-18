import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HotelsNav } from "@/components/hotels-nav";
import { HotelsTabs } from "@/components/hotels-tabs";

export default async function HotelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-fade">
      <HotelsNav userEmail={user.email || ''} />
      
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Hotels</h1>
            <p className="mt-2 text-gray2">Manage your hotel products, pricing, and configurations.</p>
          </div>

          <HotelsTabs />
        </div>
      </main>
    </div>
  );
} 