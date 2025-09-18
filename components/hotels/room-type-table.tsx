"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AddRoomForm } from "@/components/hotels/add-room-form";
import { MoreHorizontal, AlertTriangle, Plus, Download, Search, Filter, Bed, ChevronUp, ChevronDown, Check, Loader2 } from "lucide-react";

interface RoomTypeTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface Room {
  id: number;
  owner_id: string;
  room_name: string;
  room_description: string | null;
  is_active: boolean;
  created_at: string;
}

export function RoomTypeTable({ searchQuery, onSearchChange }: RoomTypeTableProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchRooms();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_name');

      if (error) {
        console.error('Error fetching rooms:', error);
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'room_name',
      label: 'Room Name',
      sortable: true,
      render: (value: string, row: Room) => (
        <div className="flex items-center">
          <Bed className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'room_description',
      label: 'Description',
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
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: Room) => (
        <div className="relative" ref={(el) => { menuRefs.current[row.id] = el; }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
          
          {openMenuId === row.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                {row.is_active ? (
                  <button
                    onClick={() => handleDeactivate(row)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(row)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleAddNew = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (room: Room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleActivate = async (room: Room) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: true })
        .eq('id', room.id);

      if (error) {
        console.error('Error activating room:', error);
        return;
      }

      fetchRooms();
    } catch (error) {
      console.error('Error activating room:', error);
    }
  };

  const handleDeactivate = async (room: Room) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', room.id);

      if (error) {
        console.error('Error deactivating room:', error);
        return;
      }

      fetchRooms();
    } catch (error) {
      console.error('Error deactivating room:', error);
    }
  };

  const performDelete = async (room: Room) => {
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);

      if (error) {
        console.error('Error deleting room:', error);
        return;
      }

      fetchRooms();
      setShowDeleteModal(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error('Error deleting room:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddSuccess = () => {
    fetchRooms();
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      let updateData = {};
      
      switch (action) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'delete':
          // For delete, we'll handle each one individually
          for (const id of selectedIds) {
            await supabase.from('rooms').delete().eq('id', parseInt(id));
          }
          fetchRooms();
          return;
        default:
          return;
      }

      const { error } = await supabase
        .from('rooms')
        .update(updateData)
        .in('id', selectedIds);

      if (error) {
        console.error(`Error performing bulk ${action}:`, error);
        return;
      }

      fetchRooms();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  return (
    <>
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Room Types</h2>
            <p className="text-sm text-gray-500 mt-1">Manage room types and their configurations</p>
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
              placeholder="Search for room types..."
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                }
              }}
              className="pl-10 w-96 bg-white text-gray-900 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] placeholder-gray-500"
            />
          </div>

          {/* Filters Button */}
          <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading room types...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the room type data.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rooms}
          searchQuery={searchQuery}
          searchFields={['room_name', 'room_description']}
          onBulkAction={handleBulkAction}
          bulkActions={[
            { label: 'Activate', value: 'activate' },
            { label: 'Deactivate', value: 'deactivate' },
            { label: 'Delete', value: 'delete' },
          ]}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <AddRoomForm
          onClose={handleCloseModal}
          onSuccess={handleAddSuccess}
          editRoom={editingRoom || undefined}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Room Type"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Delete Room Type</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{roomToDelete.room_name}"? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => performDelete(roomToDelete)}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Room Type'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Empty State */}
      {rooms.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Bed className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No room types found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No room types match your search for "${searchQuery}". Try adjusting your search terms.`
              : "Get started by adding your first room type to the system."
            }
          </p>
          <div className="mt-6">
            <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
      )}
    </>
  );
} 