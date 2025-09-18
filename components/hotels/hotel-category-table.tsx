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
import { MoreHorizontal, AlertTriangle, Plus, Download, Search, Filter, Building2, Loader2 } from "lucide-react";

interface HotelCategoryTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface HotelCategory {
  id: number;
  name: string;
}

export function HotelCategoryTable({ searchQuery, onSearchChange }: HotelCategoryTableProps) {
  const [categories, setCategories] = useState<HotelCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HotelCategory | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<HotelCategory | null>(null);
  
  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (value: string, row: HotelCategory) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: HotelCategory) => (
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
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (category: HotelCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription("");
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (category: HotelCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const performDelete = async (category: HotelCategory) => {
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('hotel_category')
        .delete()
        .eq('id', category.id);

      if (error) {
        console.error('Error deleting category:', error);
        return;
      }

      fetchCategories();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!categoryName.trim()) {
      setFormError("Category name is required");
      setFormLoading(false);
      return;
    }

    try {
      const categoryData = {
        name: categoryName.trim(),
      };

      let result;
      if (editingCategory) {
        // Update existing category
        result = await supabase
          .from('hotel_category')
          .update(categoryData)
          .eq('id', editingCategory.id)
          .select();
      } else {
        // Create new category
        result = await supabase
          .from('hotel_category')
          .insert(categoryData)
          .select();
      }

      if (result.error) {
        console.error('Error saving category:', result.error);
        
        if (result.error.code === '23505') {
          setFormError('A category with this name already exists.');
        } else {
          setFormError(`Error saving category: ${result.error.message}`);
        }
      } else {
        console.log('Category saved successfully:', result.data);
        fetchCategories();
        setIsModalOpen(false);
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setFormError("");
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      if (action === 'delete') {
        for (const id of selectedIds) {
          await supabase.from('hotel_category').delete().eq('id', parseInt(id));
        }
        fetchCategories();
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
            <h2 className="text-lg font-semibold text-gray-900">Hotel Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Manage hotel categories and their configurations</p>
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
              placeholder="Search for categories..."
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading categories...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the category data.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          searchQuery={searchQuery}
          searchFields={['name']}
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
                {editingCategory ? 'Edit Hotel Category' : 'Add New Hotel Category'}
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
              {/* Category Name */}
              <div>
                <Label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </Label>
                <Input
                  id="categoryName"
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name (e.g., Luxury, Budget, Business)"
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
                  {formLoading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Hotel Category"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Delete Hotel Category</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{categoryToDelete.name}"? This action cannot be undone.
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
                onClick={() => performDelete(categoryToDelete)}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Category'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Empty State */}
      {categories.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No categories match your search for "${searchQuery}". Try adjusting your search terms.`
              : "Get started by adding your first hotel category to the system."
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