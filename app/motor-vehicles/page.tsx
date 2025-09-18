import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MotorVehiclesNav } from "@/components/motor-vehicles-nav";
import { MotorVehiclesTabs } from "@/components/motor-vehicles/motor-vehicles-tabs";

export default async function MotorVehiclesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-fade">
      <MotorVehiclesNav userEmail={user.email || ''} />
      
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Motor Vehicles</h1>
            <p className="mt-2 text-gray2">Manage your motor vehicle entry types and pricing configurations.</p>
          </div>

          <MotorVehiclesTabs />
        </div>
      </main>
    </div>
  );
}
