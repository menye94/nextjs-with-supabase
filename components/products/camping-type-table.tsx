"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal, Plus, Search } from "lucide-react";

interface CampingTypeTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface CampingType {
  id: number;
  name: string;
  is_active: boolean;
}

export function CampingTypeTable({ searchQuery, onSearchChange }: CampingTypeTableProps) {
  const [campingTypes, setCampingTypes] = useState<CampingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampingType, setEditingCampingType] = useState<CampingType | null>(null);
  const [campingTypeName, setCampingTypeName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCampingTypes();
  }, []);



  const fetchCampingTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('camping_type')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching camping types:', error);
        return;
      }

      setCampingTypes(data || []);
    } catch (error) {
      console.error('Error fetching camping types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCampingType(null);
    setCampingTypeName("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (campingType: CampingType) => {
    setEditingCampingType(campingType);
    setCampingTypeName(campingType.name);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (campingType: CampingType) => {
    try {
      const { error } = await supabase
        .from('camping_type')
        .delete()
        .eq('id', campingType.id);

      if (error) {
        console.error('Error deleting camping type:', error);
        return;
      }

      fetchCampingTypes();
    } catch (error) {
      console.error('Error deleting camping type:', error);
    }
  };

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    fetchCampingTypes();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampingType(null);
    setCampingTypeName("");
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!campingTypeName.trim()) {
      setFormError("Camping type name is required");
      setFormLoading(false);
      return;
    }

    // Check for duplicates
    const existingCampingType = campingTypes.find(
      type => type.name.toLowerCase() === campingTypeName.toLowerCase() && 
      (!editingCampingType || type.id !== editingCampingType.id)
    );

    if (existingCampingType) {
      setFormError("A camping type with this name already exists");
      setFormLoading(false);
      return;
    }

    try {
      if (editingCampingType) {
        // Update existing camping type
        const { error } = await supabase
          .from('camping_type')
          .update({ 
            name: campingTypeName.trim(),
            is_active: true
          })
          .eq('id', editingCampingType.id);

        if (error) {
          console.error('Error updating camping type:', error);
          setFormError('Error updating camping type');
          return;
        }
      } else {
        // Create new camping type
        const { error } = await supabase
          .from('camping_type')
          .insert({ 
            name: campingTypeName.trim(),
            is_active: true
          });

        if (error) {
          console.error('Error creating camping type:', error);
          setFormError('Error creating camping type');
          return;
        }
      }

      handleAddSuccess();
    } catch (error) {
      console.error('Error saving camping type:', error);
      setFormError('Error saving camping type');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Type Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (value: any, row: CampingType) => (
        <span className="text-gray-500">
          Camping type for {row.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
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
      render: (value: any, row: CampingType) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {openMenuId === row.id && (
            <div className="absolute right-0 top-8 z-50 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="py-1">
                <button
                  onClick={() => {
                    handleEdit(row);
                    setOpenMenuId(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete(row);
                    setOpenMenuId(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading camping types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search camping types..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64 text-gray-900"
            />
          </div>
        </div>
        <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]">
          <Plus className="h-4 w-4 mr-2" />
          Add New Camping Type
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={campingTypes}
        searchQuery={searchQuery}
        title="Camping Types"
        description="Manage different types of camping options"
        searchFields={['name']}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCampingType ? "Edit Camping Type" : "Add New Camping Type"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="campingTypeName" className="block text-sm font-medium text-gray-700 mb-2">
              Camping Type Name
            </label>
            <Input
              id="campingTypeName"
              type="text"
              value={campingTypeName}
              onChange={(e) => setCampingTypeName(e.target.value)}
              placeholder="Enter camping type name"
              className="text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
              required
            />
          </div>

          {formError && (
            <div className="text-red-600 text-sm">{formError}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formLoading}
              className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]"
            >
              {formLoading ? "Saving..." : editingCampingType ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 