"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddRoomFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editRoom?: {
    id: number;
    room_name: string;
    room_description: string | null;
    is_active: boolean;
  };
}

export function AddRoomForm({ onClose, onSuccess, editRoom }: AddRoomFormProps) {
  const [roomName, setRoomName] = useState(editRoom?.room_name || "");
  const [roomDescription, setRoomDescription] = useState(editRoom?.room_description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState<string | null>(null);
  
  const supabase = createClient();

  // Get current user's company ID
  const getCurrentUserCompanyId = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user:', userError);
        return;
      }

      // Get user's company ID from companies table
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (companyError) {
        console.error('Error getting user company:', companyError);
        return;
      }

      setCurrentUserCompanyId(company.id);
    } catch (error) {
      console.error('Error getting current user company ID:', error);
    }
  };

  useEffect(() => {
    getCurrentUserCompanyId();
  }, []);

  // Check for duplicate room names when room name changes
  useEffect(() => {
    if (roomName.trim() && !editRoom) {
      checkRoomNameExists(roomName.trim());
    } else {
      setWarning("");
    }
  }, [roomName, editRoom]);

  const checkRoomNameExists = async (name: string) => {
    try {
      const { data, error } = await supabase
        .rpc('check_room_name_exists', { room_name_input: name });

      if (error) {
        console.error('Error checking room name:', error);
        // Provide a more user-friendly error message
        if (error.code === '42883') {
          console.error('Function check_room_name_exists does not exist. Please run the database migration.');
          setError("Database function not found. Please contact support.");
        } else if (error.code === '42P01') {
          console.error('Table rooms does not exist. Please run the database migration.');
          setError("Database table not found. Please contact support.");
        } else {
          setError(`Error checking room name: ${error.message}`);
        }
        return;
      }

      if (data && data[0]) {
        const { exists_in_company, message } = data[0];
        
        if (exists_in_company) {
          setError(message);
        } else {
          setWarning(message);
          setError("");
        }
      }
    } catch (error) {
      console.error('Error checking room name:', error);
      setError("An unexpected error occurred while checking room name availability.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setWarning("");

    if (!roomName.trim()) {
      setError("Room name is required");
      setLoading(false);
      return;
    }

    if (!currentUserCompanyId) {
      setError("Unable to determine your company. Please try logging out and back in.");
      setLoading(false);
      return;
    }

    try {
      const roomData = {
        room_name: roomName.trim(),
        room_description: roomDescription.trim() || null,
        is_active: true, // Always active by default
        owner_id: currentUserCompanyId,
      };

      console.log('Submitting room data:', roomData);

      let result;
      if (editRoom) {
        // Update existing room
        result = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', editRoom.id)
          .select();
      } else {
        // Create new room
        result = await supabase
          .from('rooms')
          .insert(roomData)
          .select();
      }

      if (result.error) {
        console.error('Error saving room:', result.error);
        
        // Handle specific database errors
        if (result.error.code === '23505') {
          setError('A room with this name already exists in your company.');
        } else if (result.error.code === '23503') {
          setError('Invalid reference. Please check your data.');
        } else {
          setError(`Error saving room: ${result.error.message}`);
        }
      } else {
        console.log('Room saved successfully:', result.data);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving room:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editRoom ? 'Edit Room Type' : 'Add New Room Type'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {warning && !error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 text-sm">{warning}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name */}
          <div>
            <Label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
              Room Name *
            </Label>
            <Input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name (e.g., Standard Room, Deluxe Suite)"
              className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
              required
            />
          </div>

          {/* Room Description */}
          <div>
            <Label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </Label>
            <Textarea
              id="roomDescription"
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="Enter room description (optional)"
              rows={3}
              className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
            />
          </div>



          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !!error}
              className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editRoom ? 'Update Room Type' : 'Add Room Type')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 