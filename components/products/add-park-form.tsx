"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Check } from "lucide-react";

interface AddParkFormProps {
  onClose: () => void;
  onSuccess: () => void;
  park?: {
    id: number;
    national_park_name: string;
    country_id: number;
    park_circuit_id: number;
    is_active: boolean;
  };
}

interface Country {
  id: number;
  country_name: string;
}

interface Circuit {
  id: number;
  national_park_circuit_name: string;
}

export function AddParkForm({ onClose, onSuccess, park }: AddParkFormProps) {
  const [parkName, setParkName] = useState(park?.national_park_name || "");
  const [countryId, setCountryId] = useState(park?.country_id.toString() || "1");
  const [circuitId, setCircuitId] = useState(park?.park_circuit_id.toString() || "1");

  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [error, setError] = useState("");
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [circuitsLoading, setCircuitsLoading] = useState(true);
  
  // Custom dropdown states
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [circuitDropdownOpen, setCircuitDropdownOpen] = useState(false);
  
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const circuitDropdownRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('countries')
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
    fetchCountries();
    fetchCircuits();
  }, []);

  // Update form fields when park prop changes (for editing)
  useEffect(() => {
    console.log('AddParkForm: park prop changed:', park);
    if (park) {
      console.log('Setting form fields for editing:', {
        name: park.national_park_name,
        country: park.country_id,
        circuit: park.park_circuit_id
      });
      setParkName(park.national_park_name || "");
      setCountryId(park.country_id.toString() || "1");
      setCircuitId(park.park_circuit_id.toString() || "1");
    } else {
      console.log('Resetting form for new park');
      // Reset form for new park
      setParkName("");
      setCountryId("1");
      setCircuitId("1");
    }
  }, [park]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
      if (circuitDropdownRef.current && !circuitDropdownRef.current.contains(event.target as Node)) {
        setCircuitDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCountries = async () => {
    try {
      console.log('Fetching countries...');
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('country_name');

      if (error) {
        console.error('Error fetching countries:', error);
        setError(`Failed to load countries: ${error.message || 'Unknown error'}`);
        return;
      }

      console.log('Countries loaded:', data);
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Failed to load countries');
    } finally {
      setCountriesLoading(false);
    }
  };

  const fetchCircuits = async () => {
    try {
      console.log('Fetching circuits...');
      const { data, error } = await supabase
        .from('national_park_circuit')
        .select('*')
        .order('national_park_circuit_name');

      if (error) {
        console.error('Error fetching circuits:', error);
        setError(`Failed to load circuits: ${error.message || 'Unknown error'}`);
        return;
      }

      console.log('Circuits loaded:', data);
      setCircuits(data || []);
    } catch (error) {
      console.error('Error fetching circuits:', error);
      setError('Failed to load circuits');
    } finally {
      setCircuitsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!parkName.trim()) {
      setError("Park name is required");
      setLoading(false);
      return;
    }

    if (!countryId) {
      setError("Country is required");
      setLoading(false);
      return;
    }

    if (!circuitId) {
      setError("Circuit is required");
      setLoading(false);
      return;
    }

    try {
      if (park) {
        // Update existing park
        const parkData = {
          national_park_name: parkName.trim(),
          country_id: parseInt(countryId),
          park_circuit_id: parseInt(circuitId),
          is_active: true,
        };
        
        console.log('Attempting to update park with data:', parkData, 'for park ID:', park.id);
        
        const { error } = await supabase
          .from('national_parks')
          .update(parkData)
          .eq('id', park.id);

        if (error) {
          console.error('Error updating park:', error);
          
          // Check for specific constraint violations
          if (error.code === '23505' && error.message.includes('unique_park_name')) {
            setError('A park with this name already exists. Please choose a different name.');
          } else if (error.code === '23503') {
            setError('Invalid country or circuit selection. Please check your selections.');
          } else {
            setError(error.message || 'Failed to update park. Please try again.');
          }
          return;
        }
      } else {
        // Insert new park
        const parkData = {
          national_park_name: parkName.trim(),
          country_id: parseInt(countryId),
          park_circuit_id: parseInt(circuitId),
          is_active: true,
        };
        
        console.log('Attempting to insert park with data:', parkData);
        
        const { error } = await supabase
          .from('national_parks')
          .insert(parkData);

        if (error) {
          console.error('Error adding park:', error);
          
          // Check for specific constraint violations
          if (error.code === '23505' && error.message.includes('unique_park_name')) {
            setError('A park with this name already exists. Please choose a different name.');
          } else if (error.code === '23503') {
            setError('Invalid country or circuit selection. Please check your selections.');
          } else {
            setError(error.message || 'Failed to add park. Please try again.');
          }
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving park:', error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setCountryId(country.id.toString());
    setCountryDropdownOpen(false);
  };

  const handleCircuitSelect = (circuit: Circuit) => {
    setCircuitId(circuit.id.toString());
    setCircuitDropdownOpen(false);
  };

  // Get selected items for display
  const selectedCountry = countries.find(c => c.id.toString() === countryId);
  const selectedCircuit = circuits.find(c => c.id.toString() === circuitId);

  return (
    <div className="space-y-6">

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Country Selection */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium text-gray-700">
            Select Country
          </Label>
          {countriesLoading ? (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
              Loading countries...
            </div>
          ) : countries.length === 0 ? (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
              No countries available
            </div>
          ) : (
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full h-10 border border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 flex items-center justify-between text-left"
              >
                                 <span className={selectedCountry ? "text-gray-900" : "text-gray-500"}>
                   {selectedCountry ? selectedCountry.country_name.charAt(0).toUpperCase() + selectedCountry.country_name.slice(1) : "Select a country"}
                 </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {countryDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {countries.map((country) => (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-3 py-2.5 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer text-left flex items-center justify-between"
                    >
                                             <div className="flex flex-col flex-1">
                         <span className="font-medium text-gray-900 leading-tight">{country.country_name.charAt(0).toUpperCase() + country.country_name.slice(1)}</span>
                         <span className="text-sm text-gray-500 leading-tight">Country #{country.id}</span>
                       </div>
                                             {countryId === country.id.toString() && (
                         <Check className="w-4 h-4 text-[var(--theme-green)] ml-3" />
                       )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Circuit Selection */}
        <div className="space-y-2">
          <Label htmlFor="circuit" className="text-sm font-medium text-gray-700">
            Select Type
          </Label>
          {circuitsLoading ? (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
              Loading circuits...
            </div>
          ) : circuits.length === 0 ? (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
              No circuits available
            </div>
          ) : (
            <div className="relative" ref={circuitDropdownRef}>
              <button
                type="button"
                onClick={() => setCircuitDropdownOpen(!circuitDropdownOpen)}
                className="w-full h-10 border border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 flex items-center justify-between text-left"
              >
                                 <span className={selectedCircuit ? "text-gray-900" : "text-gray-500"}>
                   {selectedCircuit ? selectedCircuit.national_park_circuit_name.charAt(0).toUpperCase() + selectedCircuit.national_park_circuit_name.slice(1) : "Select a transport type"}
                 </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${circuitDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {circuitDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {circuits.map((circuit) => (
                    <button
                      key={circuit.id}
                      type="button"
                      onClick={() => handleCircuitSelect(circuit)}
                      className="w-full px-3 py-2.5 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer text-left flex items-center justify-between"
                    >
                                             <div className="flex flex-col flex-1">
                         <span className="font-medium text-gray-900 leading-tight">{circuit.national_park_circuit_name.charAt(0).toUpperCase() + circuit.national_park_circuit_name.slice(1)}</span>
                         <span className="text-sm text-gray-500 leading-tight">Circuit #{circuit.id}</span>
                       </div>
                                             {circuitId === circuit.id.toString() && (
                         <Check className="w-4 h-4 text-[var(--theme-green)] ml-3" />
                       )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Park Name */}
        <div className="space-y-2">
          <Label htmlFor="parkName" className="text-sm font-medium text-gray-700">
            Park Name
          </Label>
          <input
            id="parkName"
            type="text"
            value={parkName}
            onChange={(e) => setParkName(e.target.value)}
            placeholder="Enter park name"
            required
            className="w-full h-10 border border-gray-300 bg-white hover:border-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500"
          />
        </div>



        

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            CANCEL
          </Button>
                     <Button 
             type="submit" 
             disabled={loading}
             className="px-6 py-2 bg-[var(--theme-green)] text-white hover:bg-[var(--theme-green-dark)] disabled:opacity-50"
           >
             {loading ? "SAVING..." : (park ? "UPDATE" : "SAVE")}
           </Button>
        </div>
      </form>
    </div>
  );
} 