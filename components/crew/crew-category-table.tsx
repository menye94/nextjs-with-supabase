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
import { MoreHorizontal, AlertTriangle, Plus, Download, Search, Filter, Users, Loader2 } from "lucide-react";

interface CrewCategoryTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface CrewCategory {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export function CrewCategoryTable({ searchQuery, onSearchChange }: CrewCategoryTableProps) {
  const [categories, setCategories] = useState<CrewCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CrewCategory | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CrewCategory | null>(null);
  
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
        .from('crew_category')
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
      render: (value: string, row: CrewCategory) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value: string, row: CrewCategory) => (
        <span className="text-gray-600">{row.description || 'No description'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: CrewCategory) => (
        <div className="relative" ref={(el) => { 
          if (el) {
            menuRefs.current[row.id] = el;
          }
        }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <MoreHorizontal className="h-4 w-4" />
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
                <button
                  onClick={() => handleDelete(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

  const handleEdit = (category: CrewCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (category: CrewCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setFormError("Category name is required");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      if (editingCategory) {
        // Update existing category
        const updateData: any = { 
          name: categoryName.trim(),
          updated_at: new Date().toISOString()
        };
        
        if (categoryDescription.trim()) {
          updateData.description = categoryDescription.trim();
        }
        
        const { error } = await supabase
          .from('crew_category')
          .update(updateData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create new category
        const insertData: any = { 
          name: categoryName.trim()
        };
        
        if (categoryDescription.trim()) {
          insertData.description = categoryDescription.trim();
        }
        
        const { error } = await supabase
          .from('crew_category')
          .insert(insertData);

        if (error) throw error;
      }

      // Reset form and close modal
      resetForm();
      setIsModalOpen(false);
      
      // Refresh data
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      setFormError("Failed to save category. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('crew_category')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert("Failed to delete category. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setEditingCategory(null);
    setFormError("");
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Crew Categories</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage crew member categories and classifications
          </p>
        </div>
        <Button onClick={openCreateModal} className="btn-pri">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredCategories}
        columns={columns}
        searchQuery={searchQuery}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Crew Category" : "Add Crew Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Pilot, Flight Attendant"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="categoryDescription">Description</Label>
            <Textarea
              id="categoryDescription"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Optional description for this category"
              rows={3}
            />
          </div>

          {formError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {formError}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-pri" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingCategory ? "Update Category" : "Create Category"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Crew Category"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently delete the category "{categoryToDelete?.name}". 
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
