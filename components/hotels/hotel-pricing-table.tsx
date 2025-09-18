"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Search, Filter, Loader2, ChevronDown, Check, X, Building2, Bed, Calendar } from "lucide-react";

interface HotelPricingTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface Hotel {
  id: number;
  hotel_name: string;
}

interface RoomType {
  id: number;
  room_name: string;
}

interface Season {
  id: number;
  season_name: string;
}

interface HotelPricing {
  id: number;
  hotel_id: number;
  room_type_ids: number[];
  season_id: number;
  price: number;
  hotel?: Hotel;
  room_types?: RoomType[];
  season?: Season;
}

export function HotelPricingTable({ searchQuery, onSearchChange }: HotelPricingTableProps) {
  const [pricing, setPricing] = useState<HotelPricing[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<HotelPricing | null>(null);
  
  // Form states
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<number[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Multi-select dropdown states
  const [roomTypeDropdownOpen, setRoomTypeDropdownOpen] = useState(false);
  const [roomTypeSearchQuery, setRoomTypeSearchQuery] = useState("");
  
  const roomTypeDropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  // Close room type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roomTypeDropdownRef.current && !roomTypeDropdownRef.current.contains(event.target as Node)) {
        setRoomTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch hotels
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('id, hotel_name')
        .order('hotel_name');

      if (hotelsError) {
        console.error('Error fetching hotels:', hotelsError);
      } else {
        setHotels(hotelsData || []);
      }

      // Fetch room types
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('rooms')
        .select('id, room_name')
        .order('room_name');

      if (roomTypesError) {
        console.error('Error fetching room types:', roomTypesError);
      } else {
        setRoomTypes(roomTypesData || []);
      }

      // Fetch seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('hotels_seasons')
        .select('id, season_name')
        .order('season_name');

      if (seasonsError) {
        console.error('Error fetching seasons:', seasonsError);
      } else {
        setSeasons(seasonsData || []);
      }

      // Fetch pricing data
      const { data: pricingData, error: pricingError } = await supabase
        .from('hotel_rates')
        .select(`
          id,
          hotel_id,
          hotel_room_id,
          hotel_season_id,
          price,
          hotels(id, hotel_name),
          rooms(id, room_name),
          hotels_seasons(id, season_name)
        `)
        .order('created_at', { ascending: false });

      if (pricingError) {
        console.error('Error fetching pricing:', pricingError);
      } else {
        // Transform data to match our interface
        const transformedData = pricingData?.map(item => ({
          id: item.id,
          hotel_id: item.hotel_id,
          room_type_ids: [item.hotel_room_id], // Convert to array for multi-select
          season_id: item.hotel_season_id,
          price: item.price,
          hotel: Array.isArray(item.hotels) ? item.hotels[0] as Hotel : item.hotels as Hotel,
          room_types: item.rooms ? (Array.isArray(item.rooms) ? [item.rooms[0] as RoomType] : [item.rooms as RoomType]) : [],
          season: Array.isArray(item.hotels_seasons) ? item.hotels_seasons[0] as Season : item.hotels_seasons as Season
        })) || [];
        
        setPricing(transformedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter room types based on search query
  const filteredRoomTypes = roomTypes.filter(roomType =>
    roomType.room_name.toLowerCase().includes(roomTypeSearchQuery.toLowerCase())
  );

  // Handle room type selection/deselection
  const handleRoomTypeToggle = (roomTypeId: number) => {
    setSelectedRoomTypeIds(prev => {
      if (prev.includes(roomTypeId)) {
        return prev.filter(id => id !== roomTypeId);
      } else {
        return [...prev, roomTypeId];
      }
    });
  };

  // Handle room type removal
  const handleRoomTypeRemove = (roomTypeId: number) => {
    setSelectedRoomTypeIds(prev => prev.filter(id => id !== roomTypeId));
  };

  // Get selected room type names
  const getSelectedRoomTypeNames = () => {
    return roomTypes
      .filter(roomType => selectedRoomTypeIds.includes(roomType.id))
      .map(roomType => roomType.room_name);
  };

  const handleAddNew = () => {
    setEditingPricing(null);
    setSelectedHotelId("");
    setSelectedRoomTypeIds([]);
    setSelectedSeasonId("");
    setPrice("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHotelId || selectedRoomTypeIds.length === 0 || !selectedSeasonId || !price) {
      setFormError("Please fill in all fields");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setFormError("Please enter a valid price");
      return;
    }

    try {
      setFormLoading(true);
      setFormError("");

      // Create pricing entries for each selected room type
      const pricingEntries = selectedRoomTypeIds.map(roomTypeId => ({
        hotel_id: parseInt(selectedHotelId),
        hotel_room_id: roomTypeId,
        hotel_season_id: parseInt(selectedSeasonId),
        price: priceValue
      }));

      const { error } = await supabase
        .from('hotel_rates')
        .insert(pricingEntries);

      if (error) {
        console.error('Error creating pricing:', error);
        setFormError("Error creating pricing");
        return;
      }

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving pricing:', error);
      setFormError("Error saving pricing");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPricing(null);
    setSelectedHotelId("");
    setSelectedRoomTypeIds([]);
    setSelectedSeasonId("");
    setPrice("");
    setFormError("");
    setRoomTypeSearchQuery("");
    setRoomTypeDropdownOpen(false);
  };

  const columns = [
    {
      key: 'hotel',
      label: 'Hotel',
      sortable: true,
      render: (value: any, row: HotelPricing) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{row.hotel?.hotel_name || 'Unknown Hotel'}</span>
        </div>
      ),
    },
    {
      key: 'room_types',
      label: 'Room Types',
      sortable: true,
      render: (value: any, row: HotelPricing) => (
        <div className="flex flex-wrap gap-1">
          {row.room_types?.map((roomType, index) => (
            <Badge key={roomType.id} variant="secondary" className="text-xs">
              <Bed className="h-3 w-3 mr-1" />
              {roomType.room_name}
            </Badge>
          )) || <span className="text-gray-500">No room types</span>}
        </div>
      ),
    },
    {
      key: 'season',
      label: 'Season',
      sortable: true,
      render: (value: any, row: HotelPricing) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-900">{row.season?.season_name || 'Unknown Season'}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-green-600">${value?.toFixed(2)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: () => <span>Actions</span>,
    },
  ];

  // Filter pricing based on search query
  const filteredPricing = pricing.filter(item =>
    item.hotel?.hotel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.room_types?.some(rt => rt.room_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.season?.season_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Loading hotel pricing...</h3>
        <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the pricing data.</p>
      </div>
    );
  }

  return (
    <>
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Hotel Pricing</h2>
            <p className="text-sm text-gray-500 mt-1">Manage hotel pricing and their configurations</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search for pricing..."
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                }
              }}
              className="pl-10 w-96 text-gray-900 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
            />
          </div>

          {/* Filters Button */}
          <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredPricing}
        searchQuery={searchQuery}
        searchFields={['hotel', 'room_types', 'season']}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPricing ? "Edit Hotel Pricing" : "Add New Hotel Pricing"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hotel Selection */}
          <div>
            <Label htmlFor="hotel">Hotel *</Label>
            <select
              id="hotel"
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
              required
            >
              <option value="">Select a hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.hotel_name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Types Multi-Select */}
          <div>
            <Label htmlFor="room-types">Room Types *</Label>
            <div className="relative mt-1">
              <div
                className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white"
                onClick={() => setRoomTypeDropdownOpen(!roomTypeDropdownOpen)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1 min-h-6">
                    {selectedRoomTypeIds.length > 0 ? (
                      getSelectedRoomTypeNames().map((name, index) => (
                        <Badge key={`room-type-${name}-${index}`} variant="secondary" className="text-xs">
                          {name}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const roomType = roomTypes.find(rt => rt.room_name === name);
                              if (roomType) handleRoomTypeRemove(roomType.id);
                            }}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">Select room types</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {roomTypeDropdownOpen && (
                <div
                  ref={roomTypeDropdownRef}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  <div className="p-2">
                    <Input
                      placeholder="Search room types..."
                      value={roomTypeSearchQuery}
                      onChange={(e) => setRoomTypeSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  <div className="py-1">
                    {filteredRoomTypes.map((roomType) => (
                      <button
                        key={roomType.id}
                        type="button"
                        onClick={() => handleRoomTypeToggle(roomType.id)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedRoomTypeIds.includes(roomType.id)}
                            onChange={() => {}} // Handled by onClick
                            className="mr-3 h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300 rounded"
                          />
                          <Bed className="h-4 w-4 text-gray-400 mr-2" />
                          {roomType.room_name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Season Selection */}
          <div>
            <Label htmlFor="season">Season *</Label>
            <select
              id="season"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
              required
            >
              <option value="">Select a season</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.season_name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Input */}
          <div>
            <Label htmlFor="price">Price *</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
              />
            </div>
          </div>

          {formError && (
            <div className="text-red-600 text-sm">{formError}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPricing ? "Update Pricing" : "Add Pricing"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
} 