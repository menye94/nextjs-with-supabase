"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, AlertTriangle, Plus, Download, Search, Filter, DollarSign, Loader2 } from "lucide-react";

interface HotelRatesOptionsTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface HotelRatesOption {
  id: number;
  option_name: string;
}

export function HotelRatesOptionsTable({ searchQuery, onSearchChange }: HotelRatesOptionsTableProps) {
  const [ratesOptions, setRatesOptions] = useState<HotelRatesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRatesOption, setEditingRatesOption] = useState<HotelRatesOption | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ratesOptionToDelete, setRatesOptionToDelete] = useState<HotelRatesOption | null>(null);
  
  // Form states
  const [optionName, setOptionName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchRatesOptions();
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

  const fetchRatesOptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotel_rates_option')
        .select('*')
        .order('option_name');

      if (error) {
        console.error('Error fetching rates options:', error);
        return;
      }

      setRatesOptions(data || []);
    } catch (error) {
      console.error('Error fetching rates options:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'option_name',
      label: 'Rate Option Name',
      sortable: true,
      render: (value: string, row: HotelRatesOption) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: HotelRatesOption) => (
        <div className="relative" ref={(el) => { menuRefs.current[row.id] = el; }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
          
          {openMenuId === row.id && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
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
    setEditingRatesOption(null);
    setOptionName("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (ratesOption: HotelRatesOption) => {
    setEditingRatesOption(ratesOption);
    setOptionName(ratesOption.option_name);
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (ratesOption: HotelRatesOption) => {
    setRatesOptionToDelete(ratesOption);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const performDelete = async (ratesOption: HotelRatesOption) => {
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('hotel_rates_option')
        .delete()
        .eq('id', ratesOption.id);

      if (error) {
        console.error('Error deleting rates option:', error);
        return;
      }

      fetchRatesOptions();
      setShowDeleteModal(false);
      setRatesOptionToDelete(null);
    } catch (error) {
      console.error('Error deleting rates option:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!optionName.trim()) {
      setFormError("Rate option name is required");
      setFormLoading(false);
      return;
    }

    try {
      const ratesOptionData = {
        option_name: optionName.trim(),
      };

      let result;
      if (editingRatesOption) {
        // Update existing rates option
        result = await supabase
          .from('hotel_rates_option')
          .update(ratesOptionData)
          .eq('id', editingRatesOption.id)
          .select();
      } else {
        // Create new rates option
        result = await supabase
          .from('hotel_rates_option')
          .insert(ratesOptionData)
          .select();
      }

      if (result.error) {
        console.error('Error saving rates option:', result.error);
        
        if (result.error.code === '23505') {
          setFormError('A rates option with this name already exists.');
        } else {
          setFormError(`Error saving rates option: ${result.error.message}`);
        }
      } else {
        console.log('Rates option saved successfully:', result.data);
        fetchRatesOptions();
        setIsModalOpen(false);
        setEditingRatesOption(null);
      }
    } catch (error) {
      console.error('Error saving rates option:', error);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRatesOption(null);
    setOptionName("");
    setFormError("");
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      if (action === 'delete') {
        for (const id of selectedIds) {
          await supabase.from('hotel_rates_option').delete().eq('id', parseInt(id));
        }
        fetchRatesOptions();
      }
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
            <h2 className="text-lg font-semibold text-gray-900">Hotel Rates Options</h2>
            <p className="text-sm text-gray-500 mt-1">Manage hotel rates options and their configurations</p>
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
              placeholder="Search for rates options..."
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading rates options...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the rates options data.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={ratesOptions}
          searchQuery={searchQuery}
          searchFields={['option_name']}
          onBulkAction={handleBulkAction}
          bulkActions={[
            { label: 'Delete', value: 'delete' },
          ]}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRatesOption ? 'Edit Hotel Rates Option' : 'Add New Hotel Rates Option'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rate Option Name */}
              <div>
                <Label htmlFor="optionName" className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Option Name *
                </Label>
                <Input
                  id="optionName"
                  type="text"
                  value={optionName}
                  onChange={(e) => setOptionName(e.target.value)}
                  placeholder="Enter rate option name (e.g., Standard Rate, Early Bird, Last Minute)"
                  className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading || !!formError}
                  className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : (editingRatesOption ? 'Update Rates Option' : 'Add Rates Option')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ratesOptionToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Hotel Rates Option"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Delete Hotel Rates Option</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{ratesOptionToDelete.option_name}"? This action cannot be undone.
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
                onClick={() => performDelete(ratesOptionToDelete)}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Rates Option'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Empty State */}
      {ratesOptions.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rates options found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No rates options match your search for "${searchQuery}". Try adjusting your search terms.`
              : "Get started by adding your first hotel rates option to the system."
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