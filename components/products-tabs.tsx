"use client";

import { useState } from "react";

import { ParksTable } from "@/components/products/parks-table";
import { EntryTypeTable } from "@/components/products/entry-type-table";
import { CategoryTable } from "@/components/products/category-table";
import { SeasonsTable } from "@/components/products/seasons-table";
import { ParkPricingTable } from "@/components/products/park-pricing-table";
import { CampingTypeTable } from "@/components/products/camping-type-table";
import { CampingPriceTable } from "@/components/products/camping-price-table";

const tabs = [
  { id: "parks", name: "Parks" },
  { id: "entry-type", name: "Entry Type" },
  { id: "category", name: "Category" },
  { id: "seasons", name: "Seasons" },
  { id: "park-pricing", name: "Park Pricing" },
  { id: "camping-type", name: "Camping Type" },
  { id: "camping-price", name: "Camping Price" },
];

export function ProductsTabs() {
  const [activeTab, setActiveTab] = useState("parks");
  const [searchQuery, setSearchQuery] = useState("");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "parks":
        return <ParksTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "entry-type":
        return <EntryTypeTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "category":
        return <CategoryTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "seasons":
        return <SeasonsTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "park-pricing":
        return <ParkPricingTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "camping-type":
        return <CampingTypeTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "camping-price":
        return <CampingPriceTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      default:
        return <ParksTable searchQuery={searchQuery} />;
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