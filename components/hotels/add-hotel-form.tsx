"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

interface AddHotelFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editHotel?: {
    id: number;
    hotel_name: string;
    owner_id: string;
    location_id: number;
    category_id: number;
    camping_type_id?: number;
    is_partner: boolean;
    is_active: boolean;
    contact_email: string | null;
    hotel_website: string | null;
  };
}

interface HotelCategory {
  id: number;
  name: string;
}

interface Location {
  id: number;
  city_id: number;
  national_park_id: number;
  city?: { city_name: string };
  national_park?: { national_park_name: string };
}

interface CampingType {
  id: number;
  name: string; // Changed from camping_type_name to name
}

interface Company {
  id: string;
  company_name: string;
}

export function AddHotelForm({ onClose, onSuccess, editHotel }: AddHotelFormProps) {
  const [hotelName, setHotelName] = useState(editHotel?.hotel_name || "");
  const [locationId, setLocationId] = useState(editHotel?.location_id?.toString() || "");
  const [categoryId, setCategoryId] = useState(editHotel?.category_id?.toString() || "");
  const [isPartner, setIsPartner] = useState(editHotel?.is_partner ?? false);
  const [isActive, setIsActive] = useState(editHotel?.is_active ?? true);
  const [contactEmail, setContactEmail] = useState(editHotel?.contact_email || "");
  const [hotelWebsite, setHotelWebsite] = useState(editHotel?.hotel_website || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<HotelCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [campingTypes, setCampingTypes] = useState<CampingType[]>([]);
  const [filteredCampingTypes, setFilteredCampingTypes] = useState<CampingType[]>([]);
  const [selectedCampingTypeId, setSelectedCampingTypeId] = useState<number | null>(editHotel?.camping_type_id || null);
  
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [campingTypeDropdownOpen, setCampingTypeDropdownOpen] = useState(false);
  
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const campingTypeDropdownRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  // Get current user's company ID
  const getCurrentUserCompanyId = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user:', userError);
        return;
      }

      // Get user's company ID from companies table
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (companyError) {
        console.error('Error getting user company:', companyError);
        return;
      }

      setCurrentUserCompanyId(company.id);
    } catch (error) {
      console.error('Error getting current user company ID:', error);
    }
  };

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('hotel_category')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Database connection test failed:', error);
        setError('Database connection failed. Please check your configuration.');
      } else {
        console.log('Database connection successful');
      }
    } catch (error) {
      console.error('Database connection test error:', error);
      setError('Database connection failed. Please check your configuration.');
    }
  };
  
  useEffect(() => {
    testDatabaseConnection();
    fetchCategories();
    fetchLocations();
    fetchCampingTypes();
    getCurrentUserCompanyId(); // Call getCurrentUserCompanyId here
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setLocationDropdownOpen(false);
      }
      if (campingTypeDropdownRef.current && !campingTypeDropdownRef.current.contains(event.target as Node)) {
        setCampingTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('Fetching hotel categories...');
      const { data, error } = await supabase
        .from('hotel_category')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching hotel categories:', error);
        setError(`Error fetching categories: ${error.message}`);
        return;
      }

      console.log('Hotel categories fetched:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching hotel categories:', error);
      setError('Failed to fetch hotel categories. Please try again.');
    }
  };

  const fetchLocations = async () => {
    try {
      console.log('Fetching locations...');
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          city:cities(city_name),
          national_park:national_parks(national_park_name)
        `)
        .order('id');

      if (error) {
        console.error('Error fetching locations:', error);
        setError(`Error fetching locations: ${error.message}`);
        return;
      }

      console.log('Locations fetched:', data);
      setLocations(data || []);
      setFilteredLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to fetch locations. Please try again.');
    }
  };

  const fetchCampingTypes = async () => {
    try {
      console.log('Fetching camping types...');
      const { data, error } = await supabase
        .from('camping_type')
        .select('*')
        .order('name'); // Changed from camping_type_name to name

      if (error) {
        console.error('Error fetching camping types:', error);
        setError(`Error fetching camping types: ${error.message}`);
        return;
      }

      console.log('Camping types fetched:', data);
      setCampingTypes(data || []);
      setFilteredCampingTypes(data || []);
    } catch (error) {
      console.error('Error fetching camping types:', error);
      setError('Failed to fetch camping types. Please try again.');
    }
  };

  const handleLocationSearch = (searchTerm: string) => {
    const filtered = locations.filter(location => {
      const cityName = location.city?.city_name || '';
      const parkName = location.national_park?.national_park_name || '';
      return cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             parkName.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredLocations(filtered);
  };

  const handleCampingTypeSearch = (searchTerm: string) => {
    const filtered = campingTypes.filter(campingType => 
      campingType.name.toLowerCase().includes(searchTerm.toLowerCase()) // Changed from camping_type_name to name
    );
    setFilteredCampingTypes(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!hotelName.trim()) {
      setError("Hotel name is required");
      setLoading(false);
      return;
    }

    if (!locationId) {
      setError("Location is required");
      setLoading(false);
      return;
    }

    if (!categoryId) {
      setError("Hotel category is required");
      setLoading(false);
      return;
    }

    if (!currentUserCompanyId) {
      setError("Unable to determine your company. Please try logging out and back in.");
      setLoading(false);
      return;
    }

    try {
      const hotelData = {
        hotel_name: hotelName.trim(),
        owner_id: currentUserCompanyId,
        location_id: parseInt(locationId),
        category_id: parseInt(categoryId),
        camping_type_id: selectedCampingTypeId,
        is_partner: isPartner,
        is_active: true, // Default to true since we removed the checkbox
        contact_email: contactEmail.trim() || null,
        hotel_website: hotelWebsite.trim() || null,
      };

      console.log('Submitting hotel data:', hotelData);

      let result;
      if (editHotel) {
        // Update existing hotel
        result = await supabase
          .from('hotels')
          .update(hotelData)
          .eq('id', editHotel.id)
          .select();
      } else {
        // Create new hotel
        result = await supabase
          .from('hotels')
          .insert(hotelData)
          .select();
      }

      if (result.error) {
        console.error('Error saving hotel:', result.error);
        
        // Handle specific database errors
        if (result.error.code === '23505') {
          setError('A hotel with this name already exists.');
        } else if (result.error.code === '23503') {
          setError('Invalid reference. Please check the selected location or category.');
        } else {
          setError(`Error saving hotel: ${result.error.message}`);
        }
      } else {
        console.log('Hotel saved successfully:', result.data);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving hotel:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLocationDisplayName = (location: Location | undefined) => {
    if (!location) {
      return 'Unknown Location';
    }
    
    const cityName = location.city?.city_name || '';
    const parkName = location.national_park?.national_park_name || '';
    
    if (cityName && parkName) {
      return `${cityName} - ${parkName}`;
    }
    return cityName || parkName || `Location ${location.id}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editHotel ? 'Edit Hotel' : 'Add New Hotel'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hotel Name */}
          <div>
            <Label htmlFor="hotelName" className="block text-sm font-medium text-gray-700 mb-1">
              Hotel Name *
            </Label>
            <Input
              id="hotelName"
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Enter hotel name"
              className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
              required
            />
          </div>

          {/* Location Dropdown */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </Label>
            <div className="relative" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
              >
                <span className={locationId ? "text-gray-900" : "text-gray-500"}>
                  {locationId && locations.length > 0
                    ? getLocationDisplayName(locations.find(l => l.id === parseInt(locationId)) || undefined)
                    : locationId 
                      ? "Loading location..."
                      : "Select location"
                  }
                </span>
                {locationDropdownOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {locationDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-200">
                    <Input
                      type="text"
                      placeholder="Search locations..."
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => {
                            setLocationId(location.id.toString());
                            setLocationDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-100 text-left border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-gray-900 text-sm">{getLocationDisplayName(location)}</span>
                          {locationId === location.id.toString() && (
                            <Check className="h-4 w-4 text-[var(--theme-green)] flex-shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-sm text-center">
                        {locations.length === 0 ? "Loading locations..." : "No locations found"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hotel Category Dropdown */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Hotel Category *
            </Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Camping Types Dropdown */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Camping Types
            </Label>
            <div className="relative" ref={campingTypeDropdownRef}>
              <button
                type="button"
                onClick={() => setCampingTypeDropdownOpen(!campingTypeDropdownOpen)}
                className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
              >
                <span className={selectedCampingTypeId !== null ? "text-gray-900" : "text-gray-500"}>
                  {selectedCampingTypeId !== null
                    ? campingTypes.find(type => type.id === selectedCampingTypeId)?.name || ''
                    : "Select camping type"
                  }
                </span>
                {campingTypeDropdownOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {campingTypeDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-200">
                    <Input
                      type="text"
                      placeholder="Search camping types..."
                      onChange={(e) => handleCampingTypeSearch(e.target.value)}
                      className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCampingTypes.length > 0 ? (
                      filteredCampingTypes.map((campingType) => (
                        <button
                          key={campingType.id}
                          type="button"
                          onClick={() => {
                            setSelectedCampingTypeId(campingType.id);
                            setCampingTypeDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-100 text-left border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-gray-900 text-sm">{campingType.name}</span> {/* Changed from camping_type_name to name */}
                          {selectedCampingTypeId === campingType.id && (
                            <Check className="h-4 w-4 text-[var(--theme-green)] flex-shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-sm text-center">
                        {campingTypes.length === 0 ? "Loading camping types..." : "No camping types found"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <Label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Enter contact email"
              className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
            />
          </div>

          {/* Hotel Website */}
          <div>
            <Label htmlFor="hotelWebsite" className="block text-sm font-medium text-gray-700 mb-1">
              Hotel Website
            </Label>
            <Input
              id="hotelWebsite"
              type="url"
              value={hotelWebsite}
              onChange={(e) => setHotelWebsite(e.target.value)}
              placeholder="Enter hotel website URL"
              className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex space-x-6">
            <div className="flex items-center">
              <input
                id="isPartner"
                type="checkbox"
                checked={isPartner}
                onChange={(e) => setIsPartner(e.target.checked)}
                className="h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300 rounded"
              />
              <Label htmlFor="isPartner" className="ml-2 block text-sm text-gray-900">
                Is Partner
              </Label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white"
            >
              {loading ? 'Saving...' : (editHotel ? 'Update Hotel' : 'Add Hotel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 