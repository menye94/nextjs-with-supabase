'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2, User, Mail, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { hasPermission } from '@/lib/rbac';
import { PermissionDeniedModal } from '@/components/ui/permission-denied-modal';

interface Customer {
  id: number;
  cus_first_name: string;
  cus_last_name: string;
  cus_address: string;
  cus_email_address: string;
  cus_details: string;
  customer_from: string;
  cus_is_active: boolean;
  owner_id: string;
  country_id: number | null;
  since: string;
}

interface Company {
  id: string;
  company_name: string;
}

interface Country {
  id: number;
  country_name: string;
}

interface CustomersTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeCompanyId?: string;
}

export function CustomersTable({ searchQuery = '', onSearchChange, activeCompanyId }: CustomersTableProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filterCompany, setFilterCompany] = useState<string>('');

  // Confirm delete/deactivate modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [customerToAct, setCustomerToAct] = useState<Customer | null>(null);
  const [permModal, setPermModal] = useState<{ open: boolean; perm?: string; msg?: string }>({ open: false });

  const [formData, setFormData] = useState({
    cus_first_name: '',
    cus_last_name: '',
    cus_address: '',
    cus_email_address: '',
    cus_details: '',
    customer_from: '',
    cus_is_active: true,
    country_id: 0,
  });

  // Searchable dropdown states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [selectedCountryName, setSelectedCountryName] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User authentication error:', userError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Resolve active company
      let companyId: string | null = activeCompanyId || null;
      if (!companyId) {
        const { data: userCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        companyId = userCompany?.id || null;
      }

      // If no company is selected/resolved, avoid querying with null
      let customersData = [] as Customer[] | null;
      let customersError: any = null;
      if (companyId) {
        const res = await supabase
          .from('customers')
          .select('*')
          .eq('owner_id', companyId)
          .order('cus_first_name');
        customersData = res.data as any;
        customersError = res.error;
      } else {
        customersData = [];
      }

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        throw customersError;
      }

             // Fetch countries for dropdown
       const { data: countriesData, error: countriesError } = await supabase
         .from('countries')
         .select('id, country_name')
         .order('country_name');

       if (countriesError) {
         console.error('Error fetching countries:', countriesError);
         console.error('Countries error details:', {
           message: countriesError.message,
           details: countriesError.details,
           hint: countriesError.hint
         });
         // Don't throw error for countries, just log it and continue with empty countries array
         console.log('Continuing without countries data');
       } else {
         console.log('Successfully fetched countries:', countriesData?.length || 0, 'countries');
       }

       setCustomers(customersData || []);
       setCompanies(companyId ? [{ id: companyId, company_name: '' }] : []);
       setCountries(countriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!userCompany) throw new Error('Company not found');

      // RBAC: ensure write permission
      const canWrite = await hasPermission('customers.write', userCompany.id);
      if (!canWrite) {
        setPermModal({ open: true, perm: 'customers.write', msg: 'You do not have permission to create or update customers.' });
        throw new Error('permission_denied');
      }

      if (editingCustomer) {
                 // Update existing customer
         const { error } = await supabase
           .from('customers')
           .update({
             cus_first_name: formData.cus_first_name,
             cus_last_name: formData.cus_last_name,
             cus_address: formData.cus_address,
             cus_email_address: formData.cus_email_address,
             cus_details: formData.cus_details,
             customer_from: formData.customer_from,
             cus_is_active: formData.cus_is_active,
             country_id: formData.country_id || null,
           })
           .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
                 // Create new customer
         const { error } = await supabase
           .from('customers')
           .insert({
             cus_first_name: formData.cus_first_name,
             cus_last_name: formData.cus_last_name,
             cus_address: formData.cus_address,
             cus_email_address: formData.cus_email_address,
             cus_details: formData.cus_details,
             customer_from: formData.customer_from,
             cus_is_active: formData.cus_is_active,
             country_id: formData.country_id || null,
             owner_id: userCompany.id,
           });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingCustomer(null);
      setFormData({
        cus_first_name: '',
        cus_last_name: '',
        cus_address: '',
        cus_email_address: '',
        cus_details: '',
        customer_from: '',
        cus_is_active: true,
        country_id: 0,
      });
      fetchData();
    } catch (error) {
      console.error('Error saving customer:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? (error as any).details : null,
        hint: error instanceof Error ? (error as any).hint : null,
        code: error instanceof Error ? (error as any).code : null
      });
      
      let errorMessage = 'Error saving customer. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'A customer with this information already exists.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid country selected. Please choose a valid country.';
        } else if (error.message.includes('not null')) {
          errorMessage = 'Please fill in all required fields.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      if (!(error instanceof Error && error.message === 'permission_denied')) {
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      cus_first_name: customer.cus_first_name || '',
      cus_last_name: customer.cus_last_name || '',
      cus_address: customer.cus_address || '',
      cus_email_address: customer.cus_email_address || '',
      cus_details: customer.cus_details || '',
      customer_from: customer.customer_from || '',
      cus_is_active: customer.cus_is_active,
      country_id: customer.country_id || 0,
    });
    
         // Set selected country name for editing
     if (customer.country_id) {
       const country = countries.find(c => c.id === customer.country_id);
       setSelectedCountryName(country?.country_name || '');
     } else {
       setSelectedCountryName('');
     }
    setCountrySearchTerm('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    // deprecated direct delete (kept for safety); use confirm modal flow instead
    setCustomerToAct(customers.find(c => c.id === id) || null);
    setShowConfirm(true);
  };

  const openConfirm = (customer: Customer) => {
    setCustomerToAct(customer);
    setShowConfirm(true);
  };

  const confirmDeactivate = async () => {
    if (!customerToAct) return;
    try {
      // Check write permission for this row's company via its owner_id
      const { data: row } = await supabase.from('customers').select('owner_id').eq('id', customerToAct.id).single();
      if (!row) throw new Error('Customer not found');
      const canWrite = await hasPermission('customers.write', row.owner_id);
      if (!canWrite) {
        setPermModal({ open: true, perm: 'customers.write', msg: 'You do not have permission to deactivate customers.' });
        throw new Error('permission_denied');
      }
      const { error } = await supabase
        .from('customers')
        .update({ cus_is_active: false })
        .eq('id', customerToAct.id);
      if (error) throw error;
      setShowConfirm(false);
      setCustomerToAct(null);
      fetchData();
    } catch (error) {
      console.error('Error deactivating customer:', error);
      if (!(error instanceof Error && error.message === 'permission_denied')) {
        alert('Error deactivating customer. Please try again.');
      }
    }
  };

  const confirmDelete = async () => {
    if (!customerToAct) return;
    try {
      const { data: row } = await supabase.from('customers').select('owner_id').eq('id', customerToAct.id).single();
      if (!row) throw new Error('Customer not found');
      const canDelete = await hasPermission('customers.delete', row.owner_id);
      if (!canDelete) {
        setPermModal({ open: true, perm: 'customers.delete', msg: 'You do not have permission to delete customers.' });
        throw new Error('permission_denied');
      }
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToAct.id);
      if (error) throw error;
      setShowConfirm(false);
      setCustomerToAct(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting customer:', error);
      if (!(error instanceof Error && error.message === 'permission_denied')) {
        alert('Error deleting customer. Please try again.');
      }
    }
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      cus_first_name: '',
      cus_last_name: '',
      cus_address: '',
      cus_email_address: '',
      cus_details: '',
      customer_from: '',
      cus_is_active: true,
      country_id: 0,
    });
    setSelectedCountryName('');
    setCountrySearchTerm('');
    setShowModal(true);
  };

  // Helper functions for searchable dropdown
  const filteredCountries = countries.filter(country =>
    country.country_name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  // Debug logging for countries
  useEffect(() => {
    console.log('Countries state updated:', countries.length, 'countries');
    if (countries.length > 0) {
      console.log('Sample countries:', countries.slice(0, 3).map(c => ({ id: c.id, country_name: c.country_name })));
    }
  }, [countries]);

  const handleCountrySelect = (country: Country) => {
    setFormData({ ...formData, country_id: country.id });
    setSelectedCountryName(country.country_name);
    setCountrySearchTerm('');
    setShowCountryDropdown(false);
  };

  const handleCountryInputChange = (value: string) => {
    setCountrySearchTerm(value);
    setSelectedCountryName('');
    setFormData({ ...formData, country_id: 0 });
    setShowCountryDropdown(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = (
      customer.cus_first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.cus_last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.cus_email_address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCompany = !filterCompany || customer.owner_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: any, row: Customer) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.cus_first_name} {row.cus_last_name}
          </div>
          <div className="text-sm text-gray-500">
            {row.cus_email_address}
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (value: any, row: Customer) => {
        const country = countries.find(c => c.id === row.country_id);
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{country?.country_name || 'No country'}</span>
          </div>
        );
      },
    },
    {
      key: 'customer_from',
      label: 'Customer Since',
      render: (value: any, row: Customer) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {row.customer_from ? new Date(row.customer_from).toLocaleDateString() : 'Not specified'}
          </span>
        </div>
      ),
    },
    {
      key: 'cus_is_active',
      label: 'Status',
      render: (value: any, row: Customer) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.cus_is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.cus_is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Customer) => (
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
            onClick={() => openConfirm(row)}
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 text-lg font-medium">Error loading data</div>
        <div className="text-gray-600 text-sm">{error}</div>
                 <Button onClick={fetchData} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-gray-600 text-lg">No customers found</div>
          <div className="text-gray-500 text-sm">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
          </div>
                     {!searchQuery && (
             <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
               <Plus className="h-4 w-4 mr-2" />
               Add First Customer
             </Button>
           )}
        </div>
      ) : (
        <DataTable
          data={filteredCustomers}
          columns={columns}
          searchQuery={searchQuery}
          itemsPerPage={10}
          showPagination={true}
          showBulkSelection={false}
        />
      )}

             {/* Modal */}
       <Modal
         isOpen={showModal}
         onClose={() => setShowModal(false)}
         title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
       >
         <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">First Name</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.cus_first_name}
                    onChange={(e) => setFormData({ ...formData, cus_first_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">Last Name</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.cus_last_name}
                    onChange={(e) => setFormData({ ...formData, cus_last_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.cus_email_address}
                  onChange={(e) => setFormData({ ...formData, cus_email_address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Address</Label>
                <Textarea
                  id="address"
                  value={formData.cus_address}
                  onChange={(e) => setFormData({ ...formData, cus_address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200 resize-none"
                  rows={3}
                  placeholder="Enter address"
                />
              </div>

              <div>
                <Label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">Details</Label>
                <Textarea
                  id="details"
                  value={formData.cus_details}
                  onChange={(e) => setFormData({ ...formData, cus_details: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200 resize-none"
                  rows={3}
                  placeholder="Enter additional details"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customer_from" className="block text-sm font-medium text-gray-700 mb-2">Customer Since</Label>
                  <Input
                    id="customer_from"
                    type="date"
                    value={formData.customer_from}
                    onChange={(e) => setFormData({ ...formData, customer_from: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                  />
                </div>
                <div className="relative country-dropdown-container">
                  <Label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={selectedCountryName || countrySearchTerm}
                      onChange={(e) => handleCountryInputChange(e.target.value)}
                      onFocus={() => setShowCountryDropdown(true)}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                      placeholder="Search and select country"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {showCountryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <div
                            key={country.id}
                            onClick={() => handleCountrySelect(country)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                          >
                            {country.country_name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          {countries.length === 0 ? 'No countries available in database' : `No countries found matching "${countrySearchTerm}"`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                      {editingCustomer ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCustomer ? 'Update Customer' : 'Add Customer'
                  )}
                </Button>
              </div>
         </form>
       </Modal>
       <PermissionDeniedModal
         isOpen={permModal.open}
         onClose={() => setPermModal({ open: false })}
         requiredPermission={permModal.perm}
         message={permModal.msg}
       />
       {/* Confirm Delete / Deactivate Modal */}
       <Modal
         isOpen={showConfirm}
         onClose={() => { setShowConfirm(false); setCustomerToAct(null); }}
         title="Confirm action"
       >
         <div className="space-y-4">
           <p className="text-gray-700">
             Are you sure you want to proceed with this customer
             {customerToAct ? ` "${customerToAct.cus_first_name} ${customerToAct.cus_last_name}"` : ''}?
           </p>
           <p className="text-sm text-gray-500">You can either deactivate the customer (recommended) or permanently delete the record.</p>

           <div className="flex justify-end gap-3 pt-2">
             <Button
               variant="outline"
               onClick={() => { setShowConfirm(false); setCustomerToAct(null); }}
             >
               Cancel
             </Button>
             <Button
               onClick={confirmDeactivate}
               className="bg-yellow-500 hover:bg-yellow-600 text-white"
             >
               Deactivate
             </Button>
             <Button
               onClick={confirmDelete}
               className="bg-red-600 hover:bg-red-700 text-white"
             >
               Delete
             </Button>
           </div>
         </div>
       </Modal>
       </div>
   );
 } 