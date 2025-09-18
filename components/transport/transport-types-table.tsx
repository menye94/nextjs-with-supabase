'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TransportType {
  id: number;
  name: string;
  is_active: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// Mock data for demonstration
const mockTransportTypes: TransportType[] = [
  {
    id: 1,
    name: 'Bus',
    is_active: true,
    owner_id: 'company-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Train',
    is_active: true,
    owner_id: 'company-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    name: 'Airplane',
    is_active: false,
    owner_id: 'company-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

interface TransportTypesTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TransportTypesTable({ searchQuery = '', onSearchChange }: TransportTypesTableProps) {
  const [transportTypes, setTransportTypes] = useState<TransportType[]>(mockTransportTypes);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<TransportType | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingType) {
      // Update existing transport type
      setTransportTypes(prev => prev.map(type => 
        type.id === editingType.id 
          ? { ...type, name: formData.name, is_active: formData.is_active }
          : type
      ));
    } else {
      // Create new transport type
      const newType: TransportType = {
        id: Math.max(...transportTypes.map(t => t.id)) + 1,
        name: formData.name,
        is_active: formData.is_active,
        owner_id: 'company-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTransportTypes(prev => [...prev, newType]);
    }

    setShowModal(false);
    setEditingType(null);
    setFormData({ name: '', is_active: true });
  };

  const handleEdit = (type: TransportType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      is_active: type.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transport type?')) return;
    setTransportTypes(prev => prev.filter(type => type.id !== id));
  };

  const handleAddNew = () => {
    setEditingType(null);
    setFormData({ name: '', is_active: true });
    setShowModal(true);
  };

  const filteredTypes = transportTypes.filter(type => 
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: any, row: TransportType) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: any, row: TransportType) => (
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
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: TransportType) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: TransportType) => (
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

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Transport Types</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transport Type
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center bg-white">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transport types..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Transport Types Table */}
      <DataTable
        data={filteredTypes}
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
        title={editingType ? 'Edit Transport Type' : 'Add New Transport Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Transport Type Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter transport type name"
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
              {editingType ? 'Update Transport Type' : 'Add Transport Type'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}