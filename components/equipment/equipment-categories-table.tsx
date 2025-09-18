'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { capitalizeWords } from '@/lib/utils/string-utils';

interface EquipmentCategory {
  id: number;
  name: string;
  is_active: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  owner_company_name?: string;
}

interface Company {
  id: string;
  name: string;
}

export default function EquipmentCategoriesTable() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, []);

    const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Fetch categories with company owner information
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('equipment_categories')
        .select(`
          *,
          owner_company:companies!fk_equipment_categories_company_owner(company_name)
        `)
        .order('created_at', { ascending: false });

      if (categoriesError) {
        console.error('Supabase error:', categoriesError);
        throw categoriesError;
      }

      // Transform the data to flatten the owner information and ensure all required fields exist
      const transformedData = (categoriesData || []).map(category => ({
        id: category.id || 0,
        name: category.name || '',
        is_active: category.is_active ?? true,
        owner_id: category.owner_id || null,
        created_at: category.created_at || new Date().toISOString(),
        updated_at: category.updated_at || new Date().toISOString(),
        owner_company_name: category.owner_company?.company_name || 'System'
      }));

      console.log('Transformed categories data:', transformedData);
      setCategories(transformedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (category: EquipmentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('equipment_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      // Get current user and their company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's company UUID
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (companyError) throw companyError;
      if (!company?.id) throw new Error('User not associated with a company');

      const categoryData = {
        name: formData.name.trim(),
        is_active: formData.is_active,
        owner_id: company.id
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('equipment_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment_categories')
          .insert(categoryData);

        if (error) throw error;
      }

      setShowModal(false);
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      render: (value: any, row: EquipmentCategory) => (
        <div className="font-medium">{capitalizeWords(row?.name || '')}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any, row: EquipmentCategory) => (
        <Badge variant={row?.is_active ? 'default' : 'destructive'}>
          {row?.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'owner',
      label: 'Owner Company',
      render: (value: any, row: EquipmentCategory) => (
        <div className="text-sm text-gray-600">{row?.owner_company_name || 'System'}</div>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: EquipmentCategory) => (
        <div className="text-sm text-gray-600">
          {row?.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: EquipmentCategory) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(row?.id || 0)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading categories...</div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-6 bg-white">
        <div className="flex justify-between items-center bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Equipment Categories</h2>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">No categories found. Add your first category to get started.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Categories</h2>
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
         searchFields={['name']}
         showBulkSelection={false}
         itemsPerPage={10}
         showPagination={true}
       />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 