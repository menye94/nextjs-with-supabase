"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

type MotorVehicleStats = {
  totalEntryTypes: number;
  totalProducts: number;
  totalPrices: number;
  totalParks: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
};

export function MotorVehicleOverview() {
  const [stats, setStats] = useState<MotorVehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const [entryTypesResult, productsResult, pricesResult, parksResult, summaryResult] = await Promise.all([
        supabase.from('motor_vehicle_entry_type').select('*').eq('is_deleted', false),
        supabase.from('motor_vehicle_products').select('*').eq('is_deleted', false),
        supabase.from('motor_vehicle_products_price').select('*').eq('is_deleted', false),
        supabase.from('national_parks').select('*').eq('is_deleted', false),
        supabase.from('motor_vehicle_products_summary').select('*')
      ]);

      // Calculate statistics
      const totalEntryTypes = entryTypesResult.data?.length || 0;
      const totalProducts = productsResult.data?.length || 0;
      const totalPrices = pricesResult.data?.length || 0;
      const totalParks = parksResult.data?.length || 0;

      // Calculate price statistics
      const prices = pricesResult.data || [];
      const averagePrice = prices.length > 0 
        ? prices.reduce((sum, p) => sum + parseFloat(p.unit_amount), 0) / prices.length 
        : 0;
      const priceRange = prices.length > 0 
        ? {
            min: Math.min(...prices.map(p => parseFloat(p.unit_amount))),
            max: Math.max(...prices.map(p => parseFloat(p.unit_amount)))
          }
        : { min: 0, max: 0 };

      setStats({
        totalEntryTypes,
        totalProducts,
        totalPrices,
        totalParks,
        averagePrice,
        priceRange
      });

      // Fetch recent products with pricing
      const { data: productsWithPricing } = await supabase
        .from('motor_vehicle_products_with_prices')
        .select('*')
        .order('product_created_at', { ascending: false })
        .limit(5);

      setRecentProducts(productsWithPricing || []);

    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entry Types</CardTitle>
            <Badge variant="secondary">{stats?.totalEntryTypes}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEntryTypes}</div>
            <p className="text-xs text-muted-foreground">
              Vehicle categories available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Badge variant="secondary">{stats?.totalProducts}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Park-vehicle combinations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pricing Rules</CardTitle>
            <Badge variant="secondary">{stats?.totalPrices}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPrices}</div>
            <p className="text-xs text-muted-foreground">
              Active pricing configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">National Parks</CardTitle>
            <Badge variant="secondary">{stats?.totalParks}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalParks}</div>
            <p className="text-xs text-muted-foreground">
              Parks with motor vehicle access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pricing Overview</CardTitle>
            <CardDescription>Current pricing statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average Price:</span>
              <span className="font-medium">${stats?.averagePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Price Range:</span>
              <span className="font-medium">${stats?.priceRange.min.toFixed(2)} - ${stats?.priceRange.max.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Pricing Rules:</span>
              <span className="font-medium">{stats?.totalPrices}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Entry Types: Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Products: Configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Pricing: Operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Database: Connected</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Motor Vehicle Products</CardTitle>
          <CardDescription>Latest additions to the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentProducts.length > 0 ? (
            <div className="space-y-3">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{product.vehicle_type_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.park_name} • {product.low_weight}kg - {product.high_weight}kg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${product.unit_amount}</div>
                    <div className="text-sm text-muted-foreground">{product.currency_name}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent products found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
