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
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { capitalizeWords } from '@/lib/utils/string-utils';

interface EquipmentCompany {
  id: number;
  name: string;
  city_id: number;
  owner_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  city_name?: string;
  owner_company_name?: string;
}

interface City {
  id: number;
  city_name: string;
}

interface OwnerCompany {
  id: string;
  company_name: string;
}

export default function EquipmentCompaniesTable() {
  const [companies, setCompanies] = useState<EquipmentCompany[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [ownerCompanies, setOwnerCompanies] = useState<OwnerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<EquipmentCompany | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city_id: 0
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment companies with related data
      const { data: companiesData, error: companiesError } = await supabase
        .from('equipment_company')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Transform the data to flatten the related information
      const transformedData = companiesData?.map(company => ({
        ...company,
        city_name: 'Loading...', // Will be updated after fetching cities
        owner_company_name: 'Loading...' // Will be updated after fetching companies
      })) || [];

      // Fetch cities for dropdown
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('id, city_name')
        .order('city_name');

      if (citiesError) throw citiesError;

             // Fetch owner companies for dropdown (not needed since we removed owner company column)
       // const { data: ownerCompaniesData, error: ownerCompaniesError } = await supabase
       //   .from('companies')
       //   .select('id, company_name')
       //   .order('company_name');

             // if (ownerCompaniesError) throw ownerCompaniesError;

             // Update the transformed data with actual city names
       const finalTransformedData = transformedData.map(company => {
         const city = citiesData?.find(c => c.id === company.city_id);
         
         return {
           ...company,
           city_name: city?.city_name || 'Unknown City',
           owner_company_name: 'System' // Default value since we don't display this anymore
         };
       });

       setCompanies(finalTransformedData);
       setCities(citiesData || []);
       setOwnerCompanies([]); // Empty array since we don't need this anymore
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      city_id: 0
    });
    setShowModal(true);
  };

  const handleEdit = (company: EquipmentCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      city_id: Number(company.city_id) // Ensure it's a number
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment company?')) return;

    try {
      const { error } = await supabase
        .from('equipment_company')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error deleting equipment company:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.city_id) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

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

      const companyData = {
        name: formData.name.trim(),
        city_id: formData.city_id,
        owner_id: company.id,
        is_active: true
      };

      if (editingCompany) {
        const { error } = await supabase
          .from('equipment_company')
          .update(companyData)
          .eq('id', editingCompany.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment_company')
          .insert(companyData);

        if (error) throw error;
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving equipment company:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Company Name',
      render: (value: any, row: EquipmentCompany) => (
        <div className="font-medium">{capitalizeWords(row.name)}</div>
      )
    },
    {
      key: 'city',
      label: 'City',
      render: (value: any, row: EquipmentCompany) => (
        <div>{capitalizeWords(row.city_name || 'N/A')}</div>
      )
    },

    {
      key: 'status',
      label: 'Status',
      render: (value: any, row: EquipmentCompany) => (
        <Badge variant={row.is_active ? 'default' : 'destructive'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: EquipmentCompany) => (
        <div className="text-sm text-gray-600">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: EquipmentCompany) => (
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
            onClick={() => handleDelete(row.id)}
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
        <div className="text-lg">Loading equipment companies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Companies</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center bg-white">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                         <Input
               placeholder="Search companies or cities..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 bg-white border-gray-300 text-gray-900"
             />
          </div>
        </div>
      </div>

      {/* Companies Table */}
             <DataTable
         data={filteredCompanies}
         columns={columns}
         searchQuery={searchTerm}
         searchFields={['name', 'city_name']}
         showBulkSelection={false}
         itemsPerPage={10}
         showPagination={true}
       />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCompany ? 'Edit Equipment Company' : 'Add New Equipment Company'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
              required
            />
          </div>

          <div>
            <Label htmlFor="city">City *</Label>
                         <SearchableDropdown
               id="city"
               label="City"
               options={cities.map(city => ({ id: city.id, value: city.id, label: city.city_name }))}
               value={String(formData.city_id || 0)}
               onChange={(value) => setFormData({ ...formData, city_id: Number(value) || 0 })}
               placeholder="Select city"
             />
          </div>

          

                     <div className="flex justify-end gap-2 pt-4">
             <Button
               type="button"
               variant="outline"
               onClick={() => setShowModal(false)}
               disabled={submitting}
             >
               Cancel
             </Button>
             <Button type="submit" disabled={submitting}>
               {submitting ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   {editingCompany ? 'Updating...' : 'Creating...'}
                 </>
               ) : (
                 editingCompany ? 'Update Company' : 'Add Company'
               )}
             </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
} 