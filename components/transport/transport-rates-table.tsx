'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Button } from '@/components/ui/button';

interface TransportRate {
  id: number;
  transport_service_id: number;
  transport_season_id: number;
  rate: number | null;
  currency_id: number;
  created_at: string;
  updated_at: string;
}

interface TransportService {
  id: number;
  from_location: number;
  to_location: number;
  company_id: number;
}

interface TransportSeason {
  id: number;
  season_name: string | null;
  start_date: string;
  end_date: string;
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

interface TransportCompany {
  id: number;
  name: string;
}

interface TransportRatesTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TransportRatesTable({ searchQuery = '', onSearchChange }: TransportRatesTableProps) {
  const [rates, setRates] = useState<TransportRate[]>([]);
  const [services, setServices] = useState<TransportService[]>([]);
  const [seasons, setSeasons] = useState<TransportSeason[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState<TransportRate | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const [formData, setFormData] = useState({
    transport_service_id: 0,
    transport_season_id: 0,
    rate: '',
    currency_id: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transport rates
      const { data: ratesData, error: ratesError } = await supabase
        .from('transport_rates')
        .select('*')
        .order('created_at', { ascending: false });

      if (ratesError) throw ratesError;

      // Fetch all related data
      const [
        { data: servicesData },
        { data: seasonsData },
        { data: currenciesData },
        { data: citiesData },
        { data: transportCompaniesData }
      ] = await Promise.all([
        supabase.from('transport_services').select('id, from_location, to_location, company_id').order('created_at'),
        supabase.from('transport_seasons').select('id, season_name, start_date, end_date').order('start_date'),
        supabase.from('currency').select('id, name, symbol').order('name'),
        supabase.from('cities').select('id, name').order('name'),
        supabase.from('transport_companies').select('id, name').order('name')
      ]);

      setRates(ratesData || []);
      setServices(servicesData || []);
      setSeasons(seasonsData || []);
      setCurrencies(currenciesData || []);
      setCities(citiesData || []);
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
      const rateData = {
        transport_service_id: formData.transport_service_id,
        transport_season_id: formData.transport_season_id,
        rate: formData.rate ? parseFloat(formData.rate) : null,
        currency_id: formData.currency_id,
      };

      if (editingRate) {
        // Update existing rate
        const { error } = await supabase
          .from('transport_rates')
          .update({
            ...rateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRate.id);

        if (error) throw error;
      } else {
        // Create new rate
        const { error } = await supabase
          .from('transport_rates')
          .insert(rateData);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingRate(null);
      setFormData({
        transport_service_id: 0,
        transport_season_id: 0,
        rate: '',
        currency_id: 0,
      });
      fetchData();
    } catch (error) {
      console.error('Error saving transport rate:', error);
      alert('Error saving transport rate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rate: TransportRate) => {
    setEditingRate(rate);
    setFormData({
      transport_service_id: rate.transport_service_id,
      transport_season_id: rate.transport_season_id,
      rate: rate.rate?.toString() || '',
      currency_id: rate.currency_id,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transport rate?')) return;

    try {
      const { error } = await supabase
        .from('transport_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting transport rate:', error);
      alert('Error deleting transport rate. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingRate(null);
    setFormData({
      transport_service_id: 0,
      transport_season_id: 0,
      rate: '',
      currency_id: 0,
    });
    setShowModal(true);
  };

  const filteredRates = rates.filter(rate => {
    // Add search logic if needed
    return true;
  });

  const getServiceRoute = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 'Unknown Service';
    
    const fromCity = cities.find(c => c.id === service.from_location);
    const toCity = cities.find(c => c.id === service.to_location);
    const company = transportCompanies.find(c => c.id === service.company_id);
    
    return `${fromCity?.name || 'Unknown'} → ${toCity?.name || 'Unknown'} (${company?.name || 'Unknown Company'})`;
  };

  const columns = [
    {
      key: 'service',
      label: 'Service',
      render: (value: any, row: TransportRate) => (
        <span className="font-medium text-gray-900">
          {getServiceRoute(row.transport_service_id)}
        </span>
      ),
    },
    {
      key: 'season',
      label: 'Season',
      render: (value: any, row: TransportRate) => {
        const season = seasons.find(s => s.id === row.transport_season_id);
        if (!season) return <span className="text-gray-500">Unknown Season</span>;
        
        return (
          <div>
            <div className="font-medium text-gray-900">{season.season_name || 'Unnamed Season'}</div>
            <div className="text-sm text-gray-500">
              {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (value: any, row: TransportRate) => {
        const currency = currencies.find(c => c.id === row.currency_id);
        return (
          <span className="text-gray-900 font-medium">
            {row.rate ? `${currency?.symbol || ''}${row.rate}` : 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (value: any, row: TransportRate) => {
        const currency = currencies.find(c => c.id === row.currency_id);
        return <span className="text-gray-600">{currency?.name || 'Unknown'}</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: any, row: TransportRate) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: TransportRate) => (
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
        <h2 className="text-2xl font-bold text-gray-900">Transport Rates</h2>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Transport Rate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search rates..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredRates}
        columns={columns}
        searchQuery={searchQuery}
        itemsPerPage={10}
        showPagination={true}
        showBulkSelection={false}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingRate ? 'Edit Transport Rate' : 'Add Transport Rate'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Service
                </label>
                <SearchableDropdown
                  id="transport-service"
                  label="Transport Service"
                  options={services.map(service => ({ 
                    id: service.id, 
                    value: service.id, 
                    label: getServiceRoute(service.id)
                  }))}
                  value={String(formData.transport_service_id || 0)}
                  onChange={(value) => setFormData({ ...formData, transport_service_id: parseInt(value) || 0 })}
                  placeholder="Select transport service"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season
                </label>
                <SearchableDropdown
                  id="season"
                  label="Season"
                  options={seasons.map(season => ({ 
                    id: season.id, 
                    value: season.id, 
                    label: `${season.season_name || 'Unnamed Season'} (${new Date(season.start_date).toLocaleDateString()} - ${new Date(season.end_date).toLocaleDateString()})`
                  }))}
                  value={String(formData.transport_season_id || 0)}
                  onChange={(value) => setFormData({ ...formData, transport_season_id: parseInt(value) || 0 })}
                  placeholder="Select season"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <SearchableDropdown
                    id="currency"
                    label="Currency"
                    options={currencies.map(curr => ({ 
                      id: curr.id, 
                      value: curr.id, 
                      label: `${curr.name} (${curr.symbol})`
                    }))}
                    value={String(formData.currency_id || 0)}
                    onChange={(value) => setFormData({ ...formData, currency_id: parseInt(value) || 0 })}
                    placeholder="Select currency"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter rate"
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
                      {editingRate ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingRate ? 'Update Transport Rate' : 'Add Transport Rate'
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