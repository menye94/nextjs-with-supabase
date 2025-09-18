import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProductsNav } from "@/components/products-nav";
import { ProductsTabs } from "@/components/products-tabs";
import { Suspense } from "react";
import { LazyLoader } from "@/components/ui/lazy-loader";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-fade">
      <ProductsNav userEmail={user.email || ''} />
      
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-2 text-gray2">Manage your park products, pricing, and configurations.</p>
          </div>

          <Suspense fallback={
            <div className="space-y-6">
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <nav className="-mb-px flex space-x-8">
                    {["Parks", "Entry Type", "Category", "Seasons", "Park Pricing", "Camping Type", "Camping Price"].map((tab) => (
                      <div key={tab} className="py-2 px-1 border-b-2 font-medium text-sm text-gray-400 border-transparent">
                        {tab}
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-green"></div>
                      <span className="text-gray-600 text-lg">Loading Products...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }>
            <ProductsTabs />
          </Suspense>
        </div>
      </main>
    </div>
  );
} 