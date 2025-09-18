"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddHotelRoomsModal } from "@/components/hotels/add-hotel-rooms-modal";
import { Building2, Bed, Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { capitalizeWords } from "@/lib/utils/string-utils";

interface HotelRoomsTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface Hotel {
  id: number;
  hotel_name: string;
  location_id: number;
  category_id: number;
  is_partner: boolean;
  is_active: boolean;
  contact_email: string | null;
  hotel_website: string | null;
  location?: { 
    city?: { city_name: string };
    national_park?: { national_park_name: string };
  };
  category?: { name: string };
  hotel_rooms?: HotelRoom[];
}

interface HotelRoom {
  id: number;
  hotel_id: number;
  room_id: number;
  is_available: boolean;
  room: RoomType;
}

interface RoomType {
  id: number;
  room_name: string;
  room_description: string | null;
  is_active: boolean;
}

export function HotelRoomsTable({ searchQuery, onSearchChange }: HotelRoomsTableProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchHotelsWithRooms();
  }, []);

  const fetchHotelsWithRooms = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('hotels')
        .select(`
          *,
          location:locations(
            city:cities(city_name),
            national_park:national_parks(national_park_name)
          ),
          category:hotel_category(name),
          hotel_rooms(
            id,
            room_id,
            is_available,
            room:rooms(*)
          )
        `)
        .is('is_deleted', null)
        .order('hotel_name');

      if (error) {
        console.error('Error fetching hotels with rooms:', error);
        return;
      }

      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels with rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocationDisplayName = (hotel: Hotel) => {
    if (!hotel.location) return 'Unknown Location';
    
    const cityName = hotel.location.city?.city_name || '';
    const parkName = hotel.location.national_park?.national_park_name || '';
    
    if (cityName && parkName) {
      return `${cityName} - ${parkName}`;
    }
    return cityName || parkName || 'Unknown Location';
  };

  const getRoomsDisplay = (hotel: Hotel) => {
    if (!hotel.hotel_rooms || hotel.hotel_rooms.length === 0) {
      return (
        <div className="text-gray-500 text-sm">
          No rooms assigned
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {hotel.hotel_rooms.slice(0, 3).map((hotelRoom) => (
          <div key={hotelRoom.id} className="flex items-center">
            <Bed className="h-3 w-3 text-gray-400 mr-1" />
            <span className="text-sm text-gray-900">
              {hotelRoom.room.room_name}
            </span>
            {!hotelRoom.is_available && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Unavailable
              </Badge>
            )}
          </div>
        ))}
        {hotel.hotel_rooms.length > 3 && (
          <div className="text-xs text-gray-500">
            +{hotel.hotel_rooms.length - 3} more rooms
          </div>
        )}
      </div>
    );
  };

  const columns = [
    {
      key: 'hotel_name',
      label: 'Hotel Name',
      sortable: true,
      render: (value: string, row: Hotel) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{capitalizeWords(value)}</span>
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
      key: 'rooms',
      label: 'Assigned Rooms',
      sortable: false,
      render: (value: any, row: Hotel) => getRoomsDisplay(row),
    },
    {
      key: 'room_count',
      label: 'Room Count',
      sortable: true,
      render: (value: any, row: Hotel) => (
        <Badge variant="outline" className="text-gray-700">
          {row.hotel_rooms?.length || 0} rooms
        </Badge>
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
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleManageRooms(row)}
            size="sm"
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <Bed className="h-3 w-3 mr-1" />
            Manage Rooms
          </Button>
        </div>
      ),
    },
  ];

  const handleManageRooms = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setShowRoomsModal(true);
  };

  const handleCloseRoomsModal = () => {
    setShowRoomsModal(false);
    setSelectedHotel(null);
  };

  const handleRoomsSuccess = () => {
    fetchHotelsWithRooms(); // Refresh the data
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Loading hotel rooms...</h3>
        <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the hotel room data.</p>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Hotel Rooms</h2>
            <p className="text-sm text-gray-500 mt-1">View and manage room assignments for hotels</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={hotels}
        searchQuery={searchQuery}
        searchFields={['hotel_name', 'category.name']}
      />

      {/* Empty State */}
      {hotels.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hotels found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No hotels match your search for "${searchQuery}". Try adjusting your search terms.`
              : "No hotels available. Add some hotels first to manage their rooms."
            }
          </p>
        </div>
      )}

      {/* Manage Rooms Modal */}
      {showRoomsModal && selectedHotel && (
        <AddHotelRoomsModal
          hotelId={selectedHotel.id}
          hotelName={capitalizeWords(selectedHotel.hotel_name)}
          onClose={handleCloseRoomsModal}
          onSuccess={handleRoomsSuccess}
        />
      )}
    </>
  );
} 