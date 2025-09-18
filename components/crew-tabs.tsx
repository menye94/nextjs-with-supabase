"use client";

import { useState } from "react";

import { CrewCategoryTable } from "@/components/crew/crew-category-table";
import { CrewProductTable } from "@/components/crew/crew-product-table";

const tabs = [
  { id: "crew-categories", name: "Crew Categories" },
  { id: "crew-products", name: "Crew Products" },
];

export function CrewTabs() {
  const [activeTab, setActiveTab] = useState("crew-categories");
  const [searchQuery, setSearchQuery] = useState("");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "crew-categories":
        return <CrewCategoryTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "crew-products":
        return <CrewProductTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      default:
        return <CrewCategoryTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
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
