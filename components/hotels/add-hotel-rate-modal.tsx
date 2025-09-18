"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";

interface HotelRate {
  id: number;
  hotel_id: number;
  hotel_room_id: number;
  rate: number;
  meal_plan_id: number;
  tax_behavior: number;
  hotel_season_id: number;
  hotel_rates_option_id: number;
  currency_id: number;
  entry_type_id?: number;
  hotel_pricing_type_id: number;
}

interface Hotel {
  id: number;
  hotel_name: string;
}

interface HotelRoom {
  id: number;
  room_id: number;
  rooms: {
    room_name: string;
  }[];
}

interface MealPlan {
  id: number;
  name: string;
}

interface TaxBehavior {
  id: number;
  name: string;
}

interface HotelSeason {
  id: number;
  season_name: string;
  start_date?: string;
  end_date?: string;
}

interface GroupedHotelSeason {
  season_name: string;
  season_ids: number[];
  display_text: string;
}

interface HotelRatesOption {
  id: number;
  option_name: string;
}

interface Currency {
  id: number;
  currency_name: string;
}

interface EntryType {
  id: number;
  entry_name: string;
}

interface HotelPricingType {
  id: number;
  name: string;
}

interface AddHotelRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRate?: HotelRate | null;
}

export function AddHotelRateModal({ isOpen, onClose, onSuccess, editingRate }: AddHotelRateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    hotel_id: "",
    hotel_room_ids: [] as string[], // Changed from hotel_room_id to hotel_room_ids array
    rate: "",
    meal_plan_id: "",
    hotel_pricing_type_id: "",
    tax_behavior: "",
    hotel_season_name: "", // Changed from hotel_season_id to hotel_season_name
    hotel_rates_option_id: "",
    currency_id: "",
    entry_type_id: "",
  });

  // Data states
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelRooms, setHotelRooms] = useState<HotelRoom[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [taxBehaviors, setTaxBehaviors] = useState<TaxBehavior[]>([]);
  const [hotelSeasons, setHotelSeasons] = useState<HotelSeason[]>([]);
  const [groupedHotelSeasons, setGroupedHotelSeasons] = useState<GroupedHotelSeason[]>([]);
  const [hotelRatesOptions, setHotelRatesOptions] = useState<HotelRatesOption[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [hotelPricingTypes, setHotelPricingTypes] = useState<HotelPricingType[]>([]);
  const [loadingHotelData, setLoadingHotelData] = useState(false);

  const supabase = createClient();

  // Fetch all required data
  useEffect(() => {
    if (isOpen) {
      fetchHotels();
      fetchMealPlans();
      fetchTaxBehaviors();
      fetchHotelRatesOptions();
      fetchCurrencies();
      fetchEntryTypes();
      fetchHotelPricingTypes();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingRate && isOpen) {
      setFormData({
        hotel_id: editingRate.hotel_id.toString(),
        hotel_room_ids: [editingRate.hotel_room_id.toString()], // Convert to array for multi-select
        rate: editingRate.rate.toString(),
        meal_plan_id: editingRate.meal_plan_id.toString(),
        hotel_pricing_type_id: editingRate.hotel_pricing_type_id.toString(),
        tax_behavior: editingRate.tax_behavior.toString(),
        hotel_season_name: "", // Will be set after fetching seasons
        hotel_rates_option_id: editingRate.hotel_rates_option_id.toString(),
        currency_id: editingRate.currency_id.toString(),
        entry_type_id: editingRate.entry_type_id?.toString() || "",
      });
      // Fetch hotel-specific data for editing
      fetchHotelRooms(editingRate.hotel_id.toString());
      fetchHotelSeasons(editingRate.hotel_id.toString());
    } else if (!editingRate && isOpen) {
      // Reset form for new entry
      setFormData({
        hotel_id: "",
        hotel_room_ids: [], // Reset to empty array
        rate: "",
        meal_plan_id: "",
        hotel_pricing_type_id: "",
        tax_behavior: "",
        hotel_season_name: "",
        hotel_rates_option_id: "",
        currency_id: "",
        entry_type_id: "",
      });
      // Clear hotel-specific data
      setHotelRooms([]);
      setHotelSeasons([]);
      setGroupedHotelSeasons([]);
    }
  }, [editingRate, isOpen]);

  // Set season name for editing when grouped seasons are loaded
  useEffect(() => {
    if (editingRate && groupedHotelSeasons.length > 0) {
      // Find the season name that contains the editing rate's season ID
      const matchingGroup = groupedHotelSeasons.find(group => 
        group.season_ids.includes(editingRate.hotel_season_id)
      );
      
      if (matchingGroup) {
        setFormData(prev => ({
          ...prev,
          hotel_season_name: matchingGroup.season_name
        }));
      }
    }
  }, [editingRate, groupedHotelSeasons]);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, hotel_name')
        .order('hotel_name');
      
      if (error) throw error;
      console.log('Available hotels:', data);
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const fetchHotelRooms = async (hotelId?: string) => {
    try {
      if (!hotelId) {
        setHotelRooms([]);
        return;
      }

      console.log('Fetching rooms for hotel ID:', hotelId);

      // First, let's see what hotel_rooms exist in total
      const { data: allHotelRooms, error: allHotelRoomsError } = await supabase
        .from('hotel_rooms')
        .select('id, room_id, hotel_id');
      
      console.log('All hotel_rooms in database:', allHotelRooms);
      console.log('All hotel_rooms error:', allHotelRoomsError);

      // Always use the fallback approach for better reliability
      const { data: hotelRoomsData, error: hotelRoomsError } = await supabase
        .from('hotel_rooms')
        .select('id, room_id, hotel_id')
        .eq('hotel_id', parseInt(hotelId));
      
      if (hotelRoomsError) {
        console.error('Error fetching hotel rooms:', hotelRoomsError);
        throw hotelRoomsError;
      }
      
      let data = [];
      if (hotelRoomsData && hotelRoomsData.length > 0) {
        const roomIds = hotelRoomsData.map(hr => hr.room_id);
        
        // Let's also see what rooms exist in total
        const { data: allRooms, error: allRoomsError } = await supabase
          .from('rooms')
          .select('id, room_name');
        
        console.log('All rooms in database:', allRooms);
        console.log('All rooms error:', allRoomsError);

        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('id, room_name')
          .in('id', roomIds);
        
        if (roomsError) {
          console.error('Error fetching rooms:', roomsError);
          throw roomsError;
        }
        
        // Combine the data
        data = hotelRoomsData.map(hr => {
          const room = roomsData?.find(r => r.id === hr.room_id);
          return {
            id: hr.id,
            room_id: hr.room_id,
            rooms: room ? [{ room_name: room.room_name }] : [{ room_name: 'Unknown Room' }]
          };
        });
      }
      
      console.log('Hotel rooms for hotel', hotelId, ':', data);
      console.log('Number of rooms found:', data?.length || 0);
      console.log('Hotel rooms data structure:', JSON.stringify(data, null, 2));
      
      setHotelRooms(data || []);
    } catch (error) {
      console.error('Error fetching hotel rooms:', error);
      setHotelRooms([]);
    }
  };

  const fetchMealPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_meal_plans')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setMealPlans(data || []);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    }
  };

  const fetchTaxBehaviors = async () => {
    try {
      const { data, error } = await supabase
        .from('tax_behaviour')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setTaxBehaviors(data || []);
    } catch (error) {
      console.error('Error fetching tax behaviors:', error);
    }
  };

  const fetchHotelSeasons = async (hotelId?: string) => {
    try {
      if (!hotelId) {
        setHotelSeasons([]);
        setGroupedHotelSeasons([]);
        return;
      }

      const { data, error } = await supabase
        .from('hotels_seasons')
        .select('id, season_name, start_date, end_date')
        .eq('hotel_id', parseInt(hotelId))
        .order('season_name, start_date');
      
      if (error) throw error;
      console.log('Hotel seasons for hotel', hotelId, ':', data);
      setHotelSeasons(data || []);
      
      // Group seasons by name
      const grouped = groupSeasonsByName(data || []);
      setGroupedHotelSeasons(grouped);
    } catch (error) {
      console.error('Error fetching hotel seasons:', error);
    }
  };

  const groupSeasonsByName = (seasons: HotelSeason[]): GroupedHotelSeason[] => {
    const groupedMap = new Map<string, { ids: number[] }>();
    
    seasons.forEach(season => {
      if (!groupedMap.has(season.season_name)) {
        groupedMap.set(season.season_name, { ids: [] });
      }
      
      const group = groupedMap.get(season.season_name)!;
      group.ids.push(season.id);
    });
    
    return Array.from(groupedMap.entries()).map(([seasonName, group]) => ({
      season_name: seasonName,
      season_ids: group.ids,
      display_text: seasonName
    }));
  };

  const fetchHotelRatesOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_rates_option')
        .select('id, option_name')
        .order('option_name');
      
      if (error) throw error;
      setHotelRatesOptions(data || []);
    } catch (error) {
      console.error('Error fetching hotel rates options:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currency')
        .select('id, currency_name')
        .order('currency_name');
      
      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchEntryTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('entry_type')
        .select('id, entry_name')
        .order('entry_name');
      
      if (error) throw error;
      setEntryTypes(data || []);
    } catch (error) {
      console.error('Error fetching entry types:', error);
    }
  };

  const fetchHotelPricingTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_pricing_type')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setHotelPricingTypes(data || []);
    } catch (error) {
      console.error('Error fetching hotel pricing types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.hotel_room_ids || formData.hotel_room_ids.length === 0) {
        throw new Error('Please select at least one hotel room');
      }

      // Find the selected grouped season
      const selectedGroupedSeason = groupedHotelSeasons.find(
        group => group.season_name === formData.hotel_season_name
      );

      if (!selectedGroupedSeason) {
        throw new Error('Please select a valid season');
      }

                     const baseRateData = {
          hotel_id: parseInt(formData.hotel_id),
          rate: parseFloat(formData.rate),
          meal_plan_id: parseInt(formData.meal_plan_id),
          hotel_pricing_type_id: parseInt(formData.hotel_pricing_type_id),
          tax_behavior: parseInt(formData.tax_behavior),
          hotel_rates_option_id: parseInt(formData.hotel_rates_option_id),
          currency_id: parseInt(formData.currency_id),
          entry_type_id: formData.entry_type_id ? parseInt(formData.entry_type_id) : null,
        };

      if (editingRate) {
        // For editing, we need to check if the new combination would create a duplicate
        const newRoomId = parseInt(formData.hotel_room_ids[0] || "0");
        const newSeasonId = selectedGroupedSeason.season_ids[0];
        
        // Check if this combination already exists (excluding the current record being edited)
        const existingRate = await supabase
          .from('hotel_rates')
          .select('id')
          .eq('hotel_id', baseRateData.hotel_id)
          .eq('hotel_room_id', newRoomId)
          .eq('hotel_season_id', newSeasonId)
          .eq('meal_plan_id', baseRateData.meal_plan_id)
          .eq('hotel_rates_option_id', baseRateData.hotel_rates_option_id)
          .eq('hotel_pricing_type_id', baseRateData.hotel_pricing_type_id)
          .eq('entry_type_id', baseRateData.entry_type_id)
          .neq('id', editingRate.id) // Exclude the current record being edited
          .single();

        // If a duplicate exists (excluding the current record), show an error
        if (!existingRate.error || existingRate.error.code !== 'PGRST116') {
          const roomName = hotelRooms.find(hr => hr.id === newRoomId)?.rooms[0]?.room_name || 'Unknown Room';
          const seasonName = hotelSeasons.find(s => s.id === newSeasonId)?.season_name || 'Unknown Season';
          throw new Error(`A rate for ${roomName} - ${seasonName} already exists with these settings. Please choose different options.`);
        }

        // Update the record
        const { error } = await supabase
          .from('hotel_rates')
          .update({
            ...baseRateData,
            hotel_room_id: newRoomId,
            hotel_season_id: newSeasonId
          })
          .eq('id', editingRate.id);

        if (error) {
          console.error('Update error details:', error);
          if (error.code === '23505') { // Unique constraint violation
            throw new Error('A rate with this exact combination already exists. Please check your selections and try again.');
          }
          throw error;
        }
        
        alert('Hotel rate updated successfully');
      } else {
        // For new entries, create rates for each selected room and season combination
        const rateDataArray: any[] = [];
        const existingCombinations: string[] = [];

        // For each selected room and season combination
        for (const roomId of formData.hotel_room_ids) {
          for (const seasonId of selectedGroupedSeason.season_ids) {
            // Check if this combination already exists (based on the actual unique constraint)
            const existingRate = await supabase
              .from('hotel_rates')
              .select('id')
              .eq('hotel_id', baseRateData.hotel_id)
              .eq('hotel_room_id', parseInt(roomId))
              .eq('hotel_season_id', seasonId)
              .eq('meal_plan_id', baseRateData.meal_plan_id)
              .eq('hotel_rates_option_id', baseRateData.hotel_rates_option_id)
              .eq('hotel_pricing_type_id', baseRateData.hotel_pricing_type_id)
              .eq('entry_type_id', baseRateData.entry_type_id)
              .single();

            // Only add if it doesn't exist
            if (existingRate.error && existingRate.error.code === 'PGRST116') {
              rateDataArray.push({
                ...baseRateData,
                hotel_room_id: parseInt(roomId),
                hotel_season_id: seasonId
              });
            } else {
              // Track existing combinations for better error reporting
              const roomName = hotelRooms.find(hr => hr.id === parseInt(roomId))?.rooms[0]?.room_name || 'Unknown Room';
              const seasonName = hotelSeasons.find(s => s.id === seasonId)?.season_name || 'Unknown Season';
              existingCombinations.push(`${roomName} - ${seasonName}`);
            }
          }
        }

        if (rateDataArray.length === 0) {
          const existingMessage = existingCombinations.length > 0 
            ? `\n\nExisting combinations:\n${existingCombinations.join('\n')}`
            : '';
          alert(`Rates for these combinations already exist.${existingMessage}`);
          return;
        }

        const { error } = await supabase
          .from('hotel_rates')
          .insert(rateDataArray);

        if (error) {
          console.error('Insert error details:', error);
          if (error.code === '23505') { // Unique constraint violation
            throw new Error('A rate with this exact combination already exists. Please check your selections and try again.');
          }
          throw error;
        }
        
        const totalCombinations = formData.hotel_room_ids.length * selectedGroupedSeason.season_ids.length;
        const skippedCount = totalCombinations - rateDataArray.length;
        
        let message = `Hotel rate added successfully for ${rateDataArray.length} combination(s).`;
        
        if (existingCombinations.length > 0) {
          message += `\n\nSkipped ${existingCombinations.length} existing combination(s):\n${existingCombinations.join('\n')}`;
        }
        
        alert(message);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving hotel rate:', error);
      alert(`Error saving hotel rate: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHotelChange = (hotelId: string) => {
    setFormData(prev => ({
      ...prev,
      hotel_id: hotelId,
      hotel_room_ids: [], // Reset hotel rooms when hotel changes
      hotel_season_name: "", // Reset hotel season when hotel changes
    }));
    
    if (hotelId) {
      setLoadingHotelData(true);
      // Fetch hotel-specific data
      Promise.all([
        fetchHotelRooms(hotelId),
        fetchHotelSeasons(hotelId)
      ]).finally(() => {
        setLoadingHotelData(false);
      });
    } else {
      setHotelRooms([]);
      setHotelSeasons([]);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto z-[1001] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-[1002]">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingRate ? 'Edit Hotel Rate' : 'Add Hotel Rate'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
                         {/* Hotel Selection */}
             <div>
               <SearchableDropdown
                 id="hotel_id"
                 label="Hotel *"
                 options={hotels.map(hotel => ({
                   id: hotel.id,
                   value: hotel.id.toString(),
                   label: hotel.hotel_name
                 }))}
                 value={formData.hotel_id}
                 onChange={(value) => handleHotelChange(value)}
                 placeholder="Select a hotel"
                 disabled={isSubmitting}
               />
             </div>

                                                   {/* Hotel Room Selection */}
              <div>

                <MultiSelectDropdown
                  id="hotel_room_ids"
                  label={`Hotel Rooms *${loadingHotelData && formData.hotel_id ? ' (Loading...)' : ''}`}
                  options={hotelRooms.map(hotelRoom => ({
                    id: hotelRoom.id,
                    value: hotelRoom.id.toString(),
                    label: hotelRoom.rooms[0]?.room_name || 'Unknown Room'
                  }))}
                  value={formData.hotel_room_ids}
                  onChange={(values) => setFormData({ ...formData, hotel_room_ids: values })}
                  placeholder={
                    !formData.hotel_id 
                      ? "Please select a hotel first" 
                      : loadingHotelData 
                        ? "Loading rooms..." 
                        : hotelRooms.length === 0 
                          ? "No rooms found for this hotel" 
                          : "Select hotel rooms"
                  }
                  disabled={isSubmitting || !formData.hotel_id || loadingHotelData}
                />
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mt-1">
                    Debug: {hotelRooms.length} rooms loaded, hotelRooms: {JSON.stringify(hotelRooms.map(hr => ({ id: hr.id, room_name: hr.rooms[0]?.room_name })))}
                  </div>
                )}
              </div>

            {/* Rate */}
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
                Rate *
              </label>
              <input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="0.00"
                required
                disabled={isSubmitting}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Meal Plan and Pricing Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="meal_plan_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Plan *
                </label>
                <select
                  id="meal_plan_id"
                  value={formData.meal_plan_id}
                  onChange={(e) => setFormData({ ...formData, meal_plan_id: e.target.value })}
                  required
                  disabled={isSubmitting}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select meal plan</option>
                  {mealPlans.map((mealPlan) => (
                    <option key={mealPlan.id} value={mealPlan.id}>
                      {mealPlan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hotel_pricing_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Type *
                </label>
                <select
                  id="hotel_pricing_type_id"
                  value={formData.hotel_pricing_type_id}
                  onChange={(e) => setFormData({ ...formData, hotel_pricing_type_id: e.target.value })}
                  required
                  disabled={isSubmitting}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select pricing type</option>
                  {hotelPricingTypes.map((pricingType) => (
                    <option key={pricingType.id} value={pricingType.id}>
                      {pricingType.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tax Behavior and Hotel Season */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tax_behavior" className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Behavior *
                </label>
                <select
                  id="tax_behavior"
                  value={formData.tax_behavior}
                  onChange={(e) => setFormData({ ...formData, tax_behavior: e.target.value })}
                  required
                  disabled={isSubmitting}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select tax behavior</option>
                  {taxBehaviors.map((taxBehavior) => (
                    <option key={taxBehavior.id} value={taxBehavior.id}>
                      {taxBehavior.name}
                    </option>
                  ))}
                </select>
              </div>

                             <div>
                 <label htmlFor="hotel_season_name" className="block text-sm font-medium text-gray-700 mb-2">
                   Hotel Season *
                   {loadingHotelData && formData.hotel_id && (
                     <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                   )}
                   {formData.hotel_season_name && !loadingHotelData && (
                     <span className="ml-2 text-xs text-blue-600">
                       (Will create {groupedHotelSeasons.find(g => g.season_name === formData.hotel_season_name)?.season_ids.length || 0} rate(s))
                     </span>
                   )}
                 </label>
                 <select
                   id="hotel_season_name"
                   value={formData.hotel_season_name}
                   onChange={(e) => setFormData({ ...formData, hotel_season_name: e.target.value })}
                   required
                   disabled={isSubmitting || !formData.hotel_id || loadingHotelData}
                   className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <option value="">
                     {!formData.hotel_id 
                       ? "Please select a hotel first" 
                       : loadingHotelData 
                         ? "Loading seasons..." 
                         : groupedHotelSeasons.length === 0 
                           ? "No seasons found for this hotel" 
                           : "Select hotel season"
                     }
                   </option>
                   {groupedHotelSeasons.map((group) => (
                     <option key={group.season_name} value={group.season_name}>
                       {group.display_text}
                     </option>
                   ))}
                 </select>
               </div>
            </div>

            {/* Rates Option and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hotel_rates_option_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Rates Option *
                </label>
                <select
                  id="hotel_rates_option_id"
                  value={formData.hotel_rates_option_id}
                  onChange={(e) => setFormData({ ...formData, hotel_rates_option_id: e.target.value })}
                  required
                  disabled={isSubmitting}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select rates option</option>
                  {hotelRatesOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.option_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="currency_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  id="currency_id"
                  value={formData.currency_id}
                  onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                  required
                  disabled={isSubmitting}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.currency_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entry Type (Optional) */}
            <div>
              <label htmlFor="entry_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                Entry Type (Optional)
              </label>
              <select
                id="entry_type_id"
                value={formData.entry_type_id}
                onChange={(e) => setFormData({ ...formData, entry_type_id: e.target.value })}
                disabled={isSubmitting}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select entry type (optional)</option>
                {entryTypes.map((entryType) => (
                  <option key={entryType.id} value={entryType.id}>
                    {entryType.entry_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[var(--theme-green)] text-white rounded-md text-sm font-medium hover:bg-[var(--theme-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? (editingRate ? "Updating..." : "Creating...")
                  : (editingRate ? "Update" : "Add")
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 