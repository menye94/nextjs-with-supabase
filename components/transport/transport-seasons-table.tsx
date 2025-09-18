'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Button } from '@/components/ui/button';

interface TransportSeason {
  id: number;
  start_date: string;
  end_date: string;
  season_name: string | null;
  transport_company_id: number;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  company_name: string;
}

interface TransportCompany {
  id: number;
  name: string;
}

interface TransportSeasonsTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TransportSeasonsTable({ searchQuery = '', onSearchChange }: TransportSeasonsTableProps) {
  const [seasons, setSeasons] = useState<TransportSeason[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<TransportSeason | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filterCompany, setFilterCompany] = useState<string>('');

  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    season_name: '',
    transport_company_id: 0,
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transport seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('transport_seasons')
        .select('*')
        .order('start_date');

      if (seasonsError) throw seasonsError;

      // Fetch companies for dropdown
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name')
        .order('company_name');

      if (companiesError) throw companiesError;

      // Fetch transport companies for dropdown
      const { data: transportCompaniesData, error: transportCompaniesError } = await supabase
        .from('transport_companies')
        .select('id, name')
        .order('name');

      if (transportCompaniesError) throw transportCompaniesError;

      setSeasons(seasonsData || []);
      setCompanies(companiesData || []);
      setTransportCompanies(transportCompaniesData || []);
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

      if (editingSeason) {
        // Update existing season
        const { error } = await supabase
          .from('transport_seasons')
          .update({
            start_date: formData.start_date,
            end_date: formData.end_date,
            season_name: formData.season_name || null,
            transport_company_id: formData.transport_company_id,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSeason.id);

        if (error) throw error;
      } else {
        // Create new season
        const { error } = await supabase
          .from('transport_seasons')
          .insert({
            start_date: formData.start_date,
            end_date: formData.end_date,
            season_name: formData.season_name || null,
            transport_company_id: formData.transport_company_id,
            is_active: formData.is_active,
            owner_id: userCompany.id,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingSeason(null);
      setFormData({ start_date: '', end_date: '', season_name: '', transport_company_id: 0, is_active: true });
      fetchData();
    } catch (error) {
      console.error('Error saving season:', error);
      alert('Error saving season. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (season: TransportSeason) => {
    setEditingSeason(season);
    setFormData({
      start_date: season.start_date.split('T')[0],
      end_date: season.end_date.split('T')[0],
      season_name: season.season_name || '',
      transport_company_id: season.transport_company_id,
      is_active: season.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this season?')) return;

    try {
      const { error } = await supabase
        .from('transport_seasons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting season:', error);
      alert('Error deleting season. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingSeason(null);
    setFormData({ start_date: '', end_date: '', season_name: '', transport_company_id: 0, is_active: true });
    setShowModal(true);
  };

  const filteredSeasons = seasons.filter(season => {
    const matchesSearch = (season.season_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = !filterCompany || season.owner_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    {
      key: 'season_name',
      label: 'Season Name',
      render: (value: any, row: TransportSeason) => (
        <span className="font-medium text-gray-900">{row.season_name || 'Unnamed Season'}</span>
      ),
    },
    {
      key: 'dates',
      label: 'Date Range',
      render: (value: any, row: TransportSeason) => (
        <span className="text-gray-600">
          {new Date(row.start_date).toLocaleDateString()} - {new Date(row.end_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'transport_company',
      label: 'Transport Company',
      render: (value: any, row: TransportSeason) => {
        const company = transportCompanies.find(c => c.id === row.transport_company_id);
        return <span className="text-gray-600">{company?.name || 'Unknown Company'}</span>;
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: any, row: TransportSeason) => (
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
      render: (value: any, row: TransportSeason) => {
        const company = companies.find(c => c.id === row.owner_id);
        return <span className="text-gray-600">{company?.company_name || 'Unknown Company'}</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: TransportSeason) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: TransportSeason) => (
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
      <div className="flex justify-center items-center h-64">
                     <Loader2 className="h-8 w-8 animate-spin text-theme-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Transport Seasons</h2>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Season
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search seasons..."
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
        data={filteredSeasons}
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
              {editingSeason ? 'Edit Season' : 'Add Season'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season Name
                </label>
                <input
                  type="text"
                  value={formData.season_name}
                  onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Company
                </label>
                <SearchableDropdown
                  id="transport-company"
                  label="Select transport company"
                  options={transportCompanies.map(comp => ({ id: comp.id, value: comp.id, label: comp.name }))}
                  value={String(formData.transport_company_id || 0)}
                  onChange={(value) => setFormData({ ...formData, transport_company_id: parseInt(value) || 0 })}
                  placeholder="Select transport company"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-theme-green focus:ring-theme-green border-gray-300 rounded"
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
                      {editingSeason ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingSeason ? 'Update Season' : 'Add Season'
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