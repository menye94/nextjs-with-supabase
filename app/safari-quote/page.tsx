"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

interface TripDetails {
  startDate: string;
  endDate: string;
  clientCountry: string;
  numberOfAdults: number;
  numberOfChildren: number;
  client: string;
}

interface ParkItem {
  id: string;
  parkCategory: string;
  parkEntryType: string;
  parkProduct: string;
  currency: 'USD' | 'TZS';
  duration: number;
  pax: number;
  total: number;
  parkName: string;
}

interface Country {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  country: string;
}

interface ParkCategory {
  id: string;
  name: string;
}

interface ParkEntryType {
  id: string;
  name: string;
}

interface ParkProduct {
  id: string;
  name: string;
  category: string;
  entryType: string;
  usdPrice: number;
  tzsPrice: number;
  supportsUSD: boolean;
  supportsTZS: boolean;
}

// Mock data - replace with actual API calls
const mockCountries: Country[] = [
  { id: "1", name: "United States" },
  { id: "2", name: "United Kingdom" },
  { id: "3", name: "Germany" },
  { id: "4", name: "France" },
  { id: "5", name: "Canada" },
  { id: "6", name: "Australia" },
  { id: "7", name: "Japan" },
  { id: "8", name: "South Africa" },
  { id: "9", name: "Kenya" },
  { id: "10", name: "Tanzania" },
];

const mockClients: Client[] = [
  { id: "1", name: "John Smith", country: "United States" },
  { id: "2", name: "Sarah Johnson", country: "United Kingdom" },
  { id: "3", name: "Michael Brown", country: "Germany" },
  { id: "4", name: "Emily Davis", country: "France" },
  { id: "5", name: "David Wilson", country: "Canada" },
];

const mockParkCategories: ParkCategory[] = [
  { id: "1", name: "Entrance" },
  { id: "2", name: "Camping" },
  { id: "3", name: "Lodging" },
  { id: "4", name: "Activities" },
];

const mockParkEntryTypes: ParkEntryType[] = [
  { id: "1", name: "Non Resident" },
  { id: "2", name: "Expatriate" },
  { id: "3", name: "East Africa Citizen" },
  { id: "4", name: "Tanzania Citizen" },
];

const mockParkProducts: ParkProduct[] = [
  { id: "1", name: "Serengeti Day Pass", category: "Entrance", entryType: "Non Resident", usdPrice: 60, tzsPrice: 150000, supportsUSD: true, supportsTZS: true },
  { id: "2", name: "Serengeti Camping", category: "Camping", entryType: "Non Resident", usdPrice: 30, tzsPrice: 75000, supportsUSD: true, supportsTZS: true },
  { id: "3", name: "Ngorongoro Day Pass", category: "Entrance", entryType: "Non Resident", usdPrice: 70, tzsPrice: 175000, supportsUSD: true, supportsTZS: true },
  { id: "4", name: "Kilimanjaro Climb", category: "Activities", entryType: "Non Resident", usdPrice: 200, tzsPrice: 500000, supportsUSD: true, supportsTZS: false },
  { id: "5", name: "Tarangire Safari", category: "Entrance", entryType: "East Africa Citizen", usdPrice: 0, tzsPrice: 25000, supportsUSD: false, supportsTZS: true },
];

