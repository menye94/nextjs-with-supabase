"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AddHotelForm } from "@/components/hotels/add-hotel-form";
import { AddHotelRoomsModal } from "@/components/hotels/add-hotel-rooms-modal";
import { MoreHorizontal, AlertTriangle, Plus, Download, Search, Filter, Building2, ChevronUp, ChevronDown, Check, Loader2, Bed } from "lucide-react";

interface HotelsTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface Hotel {
  id: number;
  hotel_name: string;
  owner_id: string;
  location_id: number;
  category_id: number;
  camping_type_id?: number;
  is_partner: boolean;
  is_active: boolean;
  contact_email: string | null;
  hotel_website: string | null;
  is_deleted: string | null;
  owner?: { company_name: string };
  location?: { 
    city?: { city_name: string };
    national_park?: { national_park_name: string };
  };
  category?: { name: string };
  camping_type?: { name: string };
}

interface Location {
  id: number;
  city_id: number;
  national_park_id: number;
  city?: { city_name: string };
  national_park?: { national_park_name: string };
}

interface HotelCategory {
  id: number;
  name: string;
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function HotelsTable({ searchQuery, onSearchChange }: HotelsTableProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<HotelCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Filter dropdown states
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<HotelCategory[]>([]);
  
  // New states for archive functionality
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [hotelToArchive, setHotelToArchive] = useState<Hotel | null>(null);
  const [linkedProductsCount, setLinkedProductsCount] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Room management states
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState<Hotel | null>(null);
  
  // Performance optimizations
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoize filtered data to prevent unnecessary re-renders
  const filteredHotels = useMemo(() => {
    if (!debouncedSearchQuery) return hotels;
    
    return hotels.filter(hotel => 
      hotel.hotel_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      hotel.contact_email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      hotel.location?.city?.city_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      hotel.location?.national_park?.national_park_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [hotels, debouncedSearchQuery]);

  // Optimized click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
      setLocationDropdownOpen(false);
    }
    if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
      setCategoryDropdownOpen(false);
    }
    
    // Close menus
    Object.values(menuRefs.current).forEach(ref => {
      if (ref && !ref.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    });
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Optimized data fetching with pagination
  const fetchHotels = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('hotels')
        .select(`
          *,
          location:locations(
            city:cities(city_name),
            national_park:national_parks(national_park_name)
          ),
          category:hotel_category(name),
          owner:companies(company_name),
          camping_type:camping_type(name)
        `)
        .is('is_deleted', null)
        .order('hotel_name')
        .range((pageNum - 1) * pageSize, pageNum * pageSize - 1);

      if (selectedLocation) {
        query = query.eq('location_id', parseInt(selectedLocation));
      }

      if (selectedCategory) {
        query = query.eq('category_id', parseInt(selectedCategory));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching hotels:', error);
        return;
      }

      if (reset) {
        setHotels(data || []);
        setPage(1);
      } else {
        setHotels(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data || []).length === pageSize);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, selectedCategory, pageSize, supabase]);

