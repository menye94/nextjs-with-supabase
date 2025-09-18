"use client";

import { useState, useEffect } from "react";

interface LazyLoaderProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
  className?: string;
}

export function LazyLoader({ 
  children, 
  delay = 300, 
  fallback,
  className = "" 
}: LazyLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible) {
      const loadTimer = setTimeout(() => {
        setHasLoaded(true);
      }, 100);
      return () => clearTimeout(loadTimer);
    }
  }, [isVisible]);

  if (!isVisible) {
    return fallback || <DefaultFallback className={className} />;
  }

  if (!hasLoaded) {
    return fallback || <DefaultFallback className={className} />;
  }

  return <>{children}</>;
}

function DefaultFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search and filters skeleton */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              {/* Table header skeleton */}
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              
              {/* Table rows skeleton */}
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized fallback for different table types
export function ParksTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">National Parks</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search and filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-64"></div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              
              {[...Array(6)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EntryTypeTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Entry Types</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search and filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Summary stats */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SeasonsTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Seasons</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Park Categories</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampingTypeTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Camping Types</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParkPricingTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Park Pricing</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search and filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampingPriceTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Camping Pricing</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search and filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgeGroupsTableFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Age Groups</h2>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
