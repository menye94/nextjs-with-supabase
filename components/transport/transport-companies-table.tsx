'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Button } from '@/components/ui/button';

interface TransportCompany {
  id: number;
  city_id: number;
  type_id: number;
  name: string;
  description: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  company_name: string;
}

interface City {
  id: number;
  name: string;
}

interface TransportType {
  id: number;
  name: string;
}

interface TransportCompaniesTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TransportCompaniesTable({ searchQuery = '', onSearchChange }: TransportCompaniesTableProps) {
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [transportTypes, setTransportTypes] = useState<TransportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<TransportCompany | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filterCompany, setFilterCompany] = useState<string>('');

  const [formData, setFormData] = useState({
    city_id: 0,
    type_id: 0,
    name: '',
    description: '',
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transport companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;

      // Fetch companies for dropdown
      const { data: ownerCompaniesData, error: ownerCompaniesError } = await supabase
        .from('companies')
        .select('id, company_name')
        .order('company_name');

      if (ownerCompaniesError) throw ownerCompaniesError;

      // Fetch cities for dropdown
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('id, name')
        .order('name');

      if (citiesError) throw citiesError;

      // Fetch transport types for dropdown
      const { data: typesData, error: typesError } = await supabase
        .from('transport_type')
        .select('id, name')
        .order('name');

      if (typesError) throw typesError;

      setTransportCompanies(companiesData || []);
      setCompanies(ownerCompaniesData || []);
      setCities(citiesData || []);
      setTransportTypes(typesData || []);
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

      if (editingCompany) {
        // Update existing transport company
        const { error } = await supabase
          .from('transport_companies')
          .update({
            city_id: formData.city_id,
            type_id: formData.type_id,
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCompany.id);

        if (error) throw error;
      } else {
        // Create new transport company
        const { error } = await supabase
          .from('transport_companies')
          .insert({
            city_id: formData.city_id,
            type_id: formData.type_id,
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
            owner_id: userCompany.id,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingCompany(null);
      setFormData({ city_id: 0, type_id: 0, name: '', description: '', is_active: true });
      fetchData();
    } catch (error) {
      console.error('Error saving transport company:', error);
      alert('Error saving transport company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (company: TransportCompany) => {
    setEditingCompany(company);
    setFormData({
      city_id: company.city_id,
      type_id: company.type_id,
      name: company.name,
      description: company.description || '',
      is_active: company.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transport company?')) return;

    try {
      const { error } = await supabase
        .from('transport_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting transport company:', error);
      alert('Error deleting transport company. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingCompany(null);
    setFormData({ city_id: 0, type_id: 0, name: '', description: '', is_active: true });
    setShowModal(true);
  };

  const filteredCompanies = transportCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = !filterCompany || company.owner_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: any, row: TransportCompany) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (value: any, row: TransportCompany) => {
        const city = cities.find(c => c.id === row.city_id);
        return <span className="text-gray-600">{city?.name || 'Unknown City'}</span>;
      },
    },
    {
      key: 'type',
      label: 'Transport Type',
      render: (value: any, row: TransportCompany) => {
        const type = transportTypes.find(t => t.id === row.type_id);
        return <span className="text-gray-600">{type?.name || 'Unknown Type'}</span>;
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: any, row: TransportCompany) => (
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
      key: 'owner_company',
      label: 'Owner Company',
      render: (value: any, row: TransportCompany) => {
        const company = companies.find(c => c.id === row.owner_id);
        return <span className="text-gray-600">{company?.company_name || 'Unknown Company'}</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: TransportCompany) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: TransportCompany) => (
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
        <h2 className="text-2xl font-bold text-gray-900">Transport Companies</h2>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Transport Company
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transport companies..."
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
        data={filteredCompanies}
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
              {editingCompany ? 'Edit Transport Company' : 'Add Transport Company'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <SearchableDropdown
                  id="city"
                  label="Select city"
                  options={cities.map(city => ({ id: city.id, value: city.id, label: city.name }))}
                  value={String(formData.city_id || 0)}
                  onChange={(value) => setFormData({ ...formData, city_id: parseInt(value) || 0 })}
                  placeholder="Select city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Type
                </label>
                <SearchableDropdown
                  id="transport-type"
                  label="Select transport type"
                  options={transportTypes.map(type => ({ id: type.id, value: type.id, label: type.name }))}
                  value={String(formData.type_id || 0)}
                  onChange={(value) => setFormData({ ...formData, type_id: parseInt(value) || 0 })}
                  placeholder="Select transport type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
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
                      {editingCompany ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCompany ? 'Update Transport Company' : 'Add Transport Company'
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