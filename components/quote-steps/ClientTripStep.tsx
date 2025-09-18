"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, MapPin, User, Plus, Minus } from "lucide-react";
import { QuoteData } from "@/app/quote-create/page";

interface ClientTripStepProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

interface Country {
  id: number;
  country_name: string;
}

interface Client {
  id: number;
  name: string;
  country: string;
  email?: string;
  phone?: string;
}

const TRIP_TYPES = [
  { value: 'safari', label: 'Safari Adventure' },
  { value: 'cultural', label: 'Cultural Tour' },
  { value: 'adventure', label: 'Adventure Sports' },
  { value: 'luxury', label: 'Luxury Safari' },
  { value: 'budget', label: 'Budget Safari' },
  { value: 'photography', label: 'Photography Safari' },
];

export function ClientTripStep({ quoteData, updateQuoteData, errors, setErrors }: ClientTripStepProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCountries();
    fetchClients();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('country_name');
      
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchClients = async () => {
    try {
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        setClients([]);
        return;
      }

      console.log('Current user:', user.id);

      // First verify the user has a company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('owner_id', user.id)
        .single();

      if (companyError || !companyData) {
        console.error('Error: User does not have a company. Please contact administrator.', companyError);
        setClients([]);
        return;
      }

      console.log('User company:', companyData);

      // Get clients from the clients table (relationship table)
      // Only get clients that have customer relationships
      const { data: clientRelations, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          customer_id,
          agent_id,
          customers!fk_clients_customer_id (
            id,
            cus_first_name,
            cus_last_name,
            cus_email_address,
            cus_address,
            country_id,
            countries!customers_country_id_fkey (
              country_name
            )
          )
        `)
        .not('customer_id', 'is', null);
      
      if (clientError) {
        console.error('Error fetching clients:', clientError);
        setClients([]);
        return;
      }

      console.log('Fetched client relations:', clientRelations);
      console.log('Number of client relations:', clientRelations?.length || 0);

      // Transform the data to match our expected format
      const transformedClients = clientRelations?.map(relation => ({
        id: relation.customer_id,
        name: `${relation.customers?.cus_first_name || ''} ${relation.customers?.cus_last_name || ''}`.trim(),
        email: relation.customers?.cus_email_address || '',
        phone: '', // Not available in customers table
        country: relation.customers?.countries?.country_name || '',
        address: relation.customers?.cus_address || ''
      })) || [];

      console.log('Transformed clients:', transformedClients);
      setClients(transformedClients);

      // If no clients found, try fetching customers directly as a fallback
      if (transformedClients.length === 0) {
        console.log('No clients found, trying to fetch customers directly...');
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select(`
            id,
            cus_first_name,
            cus_last_name,
            cus_email_address,
            cus_address,
            country_id,
            countries!customers_country_id_fkey (
              country_name
            )
          `)
          .eq('owner_id', companyData.id);

        if (customersError) {
          console.error('Error fetching customers directly:', customersError);
        } else {
          console.log('Fetched customers directly:', customers);
          const directClients = customers?.map(customer => ({
            id: customer.id,
            name: `${customer.cus_first_name || ''} ${customer.cus_last_name || ''}`.trim(),
            email: customer.cus_email_address || '',
            phone: '',
            country: customer.countries?.country_name || '',
            address: customer.cus_address || ''
          })) || [];
          console.log('Direct clients:', directClients);
          setClients(directClients);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const handleClientSelect = (clientId: string) => {
    if (clientId === 'new') {
      setShowNewClient(true);
      return;
    }

    const client = clients.find(c => c.id.toString() === clientId);
    if (client) {
      updateQuoteData({
        clientId: clientId,
        clientName: client.name,
        clientCountry: client.country,
      });
    }
  };

  const handleNewClientSubmit = async () => {
    if (!newClient.name || !newClient.country) return;

    try {
      setIsLoading(true);
      
      // First verify the user has a company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (companyError || !companyData) {
        console.error('Error: User does not have a company. Please contact administrator.');
        return;
      }
      
      // Get country ID
      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('id')
        .eq('country_name', newClient.country)
        .single();

      if (countryError) {
        console.error('Error finding country:', countryError);
        return;
      }

      // Create new customer (owner_id will be automatically set by trigger)
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          cus_first_name: newClient.name.split(' ')[0] || '',
          cus_last_name: newClient.name.split(' ').slice(1).join(' ') || '',
          cus_email_address: newClient.email,
          cus_address: newClient.address || '',
          country_id: countryData.id,
          cus_is_active: true,
          since: new Date().toISOString(),
          // owner_id will be automatically set by the trigger to the current user's company
        }])
        .select()
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        throw customerError;
      }

      // Create client relationship (assuming we need to link to an agent)
      // For now, we'll just use the customer data directly
      updateQuoteData({
        clientId: customerData.id.toString(),
        clientName: newClient.name,
        clientCountry: newClient.country,
      });

      setShowNewClient(false);
      setNewClient({ name: '', email: '', phone: '', country: '' });
      fetchClients(); // Refresh clients list
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdultsChange = (value: number) => {
    const newAdults = Math.max(1, value);
    updateQuoteData({ adults: newAdults });
  };

  const handleChildrenChange = (value: number) => {
    const newChildren = Math.max(0, value);
    const newChildAges = Array(newChildren).fill(0).map((_, index) => 
      quoteData.childAges[index] || 0
    );
    updateQuoteData({ 
      children: newChildren,
      childAges: newChildAges,
    });
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const newChildAges = [...quoteData.childAges];
    newChildAges[index] = Math.max(0, Math.min(17, age));
    updateQuoteData({ childAges: newChildAges });
  };

  const calculateTripDuration = () => {
    if (!quoteData.startDate || !quoteData.endDate) return 0;
    const start = new Date(quoteData.startDate);
    const end = new Date(quoteData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <SearchableDropdown
              id="client-select"
              label="Select Client"
              value={quoteData.clientId || ''}
              onChange={handleClientSelect}
              options={[
                ...clients.map((client) => ({
                  id: client.id,
                  label: `${client.name} (${client.country})`,
                  value: client.id.toString()
                })),
                {
                  id: 'new',
                  label: 'Create New Client',
                  value: 'new'
                }
              ]}
              placeholder="Choose existing client or create new"
              required
            />
            {errors.clientName && (
              <p className="text-sm text-red-600 mt-1">{errors.clientName}</p>
            )}
          </div>

          {showNewClient && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <h4 className="font-medium">Create New Client</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-client-name">Client Name *</Label>
                  <Input
                    id="new-client-name"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <SearchableDropdown
                    id="new-client-country"
                    label="Country *"
                    value={newClient.country}
                    onChange={(value) => setNewClient(prev => ({ ...prev, country: value }))}
                    options={countries.map((country) => ({
                      id: country.id,
                      label: country.country_name,
                      value: country.country_name
                    }))}
                    placeholder="Select country"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-client-email">Email</Label>
                  <Input
                    id="new-client-email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="new-client-phone">Phone</Label>
                  <Input
                    id="new-client-phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleNewClientSubmit}
                  disabled={isLoading || !newClient.name || !newClient.country}
                  size="sm"
                >
                  {isLoading ? 'Creating...' : 'Create Client'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewClient(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={quoteData.startDate}
                onChange={(e) => updateQuoteData({ startDate: e.target.value })}
                className="mt-1"
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="end-date">End Date *</Label>
              <Input
                id="end-date"
                type="date"
                value={quoteData.endDate}
                min={quoteData.startDate}
                onChange={(e) => updateQuoteData({ endDate: e.target.value })}
                className="mt-1"
                disabled={!quoteData.startDate}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="trip-type">Trip Type</Label>
            <Select 
              value={quoteData.tripType} 
              onValueChange={(value) => updateQuoteData({ tripType: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select trip type" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {TRIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {quoteData.startDate && quoteData.endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Trip Duration:</strong> {calculateTripDuration()} days
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Travelers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Travelers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Adults (18+ years)</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdultsChange(quoteData.adults - 1)}
                  disabled={quoteData.adults <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quoteData.adults}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdultsChange(quoteData.adults + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.adults && (
                <p className="text-sm text-red-600 mt-1">{errors.adults}</p>
              )}
            </div>

            <div>
              <Label>Children (0-17 years)</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChildrenChange(quoteData.children - 1)}
                  disabled={quoteData.children <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quoteData.children}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChildrenChange(quoteData.children + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {quoteData.children > 0 && (
            <div>
              <Label>Children Ages</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {Array.from({ length: quoteData.children }, (_, index) => (
                  <div key={`child-age-input-${index}`}>
                    <Label htmlFor={`child-age-${index}`} className="text-sm">
                      Child {index + 1} Age
                    </Label>
                    <Input
                      id={`child-age-${index}`}
                      type="number"
                      min="0"
                      max="17"
                      value={quoteData.childAges[index] || 0}
                      onChange={(e) => handleChildAgeChange(index, parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 border rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>Total Travelers:</strong> {quoteData.adults + quoteData.children} 
              ({quoteData.adults} adults, {quoteData.children} children)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
