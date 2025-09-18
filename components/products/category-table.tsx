"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: number;
  category_name: string;
  is_deleted: string | null;
}

export default function CategoryTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    category_name: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('park_category')
          .update({
            category_name: formData.category_name,
            is_active: true,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('park_category')
          .insert({
            category_name: formData.category_name,
            is_active: true,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ category_name: "" });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('park_category')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({ category_name: "", is_active: true });
    setShowModal(true);
  };

  const filteredCategories = categories.filter(category => 
    category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'category_name',
      label: 'Category Name',
      render: (value: any, row: Category) => (
        <span className="font-medium text-gray-900">
          {value.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: any, row: Category) => (
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
      render: (value: any, row: Category) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
                         className="text-theme-green hover:text-theme-green-dark"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Park Categories</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center bg-white">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <DataTable
        data={filteredCategories}
        columns={columns}
        searchQuery={searchTerm}
        searchFields={['category_name']}
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
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  <Label htmlFor="category_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </Label>
                  <Input
                    id="category_name"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    placeholder="Enter category name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200 hover:border-gray-400"
                  />
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
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 