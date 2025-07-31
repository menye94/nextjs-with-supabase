"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal } from "lucide-react";

interface EntryTypeTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface EntryType {
  id: number;
  entry_name: string;
  is_active: boolean;
  is_deleted: string | null;
}

export function EntryTypeTable({ searchQuery, onSearchChange }: EntryTypeTableProps) {
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntryType, setEditingEntryType] = useState<EntryType | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [entryName, setEntryName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchEntryTypes();
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

  const fetchEntryTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('entry_type')
        .select('*')
        .order('entry_name');

      if (error) {
        console.error('Error fetching entry types:', error);
        return;
      }

      setEntryTypes(data || []);
    } catch (error) {
      console.error('Error fetching entry types:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'entry_name',
      label: 'Type Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (value: any, row: EntryType) => (
        <span className="text-gray-500">
          Entry type for {row.entry_name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: EntryType) => (
        <div className="relative flex justify-center" ref={(el) => menuRefs.current[row.id] = el}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-600" />
          </button>
          
          {openMenuId === row.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleDelete(row)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
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
    setEditingEntryType(null);
    setEntryName("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (entryType: EntryType) => {
    setEditingEntryType(entryType);
    setEntryName(entryType.entry_name);
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (entryType: EntryType) => {
    if (window.confirm(`Are you sure you want to delete "${entryType.entry_name}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('entry_type')
          .update({ is_deleted: new Date().toISOString() })
          .eq('id', entryType.id);

        if (error) {
          console.error('Error deleting entry type:', error);
          return;
        }

        fetchEntryTypes(); // Refresh the data
        setOpenMenuId(null);
      } catch (error) {
        console.error('Error deleting entry type:', error);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchEntryTypes(); // Refresh the data
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntryType(null);
    setEntryName("");
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!entryName.trim()) {
      setFormError("Entry type name is required");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      if (editingEntryType) {
        // Update existing entry type
        const { error } = await supabase
          .from('entry_type')
          .update({ entry_name: entryName.trim() })
          .eq('id', editingEntryType.id);

        if (error) {
          console.error('Error updating entry type:', error);
          setFormError(error.message);
          return;
        }
      } else {
        // Create new entry type
        const { error } = await supabase
          .from('entry_type')
          .insert({ entry_name: entryName.trim() });

        if (error) {
          console.error('Error creating entry type:', error);
          setFormError(error.message);
          return;
        }
      }

      handleAddSuccess();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving entry type:', error);
      setFormError('An unexpected error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading entry types...</div>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for entry types..."
                value={searchQuery}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  }
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-3">
            {/* Filters Button */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Filters
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={entryTypes}
        searchQuery={searchQuery}
        title="Entry Types"
        description="Manage different types of park entry options"
        onAddNew={handleAddNew}
        searchFields={['entry_name']}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEntryType ? "Edit Entry Type" : "Add New Entry Type"}
      >
        <div className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="entryName" className="block text-sm font-medium text-gray-700 mb-2">
                Entry Type Name
              </label>
              <input
                id="entryName"
                type="text"
                value={entryName}
                onChange={(e) => setEntryName(e.target.value)}
                placeholder="Enter entry type name"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
              />
            </div>
            
            {/* Error Message */}
            {formError && (
              <div className="text-red-600 text-sm">
                {formError}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseModal}
              disabled={formLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={formLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {formLoading ? (editingEntryType ? "Updating..." : "Adding...") : (editingEntryType ? "Update" : "Add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 