export default function SafariQuotePage() {
  const [activeSection, setActiveSection] = useState<'trip-details' | 'add-parks'>('trip-details');
  const [quoteItems, setQuoteItems] = useState<ParkItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    startDate: '',
    endDate: '',
    clientCountry: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
    client: '',
  });

  const [parkForm, setParkForm] = useState({
    parkCategory: '',
    parkEntryType: '',
    parkProduct: '',
    currency: 'USD' as 'USD' | 'TZS',
    duration: 1,
    pax: 1,
  });

  const [filteredProducts, setFilteredProducts] = useState<ParkProduct[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter products based on selected category and entry type
  useEffect(() => {
    const filtered = mockParkProducts.filter(product => 
      product.category === parkForm.parkCategory && 
      product.entryType === parkForm.parkEntryType
    );
    setFilteredProducts(filtered);
    setParkForm(prev => ({ ...prev, parkProduct: '' }));
  }, [parkForm.parkCategory, parkForm.parkEntryType]);

  // Calculate total for current park form
  const calculateTotal = () => {
    const product = filteredProducts.find(p => p.id === parkForm.parkProduct);
    if (!product) return 0;
    
    const price = parkForm.currency === 'USD' ? product.usdPrice : product.tzsPrice;
    return price * parkForm.duration * parkForm.pax;
  };

  const handleTripDetailsStringChange = (field: 'startDate' | 'endDate' | 'clientCountry' | 'client', value: string) => {
    setTripDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTripDetailsNumberChange = (field: 'numberOfAdults' | 'numberOfChildren', value: number) => {
    setTripDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateTripDetails = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!tripDetails.startDate) newErrors.startDate = "Start date is required";
    if (!tripDetails.endDate) newErrors.endDate = "End date is required";
    if (!tripDetails.clientCountry) newErrors.clientCountry = "Client country is required";
    if (!tripDetails.client) newErrors.client = "Client is required";
    if (tripDetails.numberOfAdults < 1) newErrors.numberOfAdults = "At least 1 adult required";
    if (tripDetails.numberOfChildren < 0) newErrors.numberOfChildren = "Cannot be negative";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddParkItem = () => {
    const product = filteredProducts.find(p => p.id === parkForm.parkProduct);
    if (!product) return;

    const newItem: ParkItem = {
      id: Date.now().toString(),
      parkCategory: parkForm.parkCategory,
      parkEntryType: parkForm.parkEntryType,
      parkProduct: parkForm.parkProduct,
      currency: parkForm.currency,
      duration: parkForm.duration,
      pax: parkForm.pax,
      total: calculateTotal(),
      parkName: product.name,
    };

    setQuoteItems(prev => [...prev, newItem]);
    
    // Reset form
    setParkForm({
      parkCategory: '',
      parkEntryType: '',
      parkProduct: '',
      currency: 'USD',
      duration: 1,
      pax: 1,
    });
  };

  const handleRemoveItem = (id: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditItem = (item: ParkItem) => {
    setEditingItem(item.id);
    setParkForm({
      parkCategory: item.parkCategory,
      parkEntryType: item.parkEntryType,
      parkProduct: item.parkProduct,
      currency: item.currency,
      duration: item.duration,
      pax: item.pax,
    });
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const product = filteredProducts.find(p => p.id === parkForm.parkProduct);
    if (!product) return;

    const updatedItem: ParkItem = {
      id: editingItem,
      parkCategory: parkForm.parkCategory,
      parkEntryType: parkForm.parkEntryType,
      parkProduct: parkForm.parkProduct,
      currency: parkForm.currency,
      duration: parkForm.duration,
      pax: parkForm.pax,
      total: calculateTotal(),
      parkName: product.name,
    };

    setQuoteItems(prev => prev.map(item => 
      item.id === editingItem ? updatedItem : item
    ));
    
    setEditingItem(null);
    setParkForm({
      parkCategory: '',
      parkEntryType: '',
      parkProduct: '',
      currency: 'USD',
      duration: 1,
      pax: 1,
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateTripDetails()) {
      console.log('Trip Details:', tripDetails);
      setActiveSection('add-parks');
    }
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'TZS') => {
    return currency === 'USD' 
      ? `$${amount.toLocaleString()}`
      : `TZS ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Safari Quote</h1>
          <p className="text-gray-600">Create a detailed quote for your safari adventure</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${activeSection === 'trip-details' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${activeSection === 'trip-details' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Trip Details</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${activeSection === 'add-parks' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${activeSection === 'add-parks' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Add Parks</span>
            </div>
          </div>
        </div>

        {/* Section 1: Trip Details Form */}
        {activeSection === 'trip-details' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Trip Details</h2>
            
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tripDetails.startDate}
                    onChange={(e) => handleTripDetailsStringChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tripDetails.endDate}
                    onChange={(e) => handleTripDetailsStringChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                  )}
                </div>

                {/* Client Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Country
                  </label>
                  <select
                    value={tripDetails.clientCountry}
                    onChange={(e) => handleTripDetailsStringChange('clientCountry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a country</option>
                    {mockCountries.map(country => (
                      <option key={country.id} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.clientCountry && (
                    <p className="mt-1 text-sm text-red-600">{errors.clientCountry}</p>
                  )}
                </div>

                {/* Number of Adults */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Adults
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tripDetails.numberOfAdults}
                    onChange={(e) => handleTripDetailsNumberChange('numberOfAdults', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.numberOfAdults && (
                    <p className="mt-1 text-sm text-red-600">{errors.numberOfAdults}</p>
                  )}
                </div>

                {/* Number of Children */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tripDetails.numberOfChildren}
                    onChange={(e) => handleTripDetailsNumberChange('numberOfChildren', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.numberOfChildren && (
                    <p className="mt-1 text-sm text-red-600">{errors.numberOfChildren}</p>
                  )}
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <select
                    value={tripDetails.client}
                    onChange={(e) => handleTripDetailsStringChange('client', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a client</option>
                    {mockClients.map(client => (
                      <option key={client.id} value={client.name}>
                        {client.name} ({client.country})
                      </option>
                    ))}
                  </select>
                  {errors.client && (
                    <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Add Parks
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section 2: Add Parks For Trip */}
        {activeSection === 'add-parks' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add Parks For Trip</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Park Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Park Category
                  </label>
                  <select
                    value={parkForm.parkCategory}
                    onChange={(e) => setParkForm(prev => ({ ...prev, parkCategory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {mockParkCategories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Park Entry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Park Entry Type
                  </label>
                  <select
                    value={parkForm.parkEntryType}
                    onChange={(e) => setParkForm(prev => ({ ...prev, parkEntryType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select entry type</option>
                    {mockParkEntryTypes.map(entryType => (
                      <option key={entryType.id} value={entryType.name}>
                        {entryType.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Park Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Park Products
                  </label>
                  <select
                    value={parkForm.parkProduct}
                    onChange={(e) => setParkForm(prev => ({ ...prev, parkProduct: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!parkForm.parkCategory || !parkForm.parkEntryType}
                  >
                    <option value="">Select product</option>
                    {filteredProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={parkForm.currency}
                    onChange={(e) => setParkForm(prev => ({ ...prev, currency: e.target.value as 'USD' | 'TZS' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {parkForm.parkProduct && (() => {
                      const product = filteredProducts.find(p => p.id === parkForm.parkProduct);
                      if (product?.supportsUSD && product?.supportsTZS) {
                        return (
                          <>
                            <option value="USD">USD</option>
                            <option value="TZS">TZS</option>
                          </>
                        );
                      } else if (product?.supportsUSD) {
                        return <option value="USD">USD</option>;
                      } else if (product?.supportsTZS) {
                        return <option value="TZS">TZS</option>;
                      }
                      return <option value="">Select currency</option>;
                    })()}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={parkForm.duration}
                    onChange={(e) => setParkForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Pax */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pax
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={parkForm.pax}
                    onChange={(e) => setParkForm(prev => ({ ...prev, pax: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                {editingItem ? (
                  <button
                    onClick={handleUpdateItem}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    Update Quote Item
                  </button>
                ) : (
                  <button
                    onClick={handleAddParkItem}
                    disabled={!parkForm.parkProduct}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Add Quote Item
                  </button>
                )}
              </div>
            </div>

            {/* Quote Items Table */}
            {quoteItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quote Items</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Park Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pax
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quoteItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.parkName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.parkEntryType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.parkProduct}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.duration} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.pax}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.total, item.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="mt-6 flex justify-end">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      Total: {formatCurrency(
                        quoteItems.reduce((sum, item) => sum + item.total, 0),
                        'USD'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 