"use client";

import { useState, Suspense, useEffect } from "react";
import { LazyLoader, 
  ParksTableFallback, 
  EntryTypeTableFallback, 
  CategoryTableFallback, 
  SeasonsTableFallback, 
  ParkPricingTableFallback, 
  CampingTypeTableFallback, 
  CampingPriceTableFallback,
  AgeGroupsTableFallback
} from "@/components/ui/lazy-loader";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { createDefaultLazyComponent, createNamedLazyComponent } from "@/components/ui/lazy-wrapper";

// Lazy load all table components for better performance
const ParksTable = createDefaultLazyComponent(() => import("@/components/products/parks-table"));
const EntryTypeTable = createDefaultLazyComponent(() => import("@/components/products/entry-type-table"));
const CategoryTable = createDefaultLazyComponent(() => import("@/components/products/category-table"));
const SeasonsTable = createNamedLazyComponent(() => import("@/components/products/seasons-table"), "SeasonsTable");
const ParkPricingTable = createNamedLazyComponent(() => import("@/components/products/park-pricing-table"), "ParkPricingTable");
const CampingTypeTable = createDefaultLazyComponent(() => import("@/components/products/camping-type-table"));
const CampingPriceTable = createNamedLazyComponent(() => import("@/components/products/camping-price-table"), "CampingPriceTable");
const AgeGroupsTable = createDefaultLazyComponent(() => import("@/components/products/age-groups-table"));

const tabs = [
  { id: "parks", name: "Parks" },
  { id: "entry-type", name: "Entry Type" },
  { id: "category", name: "Category" },
  { id: "seasons", name: "Seasons" },
  { id: "age-groups", name: "Age Groups" },
  { id: "park-pricing", name: "Park Pricing" },
  { id: "camping-type", name: "Camping Type" },
  { id: "camping-price", name: "Camping Price" },
];

export function ProductsTabs() {
  const [activeTab, setActiveTab] = useState("parks");
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return; // Don't reload if same tab
    
    setIsTabLoading(true);
    setActiveTab(tabId);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      setIsTabLoading(false);
    }, 200);
  };

  // Handle initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "parks":
        return (
          <ErrorBoundary>
            <Suspense fallback={<ParksTableFallback />}>
              <ParksTable />
            </Suspense>
          </ErrorBoundary>
        );
      case "entry-type":
        return (
          <ErrorBoundary>
            <Suspense fallback={<EntryTypeTableFallback />}>
              <EntryTypeTable />
            </Suspense>
          </ErrorBoundary>
        );
      case "category":
        return (
          <ErrorBoundary>
            <Suspense fallback={<CategoryTableFallback />}>
              <CategoryTable />
            </Suspense>
          </ErrorBoundary>
        );
      case "seasons":
        return (
          <ErrorBoundary>
            <Suspense fallback={<SeasonsTableFallback />}>
              <SeasonsTable searchQuery="" onSearchChange={() => {}} />
            </Suspense>
          </ErrorBoundary>
        );
      case "age-groups":
        return (
          <ErrorBoundary>
            <Suspense fallback={<AgeGroupsTableFallback />}>
              <AgeGroupsTable searchQuery="" onSearchChange={() => {}} />
            </Suspense>
          </ErrorBoundary>
        );
      case "park-pricing":
        return (
          <ErrorBoundary>
            <Suspense fallback={<ParkPricingTableFallback />}>
              <ParkPricingTable searchQuery="" onSearchChange={() => {}} />
            </Suspense>
          </ErrorBoundary>
        );
      case "camping-type":
        return (
          <ErrorBoundary>
            <Suspense fallback={<CampingTypeTableFallback />}>
              <CampingTypeTable />
            </Suspense>
          </ErrorBoundary>
        );
      case "camping-price":
        return (
          <ErrorBoundary>
            <Suspense fallback={<CampingPriceTableFallback />}>
              <CampingPriceTable searchQuery="" onSearchChange={() => {}} />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <Suspense fallback={<ParksTableFallback />}>
              <ParksTable />
            </Suspense>
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <ProgressBar isLoading={isTabLoading} />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                disabled={isTabLoading}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-theme-green text-theme-green"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } ${isTabLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {isTabLoading || isInitialLoad ? (
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-green"></div>
                <span className="text-gray-600">
                  {isInitialLoad ? "Initializing..." : "Loading..."}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {renderActiveTab()}
          </div>
        )}
      </div>
    </div>
  );
} 