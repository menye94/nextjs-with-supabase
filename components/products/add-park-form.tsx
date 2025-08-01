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
  editPark?: {
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

export function AddParkForm({ onClose, onSuccess, editPark }: AddParkFormProps) {
  const [parkName, setParkName] = useState(editPark?.national_park_name || "");
  const [countryId, setCountryId] = useState(editPark?.country_id.toString() || "1");
  const [circuitId, setCircuitId] = useState(editPark?.park_circuit_id.toString() || "1");
  const [isActive, setIsActive] = useState(editPark?.is_active ?? true);
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

  useEffect(() => {
    fetchCountries();
    fetchCircuits();
  }, []);

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
        setError(`Failed to load countries: ${error.message}`);
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
        setError(`Failed to load circuits: ${error.message}`);
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
      if (editPark) {
        // Update existing park
        const { error } = await supabase
          .from('national_parks')
          .update({
            national_park_name: parkName.trim(),
            country_id: parseInt(countryId),
            park_circuit_id: parseInt(circuitId),
            is_active: isActive,
          })
          .eq('id', editPark.id);

        if (error) {
          console.error('Error updating park:', error);
          setError(error.message);
          return;
        }
      } else {
        // Insert new park
        const { error } = await supabase
          .from('national_parks')
          .insert({
            national_park_name: parkName.trim(),
            country_id: parseInt(countryId),
            park_circuit_id: parseInt(circuitId),
            is_active: isActive,
          });

        if (error) {
          console.error('Error adding park:', error);
          setError(error.message);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving park:', error);
      setError("An unexpected error occurred");
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
                         <Check className="w-4 h-4 text-green-600 ml-3" />
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
                         <Check className="w-4 h-4 text-green-600 ml-3" />
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
             className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
           >
             {loading ? "SAVING..." : (editPark ? "UPDATE" : "SAVE")}
           </Button>
        </div>
      </form>
    </div>
  );
} 