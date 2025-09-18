'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Button } from '@/components/ui/button';

interface TransportService {
  id: number;
  transport_type_id: number | null;
  transport_ticket_type: number;
  transport_fuel_option_id: number;
  transport_category_id: number;
  currency_id: number;
  price: number | null;
  company_id: number;
  from_location: number;
  to_location: number;
  owner_id: string;
  transport_season_id: number;
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

interface TransportType {
  id: number;
  name: string;
}

interface TransportTicketType {
  id: number;
  name: string;
}

interface TransportFuelOption {
  id: number;
  name: string;
}

interface TransportCategory {
  id: number;
  name: string;
}

interface Currency {
  id: number;
  name: string;
  symbol: string;
}

interface City {
  id: number;
  name: string;
}

interface TransportSeason {
  id: number;
  season_name: string | null;
}

interface TransportServicesTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TransportServicesTable({ searchQuery = '', onSearchChange }: TransportServicesTableProps) {
  const [services, setServices] = useState<TransportService[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [transportTypes, setTransportTypes] = useState<TransportType[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TransportTicketType[]>([]);
  const [fuelOptions, setFuelOptions] = useState<TransportFuelOption[]>([]);
  const [categories, setCategories] = useState<TransportCategory[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [seasons, setSeasons] = useState<TransportSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<TransportService | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filterCompany, setFilterCompany] = useState<string>('');

  const [formData, setFormData] = useState({
    transport_type_id: 0,
    transport_ticket_type: 0,
    transport_fuel_option_id: 0,
    transport_category_id: 0,
    currency_id: 0,
    price: '',
    company_id: 0,
    from_location: 0,
    to_location: 0,
    transport_season_id: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transport services
      const { data: servicesData, error: servicesError } = await supabase
        .from('transport_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch all related data
      const [
        { data: companiesData },
        { data: transportCompaniesData },
        { data: transportTypesData },
        { data: ticketTypesData },
        { data: fuelOptionsData },
        { data: categoriesData },
        { data: currenciesData },
        { data: citiesData },
        { data: seasonsData }
      ] = await Promise.all([
        supabase.from('companies').select('id, company_name').order('company_name'),
        supabase.from('transport_companies').select('id, name').order('name'),
        supabase.from('transport_type').select('id, name').order('name'),
        supabase.from('transport_ticket_type').select('id, name').order('name'),
        supabase.from('transport_fuel_option').select('id, name').order('name'),
        supabase.from('transport_category').select('id, name').order('name'),
        supabase.from('currency').select('id, name, symbol').order('name'),
        supabase.from('cities').select('id, name').order('name'),
        supabase.from('transport_seasons').select('id, season_name').order('start_date')
      ]);

      setServices(servicesData || []);
      setCompanies(companiesData || []);
      setTransportCompanies(transportCompaniesData || []);
      setTransportTypes(transportTypesData || []);
      setTicketTypes(ticketTypesData || []);
      setFuelOptions(fuelOptionsData || []);
      setCategories(categoriesData || []);
      setCurrencies(currenciesData || []);
      setCities(citiesData || []);
      setSeasons(seasonsData || []);
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

      const serviceData = {
        transport_type_id: formData.transport_type_id || null,
        transport_ticket_type: formData.transport_ticket_type,
        transport_fuel_option_id: formData.transport_fuel_option_id,
        transport_category_id: formData.transport_category_id,
        currency_id: formData.currency_id,
        price: formData.price ? parseFloat(formData.price) : null,
        company_id: formData.company_id,
        from_location: formData.from_location,
        to_location: formData.to_location,
        transport_season_id: formData.transport_season_id,
        owner_id: userCompany.id,
      };

      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('transport_services')
          .update({
            ...serviceData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        // Create new service
        const { error } = await supabase
          .from('transport_services')
          .insert(serviceData);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingService(null);
      setFormData({
        transport_type_id: 0,
        transport_ticket_type: 0,
        transport_fuel_option_id: 0,
        transport_category_id: 0,
        currency_id: 0,
        price: '',
        company_id: 0,
        from_location: 0,
        to_location: 0,
        transport_season_id: 0,
      });
      fetchData();
    } catch (error) {
      console.error('Error saving transport service:', error);
      alert('Error saving transport service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (service: TransportService) => {
    setEditingService(service);
    setFormData({
      transport_type_id: service.transport_type_id || 0,
      transport_ticket_type: service.transport_ticket_type,
      transport_fuel_option_id: service.transport_fuel_option_id,
      transport_category_id: service.transport_category_id,
      currency_id: service.currency_id,
      price: service.price?.toString() || '',
      company_id: service.company_id,
      from_location: service.from_location,
      to_location: service.to_location,
      transport_season_id: service.transport_season_id,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transport service?')) return;

    try {
      const { error } = await supabase
        .from('transport_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting transport service:', error);
      alert('Error deleting transport service. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingService(null);
    setFormData({
      transport_type_id: 0,
      transport_ticket_type: 0,
      transport_fuel_option_id: 0,
      transport_category_id: 0,
      currency_id: 0,
      price: '',
      company_id: 0,
      from_location: 0,
      to_location: 0,
      transport_season_id: 0,
    });
    setShowModal(true);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = true; // Add search logic if needed
    const matchesCompany = !filterCompany || service.owner_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    {
      key: 'route',
      label: 'Route',
      render: (value: any, row: TransportService) => {
        const fromCity = cities.find(c => c.id === row.from_location);
        const toCity = cities.find(c => c.id === row.to_location);
        return (
          <span className="font-medium text-gray-900">
            {fromCity?.name || 'Unknown'} → {toCity?.name || 'Unknown'}
          </span>
        );
      },
    },
    {
      key: 'transport_company',
      label: 'Transport Company',
      render: (value: any, row: TransportService) => {
        const company = transportCompanies.find(c => c.id === row.company_id);
        return <span className="text-gray-600">{company?.name || 'Unknown Company'}</span>;
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: any, row: TransportService) => {
        const type = transportTypes.find(t => t.id === row.transport_type_id);
        return <span className="text-gray-600">{type?.name || 'N/A'}</span>;
      },
    },
    {
      key: 'ticket_type',
      label: 'Ticket Type',
      render: (value: any, row: TransportService) => {
        const ticketType = ticketTypes.find(t => t.id === row.transport_ticket_type);
        return <span className="text-gray-600">{ticketType?.name || 'Unknown'}</span>;
      },
    },
    {
      key: 'price',
      label: 'Price',
      render: (value: any, row: TransportService) => {
        const currency = currencies.find(c => c.id === row.currency_id);
        return (
          <span className="text-gray-900 font-medium">
            {row.price ? `${currency?.symbol || ''}${row.price}` : 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'season',
      label: 'Season',
      render: (value: any, row: TransportService) => {
        const season = seasons.find(s => s.id === row.transport_season_id);
        return <span className="text-gray-600">{season?.season_name || 'Unknown Season'}</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: TransportService) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: TransportService) => (
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
        <h2 className="text-2xl font-bold text-gray-900">Transport Services</h2>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Transport Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="w-64">
          <SearchableDropdown
            options={companies.map(comp => ({ id: comp.id, value: comp.id, label: comp.company_name }))}
            value={filterCompany}
            onChange={setFilterCompany}
            placeholder="Filter by company"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredServices}
        columns={columns}
        searchTerm={searchTerm}
        itemsPerPage={10}
        showPagination={true}
        showBulkSelection={false}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingService ? 'Edit Transport Service' : 'Add Transport Service'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Location
                  </label>
                  <SearchableDropdown
                    options={cities.map(city => ({ id: city.id, value: city.id, label: city.name }))}
                    value={String(formData.from_location || 0)}
                    onChange={(value) => setFormData({ ...formData, from_location: parseInt(value) || 0 })}
                    placeholder="Select from location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Location
                  </label>
                  <SearchableDropdown
                    options={cities.map(city => ({ id: city.id, value: city.id, label: city.name }))}
                    value={String(formData.to_location || 0)}
                    onChange={(value) => setFormData({ ...formData, to_location: parseInt(value) || 0 })}
                    placeholder="Select to location"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transport Company
                  </label>
                  <SearchableDropdown
                    options={transportCompanies.map(comp => ({ id: comp.id, value: comp.id, label: comp.name }))}
                    value={String(formData.company_id || 0)}
                    onChange={(value) => setFormData({ ...formData, company_id: parseInt(value) || 0 })}
                    placeholder="Select transport company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transport Type
                  </label>
                  <SearchableDropdown
                    options={transportTypes.map(type => ({ id: type.id, value: type.id, label: type.name }))}
                    value={String(formData.transport_type_id || 0)}
                    onChange={(value) => setFormData({ ...formData, transport_type_id: parseInt(value) || 0 })}
                    placeholder="Select transport type"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Type
                  </label>
                  <SearchableDropdown
                    options={ticketTypes.map(type => ({ id: type.id, value: type.id, label: type.name }))}
                    value={String(formData.transport_ticket_type || 0)}
                    onChange={(value) => setFormData({ ...formData, transport_ticket_type: parseInt(value) || 0 })}
                    placeholder="Select ticket type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Option
                  </label>
                  <SearchableDropdown
                    options={fuelOptions.map(option => ({ id: option.id, value: option.id, label: option.name }))}
                    value={String(formData.transport_fuel_option_id || 0)}
                    onChange={(value) => setFormData({ ...formData, transport_fuel_option_id: parseInt(value) || 0 })}
                    placeholder="Select fuel option"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <SearchableDropdown
                    options={categories.map(cat => ({ id: cat.id, value: cat.id, label: cat.name }))}
                    value={String(formData.transport_category_id || 0)}
                    onChange={(value) => setFormData({ ...formData, transport_category_id: parseInt(value) || 0 })}
                    placeholder="Select category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season
                  </label>
                  <SearchableDropdown
                    options={seasons.map(season => ({ id: season.id, value: season.id, label: season.season_name || 'Unnamed Season' }))}
                    value={String(formData.transport_season_id || 0)}
                    onChange={(value) => setFormData({ ...formData, transport_season_id: parseInt(value) || 0 })}
                    placeholder="Select season"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <SearchableDropdown
                    options={currencies.map(curr => ({ id: curr.id, value: curr.id, label: `${curr.name} (${curr.symbol})` }))}
                    value={String(formData.currency_id || 0)}
                    onChange={(value) => setFormData({ ...formData, currency_id: parseInt(value) || 0 })}
                    placeholder="Select currency"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter price"
                  />
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
                      {editingService ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingService ? 'Update Transport Service' : 'Add Transport Service'
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