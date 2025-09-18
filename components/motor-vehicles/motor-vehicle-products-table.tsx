"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Power, PowerOff, Edit, Trash2, MapPin, Weight } from "lucide-react";

type MotorVehicleProduct = {
  id: number;
  park_id: number;
  motor_vehicle_entry_type_id: number;
  low_weight: number;
  high_weight: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  park_name?: string;
  vehicle_type_name?: string;
};

export function MotorVehicleProductsTable() {
  const [products, setProducts] = useState<MotorVehicleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products with related data
      const { data, error } = await supabase
        .from('motor_vehicle_products')
        .select(`
          *,
          national_parks!inner(national_park_name),
          motor_vehicle_entry_type!inner(name)
        `)
        .eq('is_deleted', false)
        .order('park_id, motor_vehicle_entry_type_id');

      if (error) throw error;
      
      // Transform data to include park and vehicle type names
      const transformedData = data?.map(product => ({
        ...product,
        park_name: product.national_parks?.national_park_name,
        vehicle_type_name: product.motor_vehicle_entry_type?.name
      })) || [];
      
      setProducts(transformedData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      setTogglingIds(prev => new Set(prev).add(id));
      
      const { error } = await supabase
        .from('motor_vehicle_products')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setProducts(prev => 
        prev.map(p => 
          p.id === id ? { ...p, is_active: !currentStatus } : p
        )
      );
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setTogglingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.park_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vehicle_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.low_weight.toString().includes(searchTerm) ||
      product.high_weight.toString().includes(searchTerm);
    
    const matchesActiveFilter = showInactive ? true : product.is_active;
    return matchesSearch && matchesActiveFilter;
  });

  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;
  const uniqueParks = new Set(products.map(p => p.park_id)).size;
  const uniqueVehicleTypes = new Set(products.map(p => p.motor_vehicle_entry_type_id)).size;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4">
          <Badge variant="secondary">
            Total: {products.length}
          </Badge>
          <Badge variant="default">
            Active: {activeCount}
          </Badge>
          <Badge variant="outline">
            Inactive: {inactiveCount}
          </Badge>
          <Badge variant="secondary">
            Parks: {uniqueParks}
          </Badge>
          <Badge variant="secondary">
            Vehicle Types: {uniqueVehicleTypes}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? "Hide Inactive" : "Show Inactive"}
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Motor Vehicle Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Park</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Weight Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{product.park_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{product.vehicle_type_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span>{product.low_weight}kg - {product.high_weight}kg</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(product.id, product.is_active)}
                            disabled={togglingIds.has(product.id)}
                          >
                            {product.is_active ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                            {togglingIds.has(product.id) && "..."}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No products found matching your search." : "No products found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