  // Load more data when scrolling
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHotels(nextPage, false);
    }
  }, [loading, hasMore, page, fetchHotels]);

  // Initial data loading
  useEffect(() => {
    fetchHotels(1, true);
    fetchLocations();
    fetchCategories();
  }, [fetchHotels]);

  // Refetch when filters change
  useEffect(() => {
    fetchHotels(1, true);
  }, [selectedLocation, selectedCategory, fetchHotels]);

  // Initialize filtered data when locations and categories are loaded
  useEffect(() => {
    setFilteredLocations(locations);
  }, [locations]);

  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  // Optimized location fetching
  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          city:cities(city_name),
          national_park:national_parks(national_park_name)
        `)
        .order('id');

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLocationsLoading(false);
    }
  }, [supabase]);

  // Optimized category fetching
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const { data, error } = await supabase
        .from('hotel_category')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [supabase]);

  // Memoized location display function
  const getLocationDisplayName = useCallback((hotel: Hotel) => {
    if (!hotel.location) return 'Unknown Location';
    
    const cityName = hotel.location.city?.city_name || '';
    const parkName = hotel.location.national_park?.national_park_name || '';
    
    if (cityName && parkName) {
      return `${cityName} - ${parkName}`;
    }
    return cityName || parkName || 'Unknown Location';
  }, []);

  const getLocationDisplayNameFromLocation = useCallback((location: Location) => {
    const cityName = location.city?.city_name || '';
    const parkName = location.national_park?.national_park_name || '';
    
    if (cityName && parkName) {
      return `${cityName} - ${parkName}`;
    }
    return cityName || parkName || `Location ${location.id}`;
  }, []);

  // Memoized columns to prevent unnecessary re-renders
  const columns = useMemo(() => [
    {
      key: 'hotel_name',
      label: 'Hotel Name',
      sortable: true,
      render: (value: string, row: Hotel) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value: any, row: Hotel) => (
        <span className="text-gray-900">{getLocationDisplayName(row)}</span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: any, row: Hotel) => (
        <span className="text-gray-900">{row.category?.name || 'Unknown Category'}</span>
      ),
    },
    {
      key: 'camping_type',
      label: 'Camping Type',
      sortable: true,
      render: (value: any, row: Hotel) => (
        <span className="text-gray-900">{row.camping_type?.name || '-'}</span>
      ),
    },
    {
      key: 'contact_email',
      label: 'Contact Email',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900">{value || '-'}</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: Hotel) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleManageRooms(row)}
          >
            <Bed className="h-4 w-4 mr-1" />
            Rooms
          </Button>
          <div className="relative" ref={(el) => { menuRefs.current[row.id] = el; }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {openMenuId === row.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleActivate(row)}
                  >
                    Activate
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleDeactivate(row)}
                  >
                    Deactivate
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => handleDelete(row)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ], [getLocationDisplayName, openMenuId]);

  // Optimized event handlers
  const handleAddNew = useCallback(() => {
    setEditingHotel(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((hotel: Hotel) => {
    setEditingHotel(hotel);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (hotel: Hotel) => {
    setHotelToArchive(hotel);
    setShowArchiveModal(true);
  }, []);

  const handleActivate = useCallback(async (hotel: Hotel) => {
    try {
      const { error } = await supabase
        .from('hotels')
        .update({ is_active: true })
        .eq('id', hotel.id);

      if (error) {
        console.error('Error activating hotel:', error);
        return;
      }

      setHotels(prev => prev.map(h => 
        h.id === hotel.id ? { ...h, is_active: true } : h
      ));
    } catch (error) {
      console.error('Error activating hotel:', error);
    }
  }, [supabase]);

  const handleDeactivate = useCallback(async (hotel: Hotel) => {
    try {
      const { error } = await supabase
        .from('hotels')
        .update({ is_active: false })
        .eq('id', hotel.id);

      if (error) {
        console.error('Error deactivating hotel:', error);
        return;
      }

      setHotels(prev => prev.map(h => 
        h.id === hotel.id ? { ...h, is_active: false } : h
      ));
    } catch (error) {
      console.error('Error deactivating hotel:', error);
    }
  }, [supabase]);

  const performDelete = useCallback(async (hotel: Hotel) => {
    try {
      const { error } = await supabase
        .from('hotels')
        .update({ is_deleted: new Date().toISOString() })
        .eq('id', hotel.id);

      if (error) {
        console.error('Error deleting hotel:', error);
        return;
      }

      setHotels(prev => prev.filter(h => h.id !== hotel.id));
      setShowArchiveModal(false);
      setHotelToArchive(null);
    } catch (error) {
      console.error('Error deleting hotel:', error);
    }
  }, [supabase]);

  const handleArchive = useCallback(async () => {
    if (!hotelToArchive) return;
    
    setArchiveLoading(true);
    await performDelete(hotelToArchive);
    setArchiveLoading(false);
  }, [hotelToArchive, performDelete]);

  const handleCloseArchiveModal = useCallback(() => {
    setShowArchiveModal(false);
    setHotelToArchive(null);
  }, []);

  const handleLocationFilterChange = useCallback((locationId: string) => {
    setSelectedLocation(locationId);
    setLocationDropdownOpen(false);
  }, []);

  const handleCategoryFilterChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setCategoryDropdownOpen(false);
  }, []);

  const fetchHotelsWithFilters = useCallback(async (locationId: string, categoryId: string) => {
    try {
      setFilterLoading(true);
      
      let query = supabase
        .from('hotels')
        .select(`
          *,
          location:locations(
            city:cities(city_name),
            national_park:national_parks(national_park_name)
          ),
          category:hotel_category(name),
          owner:companies(company_name),
          camping_type:camping_type(name)
        `)
        .is('is_deleted', null)
        .order('hotel_name');

      if (locationId) {
        query = query.eq('location_id', parseInt(locationId));
      }

      if (categoryId) {
        query = query.eq('category_id', parseInt(categoryId));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching hotels with filters:', error);
        return;
      }

      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels with filters:', error);
    } finally {
      setFilterLoading(false);
    }
  }, [supabase]);

  const handleLocationSearch = useCallback((searchTerm: string) => {
    const filtered = locations.filter(location =>
      getLocationDisplayNameFromLocation(location)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [locations, getLocationDisplayNameFromLocation]);

  const handleCategorySearch = useCallback((searchTerm: string) => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories]);

  const handleAddSuccess = useCallback(() => {
    setIsModalOpen(false);
    fetchHotels(1, true);
  }, [fetchHotels]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingHotel(null);
  }, []);

  const handleManageRooms = useCallback((hotel: Hotel) => {
    setSelectedHotelForRooms(hotel);
    setShowRoomsModal(true);
  }, []);

  const handleCloseRoomsModal = useCallback(() => {
    setShowRoomsModal(false);
    setSelectedHotelForRooms(null);
  }, []);

  const handleRoomsSuccess = useCallback(() => {
    setShowRoomsModal(false);
    setSelectedHotelForRooms(null);
  }, []);

  const handleBulkAction = useCallback(async (action: string, selectedIds: string[]) => {
    // Implementation for bulk actions
    console.log('Bulk action:', action, selectedIds);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Hotels</h2>
          <p className="text-sm text-gray-500">Manage your hotel products and configurations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hotel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative" ref={locationDropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
            className="min-w-[200px] justify-between"
          >
            {selectedLocation ? 
              getLocationDisplayNameFromLocation(locations.find(l => l.id === parseInt(selectedLocation))!) :
              'All Locations'
            }
            {locationDropdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {locationDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search locations..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  onChange={(e) => handleLocationSearch(e.target.value)}
                />
              </div>
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLocationFilterChange("")}
                >
                  All Locations
                </button>
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleLocationFilterChange(location.id.toString())}
                  >
                    {getLocationDisplayNameFromLocation(location)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={categoryDropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="min-w-[200px] justify-between"
          >
            {selectedCategory ? 
              categories.find(c => c.id === parseInt(selectedCategory))?.name :
              'All Categories'
            }
            {categoryDropdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {categoryDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search categories..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  onChange={(e) => handleCategorySearch(e.target.value)}
                />
              </div>
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleCategoryFilterChange("")}
                >
                  All Categories
                </button>
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleCategoryFilterChange(category.id.toString())}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredHotels}
        columns={columns}
        searchQuery={searchQuery}
        searchFields={['hotel_name', 'contact_email']}
        onBulkAction={handleBulkAction}
        bulkActions={[
          { label: 'Activate', value: 'activate' },
          { label: 'Deactivate', value: 'deactivate' },
          { label: 'Delete', value: 'delete' },
        ]}
      />

      {/* Modals */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingHotel ? "Edit Hotel" : "Add New Hotel"}
        >
          <AddHotelForm
            editHotel={editingHotel || undefined}
            onSuccess={handleAddSuccess}
            onClose={handleCloseModal}
          />
        </Modal>
      )}

      {showRoomsModal && selectedHotelForRooms && (
        <AddHotelRoomsModal
          hotelId={selectedHotelForRooms.id}
          hotelName={selectedHotelForRooms.hotel_name}
          onClose={handleCloseRoomsModal}
          onSuccess={handleRoomsSuccess}
        />
      )}

      {showArchiveModal && hotelToArchive && (
        <Modal
          isOpen={showArchiveModal}
          onClose={handleCloseArchiveModal}
          title="Archive Hotel"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Archive Hotel</h3>
                <p className="text-sm text-yellow-700">
                  Are you sure you want to archive "{hotelToArchive.hotel_name}"? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseArchiveModal}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleArchive}
                disabled={archiveLoading}
              >
                {archiveLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Archive Hotel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 