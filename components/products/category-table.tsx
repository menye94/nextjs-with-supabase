"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal } from "lucide-react";

interface CategoryTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface Category {
  id: number;
  category_name: string;
  is_active: boolean;
  is_deleted: string | null;
}

export function CategoryTable({ searchQuery, onSearchChange }: CategoryTableProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
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
      const { data, error } = await supabase
        .from('park_category')
        .select('*')
        .order('category_name');

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
      key: 'category_name',
      label: 'Category Name',
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
      render: (value: any, row: Category) => (
        <span className="text-gray-500">
          Category for {row.category_name.split(' ').map(word => 
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
      render: (value: any, row: Category) => (
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
    setEditingCategory(null);
    setCategoryName("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.category_name);
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.category_name}"? This action cannot be undone.`)) {
      try {
        // Use hard delete until database is updated with is_deleted column
        const { error } = await supabase
          .from('park_category')
          .delete()
          .eq('id', category.id);

        if (error) {
          console.error('Error deleting category:', error);
          return;
        }

        fetchCategories(); // Refresh the data
        setOpenMenuId(null);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchCategories(); // Refresh the data
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      setFormError("Category name is required");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('park_category')
          .update({ category_name: categoryName.trim() })
          .eq('id', editingCategory.id);

        if (error) {
          console.error('Error updating category:', error);
          setFormError(error.message);
          return;
        }
      } else {
        // Create new category
        const { error } = await supabase
          .from('park_category')
          .insert({ category_name: categoryName.trim() });

        if (error) {
          console.error('Error creating category:', error);
          setFormError(error.message);
          return;
        }
      }

      handleAddSuccess();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
      setFormError('An unexpected error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading categories...</div>
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
                placeholder="Search for categories..."
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
        data={categories}
        searchQuery={searchQuery}
        title="Categories"
        description="Manage park categories and classifications"
        onAddNew={handleAddNew}
        searchFields={['category_name']}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <div className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <input
                id="categoryName"
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
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
              {formLoading ? (editingCategory ? "Updating..." : "Adding...") : (editingCategory ? "Update" : "Add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 