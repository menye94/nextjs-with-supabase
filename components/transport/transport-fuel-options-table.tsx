'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Button } from '@/components/ui/button';

interface TransportFuelOption {
  id: number;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  company_name: string;
}

interface TransportFuelOptionsTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TransportFuelOptionsTable({ searchQuery = '', onSearchChange }: TransportFuelOptionsTableProps) {
  const [fuelOptions, setFuelOptions] = useState<TransportFuelOption[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState<TransportFuelOption | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filterCompany, setFilterCompany] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transport fuel options
      const { data: optionsData, error: optionsError } = await supabase
        .from('transport_fuel_option')
        .select('*')
        .order('name');

      if (optionsError) throw optionsError;

      // Fetch companies for dropdown
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name')
        .order('company_name');

      if (companiesError) throw companiesError;

      setFuelOptions(optionsData || []);
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user's company ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!userCompany) throw new Error('Company not found');

      if (editingOption) {
        // Update existing fuel option
        const { error } = await supabase
          .from('transport_fuel_option')
          .update({
            name: formData.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingOption.id);

        if (error) throw error;
      } else {
        // Create new fuel option
        const { error } = await supabase
          .from('transport_fuel_option')
          .insert({
            name: formData.name,
            owner_id: userCompany.id,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingOption(null);
      setFormData({ name: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving fuel option:', error);
      alert('Error saving fuel option. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (option: TransportFuelOption) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fuel option?')) return;

    try {
      const { error } = await supabase
        .from('transport_fuel_option')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting fuel option:', error);
      alert('Error deleting fuel option. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingOption(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const filteredOptions = fuelOptions.filter(option => {
    const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = !filterCompany || option.owner_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: any, row: TransportFuelOption) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'owner_company',
      label: 'Owner Company',
      render: (value: any, row: TransportFuelOption) => {
        const company = companies.find(c => c.id === row.owner_id);
        return <span className="text-gray-600">{company?.company_name || 'Unknown Company'}</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: TransportFuelOption) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: TransportFuelOption) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-700"
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Transport Fuel Options</h2>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Fuel Option
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search fuel options..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="w-64">
                  <SearchableDropdown
          id="filter-company"
          label="Filter by company"
          options={companies.map(comp => ({ id: comp.id, value: comp.id, label: comp.company_name }))}
          value={filterCompany}
          onChange={setFilterCompany}
          placeholder="Filter by company"
        />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredOptions}
        columns={columns}
        searchQuery={searchTerm}
        itemsPerPage={10}
        showPagination={true}
        showBulkSelection={false}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingOption ? 'Edit Fuel Option' : 'Add Fuel Option'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingOption ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingOption ? 'Update Fuel Option' : 'Add Fuel Option'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 