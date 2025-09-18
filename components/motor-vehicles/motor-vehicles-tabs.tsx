"use client";

import { useState } from "react";
import { MotorVehicleEntryTypesTable } from "./motor-vehicle-entry-types-table";
import { MotorVehiclePricingTable } from "./motor-vehicle-pricing-table";

const tabs = [
  { id: "entry-types", name: "Entry Types" },
  { id: "pricing", name: "Pricing" },
];

export function MotorVehiclesTabs() {
  const [activeTab, setActiveTab] = useState("entry-types");
  const [searchQuery, setSearchQuery] = useState("");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "entry-types":
        return <MotorVehicleEntryTypesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "pricing":
        return <MotorVehiclePricingTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      default:
        return <MotorVehicleEntryTypesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
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
