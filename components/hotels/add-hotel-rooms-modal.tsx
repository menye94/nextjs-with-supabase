"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Bed, Loader2 } from "lucide-react";

interface AddHotelRoomsModalProps {
  hotelId: number;
  hotelName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface RoomType {
  id: number;
  room_name: string;
  room_description: string | null;
  is_active: boolean;
}

interface HotelRoom {
  id: number;
  room_id: number;
  room: RoomType;
  is_available: boolean;
}

export function AddHotelRoomsModal({ hotelId, hotelName, onClose, onSuccess }: AddHotelRoomsModalProps) {
  const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [existingRooms, setExistingRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [hotelId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available room types (not already assigned to this hotel)
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('room_name');

      if (roomsError) throw roomsError;

      // Fetch existing hotel rooms
      const { data: hotelRooms, error: hotelRoomsError } = await supabase
        .from('hotel_rooms')
        .select(`
          id,
          room_id,
          is_available,
          room:rooms(*)
        `)
        .eq('hotel_id', hotelId);

      if (hotelRoomsError) throw hotelRoomsError;

      setAvailableRooms(rooms || []);
      setExistingRooms(hotelRooms || []);
      
      // Pre-select rooms that are already assigned
      const existingRoomIds = (hotelRooms || []).map(hr => hr.room_id);
      setSelectedRooms(existingRoomIds);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = availableRooms.filter(room =>
    room.room_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRoomSelection = (roomId: number) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get current user's company ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (!company) throw new Error('Company not found');

      // Remove rooms that are no longer selected
      const roomsToRemove = existingRooms
        .filter(hr => !selectedRooms.includes(hr.room_id))
        .map(hr => hr.id);

      if (roomsToRemove.length > 0) {
        await supabase
          .from('hotel_rooms')
          .delete()
          .in('id', roomsToRemove);
      }

      // Add new room assignments
      const newRooms = selectedRooms.filter(roomId => 
        !existingRooms.some(hr => hr.room_id === roomId)
      );

      if (newRooms.length > 0) {
        const newAssignments = newRooms.map(roomId => ({
          hotel_id: hotelId,
          room_id: roomId,
          owner_id: company.id,
          is_available: true
        }));

        await supabase
          .from('hotel_rooms')
          .insert(newAssignments);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving hotel rooms:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-green)] mx-auto" />
          <p className="mt-4 text-gray-600">Loading room types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Hotel Rooms</h2>
            <p className="text-sm text-gray-500 mt-1">{hotelName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search room types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
            />
          </div>
        </div>

        {/* Room Selection */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredRooms.map((room) => {
              const isSelected = selectedRooms.includes(room.id);
              const isExisting = existingRooms.some(hr => hr.room_id === room.id);
              
              return (
                <div 
                  key={room.id} 
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRoomSelection(room.id)}
                    className="h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{room.room_name}</span>
                    </div>
                    {room.room_description && (
                      <p className="text-sm text-gray-600 mt-1">{room.room_description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={room.is_active ? "default" : "secondary"}>
                      {room.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {isExisting && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Assigned
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-8">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No room types match your search.' : 'No room types available.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedRooms.length} room type{selectedRooms.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 