"use client";

import { useState } from "react";

import { HotelsTable } from "@/components/hotels/hotels-table";
import { HotelRoomsTable } from "@/components/hotels/hotel-rooms-table";
import { HotelSeasonsTable } from "@/components/hotels/hotel-seasons-table";
import { RoomTypeTable } from "@/components/hotels/room-type-table";
import { HotelCategoryTable } from "@/components/hotels/hotel-category-table";


import { HotelMealPlansTable } from "@/components/hotels/hotel-meal-plans-table";
import { HotelRatesOptionsTable } from "@/components/hotels/hotel-rates-options-table";
import { HotelChildPolicyTable } from "@/components/hotels/hotel-child-policy-table";
import { HotelRatesTable } from "@/components/hotels/hotel-rates-table";

const tabs = [
  { id: "hotels", name: "Hotels" },
  { id: "hotel-rooms", name: "Hotel Rooms" },
  { id: "hotel-seasons", name: "Hotel Seasons" },
  { id: "room-type", name: "Room Type" },
  { id: "category", name: "Category" },
  { id: "meal-plans", name: "Meal Plans" },
  { id: "rates-options", name: "Rates Options" },
  { id: "child-policies", name: "Child Policies" },
  { id: "hotel-rates", name: "Hotel Rates" },
];

export function HotelsTabs() {
  const [activeTab, setActiveTab] = useState("hotels");
  const [searchQuery, setSearchQuery] = useState("");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "hotels":
        return <HotelsTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "hotel-rooms":
        return <HotelRoomsTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "hotel-seasons":
        return <HotelSeasonsTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "room-type":
        return <RoomTypeTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "category":
        return <HotelCategoryTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "meal-plans":
        return <HotelMealPlansTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case "rates-options":
        return <HotelRatesOptionsTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
        case "child-policies":
    return <HotelChildPolicyTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
  case "hotel-rates":
    return <HotelRatesTable searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
  default:
    return <HotelsTable searchQuery={searchQuery} />;
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