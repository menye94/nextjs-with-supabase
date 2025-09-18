"use client";

import { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoaderProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: any;
}

const defaultFallback = (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    <span className="ml-2 text-sm text-gray-500">Loading...</span>
  </div>
);

export function LazyLoader({ 
  component, 
  fallback = defaultFallback, 
  props = {} 
}: LazyLoaderProps) {
  const LazyComponent = lazy(component);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Pre-defined lazy components for common use cases
export const LazyHotelsTable = lazy(() => import('../hotels/hotels-table').then(module => ({ default: module.HotelsTable })));

// Comment out potentially problematic imports for now
// export const LazyEquipmentTable = lazy(() => import('../equipment/equipment-table').then(module => ({ default: module.EquipmentTable })));
// export const LazyTransportTable = lazy(() => import('../transport/transport-services-table').then(module => ({ default: module.TransportServicesTable })));
// export const LazyProductsTable = lazy(() => import('../products/parks-table').then(module => ({ default: module.ParksTable })));

// Lazy load modals
export const LazyAddHotelForm = lazy(() => import('../hotels/add-hotel-form').then(module => ({ default: module.AddHotelForm })));
// export const LazyAddEquipmentForm = lazy(() => import('../equipment/add-equipment-form').then(module => ({ default: module.AddEquipmentForm })));
// export const LazyAddTransportForm = lazy(() => import('../transport/add-transport-form').then(module => ({ default: module.AddTransportForm })));

// Lazy load pages
// export const LazyDashboard = lazy(() => import('../../app/dashboard/page').then(module => ({ default: module.default })));
// export const LazyHotelsPage = lazy(() => import('../../app/hotels/page').then(module => ({ default: module.default })));
// export const LazyEquipmentPage = lazy(() => import('../../app/equipment/page').then(module => ({ default: module.default })));
// export const LazyTransportPage = lazy(() => import('../../app/transport/page').then(module => ({ default: module.default })));
// export const LazyProductsPage = lazy(() => import('../../app/products/page').then(module => ({ default: module.default })));
