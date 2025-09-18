"use client";

import { useState } from "react";

import TransportTypesTable from "@/components/transport/transport-types-table";
import TransportTicketTypesTable from "@/components/transport/transport-ticket-types-table";
import TransportFuelOptionsTable from "@/components/transport/transport-fuel-options-table";
import TransportCategoriesTable from "@/components/transport/transport-categories-table";
import TransportCompaniesTable from "@/components/transport/transport-companies-table";
import TransportSeasonsTable from "@/components/transport/transport-seasons-table";
import TransportServicesTable from "@/components/transport/transport-services-table";
import TransportRatesTable from "@/components/transport/transport-rates-table";

const tabs = [
  { id: "types", name: "Transport Types" },
  { id: "ticket-types", name: "Ticket Types" },
  { id: "fuel-options", name: "Fuel Options" },
  { id: "categories", name: "Categories" },
  { id: "companies", name: "Companies" },
  { id: "seasons", name: "Seasons" },
  { id: "services", name: "Services" },
  { id: "rates", name: "Rates" },
];

export function TransportTabs() {
  const [activeTab, setActiveTab] = useState("types");
  const [searchQuery, setSearchQuery] = useState("");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "types":
        return <TransportTypesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "ticket-types":
        return <TransportTicketTypesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "fuel-options":
        return <TransportFuelOptionsTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "categories":
        return <TransportCategoriesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "companies":
        return <TransportCompaniesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "seasons":
        return <TransportSeasonsTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "services":
        return <TransportServicesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "rates":
        return <TransportRatesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      default:
        return <TransportTypesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-[var(--theme-green)] text-[var(--theme-green)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {renderActiveTab()}
      </div>
    </div>
  );
} 