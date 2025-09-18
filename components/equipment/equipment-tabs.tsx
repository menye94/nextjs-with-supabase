'use client';

import { useState } from 'react';
import EquipmentCategoriesTable from './equipment-categories-table';
import EquipmentCompaniesTable from './equipment-companies-table';
import EquipmentTable from './equipment-table';

const tabs = [
  { id: 'equipment-categories', name: 'Equipment Categories' },
  { id: 'equipment-companies', name: 'Equipment Companies' },
  { id: 'equipments', name: 'Equipments' }
];

export default function EquipmentTabs() {
  const [activeTab, setActiveTab] = useState('equipment-categories');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'equipment-categories':
        return <EquipmentCategoriesTable />;
      case 'equipment-companies':
        return <EquipmentCompaniesTable />;
      case 'equipments':
        return <EquipmentTable />;
      default:
        return <EquipmentCategoriesTable />;
    }
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm bg-white ${
                activeTab === tab.id
                  ? 'border-theme-green text-theme-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6 bg-white">
        {renderActiveTab()}
      </div>
    </div>
  );
} 