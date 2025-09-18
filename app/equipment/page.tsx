import EquipmentTabs from '@/components/equipment/equipment-tabs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function EquipmentPage() {
  return (
    <div className="container mx-auto py-8 px-4 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your equipment inventory, categories, companies, and pricing
        </p>
      </div>
      
      <EquipmentTabs />
    </div>
  );
} 