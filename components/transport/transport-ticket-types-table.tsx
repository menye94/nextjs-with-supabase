'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Button } from '@/components/ui/button';

interface TransportTicketType {
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

interface TransportTicketTypesTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TransportTicketTypesTable({ searchQuery = '', onSearchChange }: TransportTicketTypesTableProps) {
  const [ticketTypes, setTicketTypes] = useState<TransportTicketType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<TransportTicketType | null>(null);
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
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User authentication error:', userError);
        throw userError;
      }
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }
      
      console.log('Authenticated user:', user.id);
      
      // Check if user has a company
      const { data: userCompany, error: companyError } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('owner_id', user.id)
        .single();

      if (companyError) {
        console.error('Error fetching user company:', companyError);
        throw new Error('No company found for this user. Please contact your administrator.');
      }

      if (!userCompany) {
        throw new Error('No company found for this user. Please contact your administrator.');
      }

      console.log('User company:', userCompany);
      
      // Fetch transport ticket types for the user's company
      const { data: typesData, error: typesError } = await supabase
        .from('transport_ticket_type')
        .select('*')
        .eq('owner_id', userCompany.id)
        .order('name');

      if (typesError) {
        console.error('Error fetching transport ticket types:', typesError);
        throw typesError;
      }

      setTicketTypes(typesData || []);
      setCompanies([userCompany]); // Only show user's company
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
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

      console.log('Creating/updating ticket type for company:', userCompany.id);

      if (editingType) {
        // Update existing ticket type
        const { error } = await supabase
          .from('transport_ticket_type')
          .update({
            name: formData.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingType.id);

        if (error) throw error;
      } else {
        // Create new ticket type
        const { error } = await supabase
          .from('transport_ticket_type')
          .insert({
            name: formData.name,
            owner_id: userCompany.id,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingType(null);
      setFormData({ name: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving ticket type:', error);
      alert('Error saving ticket type. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (type: TransportTicketType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ticket type?')) return;

    try {
      const { error } = await supabase
        .from('transport_ticket_type')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting ticket type:', error);
      alert('Error deleting ticket type. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingType(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const filteredTypes = ticketTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = !filterCompany || type.owner_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: any, row: TransportTicketType) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'owner_company',
      label: 'Owner Company',
      render: (value: any, row: TransportTicketType) => {
        const company = companies.find(c => c.id === row.owner_id);
        return <span className="text-gray-600">{company?.company_name || 'Unknown Company'}</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: TransportTicketType) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: TransportTicketType) => (
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 text-lg font-medium">Error loading data</div>
        <div className="text-gray-600 text-sm">{error}</div>
        <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Transport Ticket Types</h2>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket Type
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search ticket types..."
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
      {filteredTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-gray-600 text-lg">No ticket types found</div>
          <div className="text-gray-500 text-sm">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first ticket type'}
          </div>
          {!searchQuery && (
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First Ticket Type
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          data={filteredTypes}
          columns={columns}
          searchQuery={searchTerm}
          itemsPerPage={10}
          showPagination={true}
          showBulkSelection={false}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingType ? 'Edit Ticket Type' : 'Add Ticket Type'}
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
                      {editingType ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingType ? 'Update Ticket Type' : 'Add Ticket Type'
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