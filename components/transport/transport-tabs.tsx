'use client';

import { useState } from 'react';
import TransportTypesTable from './transport-types-table';
import TransportTicketTypesTable from './transport-ticket-types-table';
import TransportFuelOptionsTable from './transport-fuel-options-table';
import TransportCategoriesTable from './transport-categories-table';
import TransportCompaniesTable from './transport-companies-table';
import TransportSeasonsTable from './transport-seasons-table';
import TransportServicesTable from './transport-services-table';
import TransportRatesTable from './transport-rates-table';
import { 
  Building2, 
  Ticket, 
  Fuel, 
  FolderOpen, 
  Truck, 
  Calendar, 
  Route, 
  DollarSign 
} from 'lucide-react';

const tabs = [
  { 
    id: 'types', 
    name: 'Transport Types', 
    icon: Building2,
    component: TransportTypesTable,
    description: 'Manage different types of transportation'
  },
  { 
    id: 'ticket-types', 
    name: 'Ticket Types', 
    icon: Ticket,
    component: TransportTicketTypesTable,
    description: 'Configure ticket categories'
  },
  { 
    id: 'fuel-options', 
    name: 'Fuel Options', 
    icon: Fuel,
    component: TransportFuelOptionsTable,
    description: 'Set fuel preferences'
  },
  { 
    id: 'categories', 
    name: 'Categories', 
    icon: FolderOpen,
    component: TransportCategoriesTable,
    description: 'Organize transport categories'
  },
  { 
    id: 'companies', 
    name: 'Companies', 
    icon: Truck,
    component: TransportCompaniesTable,
    description: 'Manage transport companies'
  },
  { 
    id: 'seasons', 
    name: 'Seasons', 
    icon: Calendar,
    component: TransportSeasonsTable,
    description: 'Configure seasonal pricing'
  },
  { 
    id: 'services', 
    name: 'Services', 
    icon: Route,
    component: TransportServicesTable,
    description: 'Define transport services'
  },
  { 
    id: 'rates', 
    name: 'Rates', 
    icon: DollarSign,
    component: TransportRatesTable,
    description: 'Set pricing and rates'
  },
];

export default function TransportTabs() {
  const [activeTab, setActiveTab] = useState('types');

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TransportTypesTable;
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="bg-white">
      {/* Enhanced Tab Navigation */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTabData?.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeTabData?.description}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              {activeTabData?.icon && <activeTabData.icon className="h-5 w-5 text-white" />}
            </div>
          </div>
          
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center space-x-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg px-3'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg px-3'
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content with Enhanced Styling */}
      <div className="p-6">
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg p-1">
          <div className="bg-white rounded-lg">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
} 