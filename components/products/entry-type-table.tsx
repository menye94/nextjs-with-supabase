"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, X, MoreHorizontal, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EntryType {
  id: number;
  entry_name: string;
  is_active: boolean;
  is_deleted?: boolean;
}

export default function EntryTypeTable() {
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEntryType, setEditingEntryType] = useState<EntryType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; entryType: EntryType | null }>({
    isOpen: false,
    entryType: null
  });
  const [formData, setFormData] = useState({
    entry_name: "",
    is_active: true,
  });

  const supabase = createClient();

  // Fetch entry types from Supabase
  useEffect(() => {
    fetchEntryTypes();
  }, []);

  // Refetch when showInactive filter changes
  useEffect(() => {
    fetchEntryTypes();
  }, [showInactive]);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);



  const fetchEntryTypes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('entry_type')
        .select('*')
        .eq('is_deleted', false)
        .order('entry_name');

      // If showInactive is false, only show active items
      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntryTypes(data || []);
    } catch (error) {
      console.error('Error fetching entry types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEntryType) {
        // Update existing entry type
        const { error } = await supabase
          .from('entry_type')
          .update({
            entry_name: formData.entry_name,
            is_active: formData.is_active
          })
          .eq('id', editingEntryType.id);

        if (error) throw error;
      } else {
        // Create new entry type
        const { error } = await supabase
          .from('entry_type')
          .insert([{
            entry_name: formData.entry_name,
            is_active: formData.is_active
          }]);

        if (error) throw error;
      }

      // Refresh the data
      fetchEntryTypes();
      setShowModal(false);
      setEditingEntryType(null);
      setFormData({ entry_name: "", is_active: true });
    } catch (error) {
      console.error('Error saving entry type:', error);
    }
  };

  const handleEdit = (entryType: EntryType) => {
    setEditingEntryType(entryType);
    setFormData({
      entry_name: entryType.entry_name,
      is_active: entryType.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const entryType = entryTypes.find(et => et.id === id);
    if (entryType) {
      setDeleteConfirmation({ isOpen: true, entryType });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.entryType) return;
    
    try {
      // Add to deleting state
      setDeletingIds(prev => new Set(prev).add(deleteConfirmation.entryType!.id));
      
      // Soft delete by setting is_deleted to true
      const { error } = await supabase
        .from('entry_type')
        .update({ is_deleted: true })
        .eq('id', deleteConfirmation.entryType.id);

      if (error) throw error;
      
      // Show success notification
      setNotification({
        message: `Successfully deleted "${deleteConfirmation.entryType.entry_name}"`,
        type: 'success'
      });
      
      // Refresh the data
      fetchEntryTypes();
      setDeleteConfirmation({ isOpen: false, entryType: null });
    } catch (error) {
      console.error('Error deleting entry type:', error);
      
      // Show error notification
      setNotification({
        message: `Failed to delete "${deleteConfirmation.entryType.entry_name}"`,
        type: 'error'
      });
    } finally {
      // Remove from deleting state
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deleteConfirmation.entryType!.id);
        return newSet;
      });
    }
  };

  const handleToggleStatus = async (entryType: EntryType) => {
    const newStatus = !entryType.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} "${entryType.entry_name}"?`)) return;
    
    try {
      // Add to toggling state
      setTogglingIds(prev => new Set(prev).add(entryType.id));
      
      const { error } = await supabase
        .from('entry_type')
        .update({ is_active: newStatus })
        .eq('id', entryType.id);

      if (error) throw error;
      
      // Show success notification
      setNotification({
        message: `Successfully ${action}d "${entryType.entry_name}"`,
        type: 'success'
      });
      
      // Refresh the data
      fetchEntryTypes();
    } catch (error) {
      console.error(`Error ${action}ing entry type:`, error);
      
      // Show error notification
      setNotification({
        message: `Failed to ${action} "${entryType.entry_name}"`,
        type: 'error'
      });
    } finally {
      // Remove from toggling state
      setTogglingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryType.id);
        return newSet;
      });
    }
  };

  const handleAddNew = () => {
    setEditingEntryType(null);
    setFormData({ entry_name: "", is_active: true });
    setShowModal(true);
  };

  const filteredEntryTypes = entryTypes.filter(entryType => 
    entryType.entry_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'entry_name',
      label: 'Name',
      render: (value: any, row: EntryType) => (
        <span className="font-medium text-gray-900">{row.entry_name}</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: any, row: EntryType) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: EntryType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => handleEdit(row)}
              className="cursor-pointer text-theme-green hover:text-theme-green-dark focus:text-theme-green-dark"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => handleToggleStatus(row)}
              disabled={togglingIds.has(row.id)}
              className={`cursor-pointer ${
                row.is_active 
                  ? 'text-orange-600 hover:text-orange-700 focus:text-orange-700' 
                  : 'text-green-600 hover:text-green-700 focus:text-green-700'
              } ${togglingIds.has(row.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {togglingIds.has(row.id) ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : row.is_active ? (
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
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading entry types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Entry Types</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry Type
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4 items-center bg-white">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search entry types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className={`${
              showInactive 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'border-orange-300 text-orange-600 hover:bg-orange-50'
            }`}
          >
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex space-x-4">
          <span>Total: {entryTypes.length}</span>
          <span className="text-green-600">Active: {entryTypes.filter(et => et.is_active).length}</span>
          {showInactive && (
            <span className="text-red-600">Inactive: {entryTypes.filter(et => !et.is_active).length}</span>
          )}
        </div>
        <div className="text-gray-500">
          {showInactive ? 'Showing all entry types' : 'Showing active entry types only'}
        </div>
      </div>

      {/* Entry Types Table */}
      <DataTable
        data={filteredEntryTypes}
        columns={columns}
        searchQuery={searchTerm}
        searchFields={['entry_name']}
        showBulkSelection={false}
        itemsPerPage={10}
        showPagination={true}
      />

      {/* Tailwind CSS Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-all duration-300 ease-in-out backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all w-full max-w-md border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingEntryType ? 'Edit Entry Type' : 'Add New Entry Type'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:ring-offset-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="entry_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Type Name *
                  </Label>
                  <Input
                    id="entry_name"
                    value={formData.entry_name}
                    onChange={(e) => setFormData({ ...formData, entry_name: e.target.value })}
                    placeholder="Enter entry type name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200 hover:border-gray-400"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-5 w-5 text-[var(--theme-green)] focus:ring-2 focus:ring-[var(--theme-green)] focus:ring-offset-2 border-gray-300 rounded-lg transition-all duration-200 hover:border-gray-400"
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active
                  </Label>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-green)] transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="px-6 py-3 bg-[var(--theme-green)] text-white rounded-xl text-sm font-medium hover:bg-[var(--theme-green-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-green)] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingEntryType ? 'Update Entry Type' : 'Add Entry Type'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-all duration-300 ease-in-out backdrop-blur-sm"
            onClick={() => setDeleteConfirmation({ isOpen: false, entryType: null })}
          ></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all w-full max-w-md border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <h3 className="text-lg font-semibold text-red-900">
                  Confirm Delete
                </h3>
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, entryType: null })}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      Delete Entry Type
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirmation.entryType?.entry_name}"</span>?
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      This action cannot be undone. The entry type will be permanently removed.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteConfirmation({ isOpen: false, entryType: null })}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleteConfirmation.entryType ? deletingIds.has(deleteConfirmation.entryType.id) : false}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteConfirmation.entryType && deletingIds.has(deleteConfirmation.entryType.id) ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Entry Type'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 