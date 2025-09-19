"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Users, Calendar, DollarSign, Star, Bed, Edit } from "lucide-react";
import { QuoteData, HotelSelection } from "@/app/quote-create/page";

interface AccommodationStepProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

interface Hotel {
  id: number;
  hotel_name: string;
  category_name: string;
  city_name: string | null;
  national_park_name: string | null;
  is_partner: boolean;
}

interface HotelCategory {
  id: number;
  name: string;
}

interface RoomType {
  id: number;
  room_name: string;
  room_description: string;
}

interface MealPlan {
  id: number;
  name: string;
  meal_plan_abbr: string;
}

interface HotelRate {
  id: number;
  rate: number;
  currency_name: string;
  meal_plan_name: string;
  entry_name: string;
}

interface EntryType {
  id: number;
  entry_name: string;
}

export function AccommodationStep({ quoteData, updateQuoteData, errors, setErrors }: AccommodationStepProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<HotelCategory[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [hotelRates, setHotelRates] = useState<HotelRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedMealPlan, setSelectedMealPlan] = useState('');
  const [selectedEntryType, setSelectedEntryType] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [numberOfNights, setNumberOfNights] = useState(1);
  const [pricePerNight, setPricePerNight] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'TZS'>('USD');
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
    loadSelectedHotels();
  }, []);

  // Load selected hotels from database
  const loadSelectedHotels = async () => {
    try {
      const tempOffer = await getOrCreateTempOffer();
      if (!tempOffer) return;

      const { data: hotelServices, error } = await supabase
        .from('offer_hotel_services')
        .select(`
          id,
          price,
          discount_percent,
          final_service_price,
          description,
          hotel_rate_id,
          hotel_rates!inner(
            hotel_id,
            hotels!inner(
              hotel_name,
              hotel_category!inner(name)
            ),
            rooms!inner(room_name),
            hotel_meal_plans!inner(name),
            entry_type!inner(entry_name),
            currency!inner(currency_name)
          )
        `)
        .eq('offer_id', tempOffer.id);

      if (error) {
        console.error('Error loading hotel services:', error);
        return;
      }

      if (hotelServices && hotelServices.length > 0) {
        const loadedHotels: HotelSelection[] = hotelServices.map(service => {
          const hotelRate = service.hotel_rates;
          const hotel = hotelRate.hotels;
          const room = hotelRate.rooms;
          const mealPlan = hotelRate.hotel_meal_plans;
          const entryType = hotelRate.entry_type;
          const currency = hotelRate.currency;

          // Parse description for additional data
          const description = service.description || '';
          const [checkIn, checkOut, nights, pax] = description.split('|');

          return {
            id: service.id.toString(),
            hotelId: hotelRate.hotel_id,
            hotelName: hotel.hotel_name,
            roomType: room.room_name,
            checkIn: checkIn || new Date().toISOString().split('T')[0],
            checkOut: checkOut || new Date().toISOString().split('T')[0],
            nights: parseInt(nights) || 1,
            pax: parseInt(pax) || 1,
            price: parseFloat(service.final_service_price) || 0,
            currency: currency.currency_name.toUpperCase() as 'USD' | 'TZS'
          };
        });

        updateQuoteData({ selectedHotels: loadedHotels });
        console.log('Loaded hotel services from database:', loadedHotels);
      }
    } catch (error) {
      console.error('Error loading selected hotels:', error);
    }
  };

  // Get or create temporary offer for testing
  const getOrCreateTempOffer = async () => {
    try {
      // First try to get existing temp offer
      const { data: existingOffers, error: fetchError } = await supabase
        .from('offer')
        .select('id')
        .eq('id', 8) // Use the same temp offer ID as parks
        .limit(1);

      if (fetchError) {
        console.error('Error fetching temp offer:', fetchError);
        return null;
      }

      if (existingOffers && existingOffers.length > 0) {
        return existingOffers[0];
      }

      // Create new temp offer if none exists
      const { data: newOffer, error: createError } = await supabase
        .from('offer')
        .insert({
          client_id: 8,
          owner_id: '9be45380-53cf-4d8a-a4d1-f0a63cdda5a3', // Use existing company owner
          offer_name: 'Temp Hotel Services Offer',
          status: 'draft'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating temp offer:', createError);
        return null;
      }

      return newOffer;
    } catch (error) {
      console.error('Error in getOrCreateTempOffer:', error);
      return null;
    }
  };

  // Save selected hotels to database
  const saveSelectedHotels = async (hotelsToSave: HotelSelection[]) => {
    try {
      const tempOffer = await getOrCreateTempOffer();
      if (!tempOffer) {
        console.error('Could not get or create temp offer');
        return;
      }

      // Clear existing hotel services for this offer
      await supabase
        .from('offer_hotel_services')
        .delete()
        .eq('offer_id', tempOffer.id);

      if (hotelsToSave.length === 0) {
        console.log('No hotels to save');
        return;
      }

      // Get hotel rates for each selected hotel
      const hotelServicesData = [];
      
      for (const hotel of hotelsToSave) {
        // Find the hotel rate ID for this hotel
        const { data: hotelRates, error: ratesError } = await supabase
          .from('hotel_rates')
          .select('id')
          .eq('hotel_id', hotel.hotelId)
          .limit(1);

        if (ratesError || !hotelRates || hotelRates.length === 0) {
          console.warn(`No hotel rates found for hotel ${hotel.hotelId}`);
          continue;
        }

        const hotelRateId = hotelRates[0].id;
        const unitPrice = hotel.nights > 0 && hotel.pax > 0 ? hotel.price / (hotel.nights * hotel.pax) : 0;
        const discountPercent = 0; // Default discount
        const calculatedFinalPrice = unitPrice * hotel.nights * hotel.pax * (1 - discountPercent / 100);
        
        // Create description with hotel details
        const description = `${hotel.checkIn}|${hotel.checkOut}|${hotel.nights}|${hotel.pax}`;

        hotelServicesData.push({
          offer_id: tempOffer.id,
          hotel_rate_id: hotelRateId,
          price: unitPrice,
          discount_percent: discountPercent,
          final_service_price: calculatedFinalPrice,
          description: description
        });
      }

      if (hotelServicesData.length > 0) {
        const { error: insertError } = await supabase
          .from('offer_hotel_services')
          .insert(hotelServicesData);

        if (insertError) {
          console.error('Error inserting hotel services:', insertError);
        } else {
          console.log('Successfully saved hotel services to database');
        }
      }
    } catch (error) {
      console.error('Error saving selected hotels:', error);
    }
  };

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch hotel categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('hotel_category')
        .select('id, name')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching hotel categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

      // Fetch room types
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('rooms')
        .select('id, room_name, room_description')
        .eq('is_active', true)
        .order('room_name');

      if (roomTypesError) {
        console.error('Error fetching room types:', roomTypesError);
      } else {
        setRoomTypes(roomTypesData || []);
      }

      // Fetch meal plans
      const { data: mealPlansData, error: mealPlansError } = await supabase
        .from('hotel_meal_plans')
        .select('id, name, meal_plan_abbr')
        .order('name');

      if (mealPlansError) {
        console.error('Error fetching meal plans:', mealPlansError);
      } else {
        setMealPlans(mealPlansData || []);
      }

      // Fetch entry types
      const { data: entryTypesData, error: entryTypesError } = await supabase
        .from('entry_type')
        .select('id, entry_name')
        .eq('is_active', true)
        .order('entry_name');

      if (entryTypesError) {
        console.error('Error fetching entry types:', entryTypesError);
      } else {
        setEntryTypes(entryTypesData || []);
      }

      // Fetch hotels
      await fetchHotels();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      let query = supabase
        .from('hotels')
        .select(`
          id,
          hotel_name,
          is_active,
          is_partner,
          hotel_category!inner(name),
          locations!inner(
            city_id,
            cities(city_name),
            national_parks(national_park_name)
          )
        `)
        .eq('is_active', true);

      if (selectedCategory) {
        query = query.eq('hotel_category.name', selectedCategory);
      }

      const { data: hotelsData, error: hotelsError } = await query;

      if (hotelsError) {
        console.error('Error fetching hotels:', hotelsError);
      } else {
        const transformedHotels = (hotelsData || []).map(hotel => ({
          id: hotel.id,
          hotel_name: hotel.hotel_name,
          category_name: hotel.hotel_category.name,
          city_name: hotel.locations.cities?.city_name || null,
          national_park_name: hotel.locations.national_parks?.national_park_name || null,
          is_partner: hotel.is_partner
        }));

        // Get selected national parks from quote data
        const selectedNationalParks = quoteData.selectedParks?.map(park => park.nationalParkName) || [];
        
        // Sort hotels to prioritize those in selected national park locations
        const sortedHotels = transformedHotels.sort((a, b) => {
          const aIsInSelectedPark = a.national_park_name && selectedNationalParks.includes(a.national_park_name);
          const bIsInSelectedPark = b.national_park_name && selectedNationalParks.includes(b.national_park_name);
          
          // First priority: Hotels in selected national parks
          if (aIsInSelectedPark && !bIsInSelectedPark) return -1;
          if (!aIsInSelectedPark && bIsInSelectedPark) return 1;
          
          // Second priority: Partner hotels
          if (a.is_partner && !b.is_partner) return -1;
          if (!a.is_partner && b.is_partner) return 1;
          
          // Third priority: Alphabetical by name
          return a.hotel_name.localeCompare(b.hotel_name);
        });

        setHotels(sortedHotels);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchHotels();
    }
  }, [selectedCategory]);

  // Refresh hotels when selected parks change
  useEffect(() => {
    if (selectedCategory) {
      fetchHotels();
    }
  }, [quoteData.selectedParks]);

  useEffect(() => {
    if (selectedHotel && selectedMealPlan && selectedEntryType) {
      fetchHotelRates();
    }
  }, [selectedHotel, selectedMealPlan, selectedEntryType]);

  const fetchHotelRates = async () => {
    try {
      const { data: ratesData, error: ratesError } = await supabase
        .from('hotel_rates')
        .select(`
          id,
          rate,
          currency_id,
          currency!inner(currency_name),
          meal_plan_id,
          hotel_meal_plans!inner(name),
          entry_type_id,
          entry_type!inner(entry_name)
        `)
        .eq('hotel_id', parseInt(selectedHotel))
        .eq('hotel_meal_plans.name', selectedMealPlan)
        .eq('entry_type.entry_name', selectedEntryType);

      if (ratesError) {
        console.error('Error fetching hotel rates:', ratesError);
      } else {
        const transformedRates = (ratesData || []).map(rate => ({
          id: rate.id,
          rate: rate.rate,
          currency_name: rate.currency.currency_name,
          meal_plan_name: rate.hotel_meal_plans.name,
          entry_name: rate.entry_type.entry_name
        }));
        setHotelRates(transformedRates);
        
        // Set the first rate as default price
        if (transformedRates.length > 0) {
          const firstRate = transformedRates[0];
          setPricePerNight(firstRate.rate);
          setSelectedCurrency(firstRate.currency_name.toUpperCase() as 'USD' | 'TZS');
        }
      }
    } catch (error) {
      console.error('Error fetching hotel rates:', error);
    }
  };

  const addHotelSelection = async () => {
    if (!selectedHotel || !selectedRoomType || !selectedMealPlan || !selectedEntryType) return;

    const hotel = hotels.find(h => h.id.toString() === selectedHotel);
    const roomType = roomTypes.find(r => r.id.toString() === selectedRoomType);
    
    if (!hotel || !roomType) return;

    // Calculate check-in and check-out dates based on trip dates
    const checkIn = quoteData.startDate || new Date().toISOString().split('T')[0];
    const checkOut = quoteData.endDate || new Date(Date.now() + numberOfNights * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Calculate total price
    const totalPrice = pricePerNight * numberOfNights * numberOfRooms;

    if (isEditing && editingHotelId) {
      // Update existing hotel selection
      updateQuoteData({
        selectedHotels: quoteData.selectedHotels.map(hotel =>
          hotel.id === editingHotelId ? {
            ...hotel,
            hotelId: parseInt(selectedHotel),
            hotelName: hotel.hotel_name,
            roomType: roomType.room_name,
            checkIn: checkIn,
            checkOut: checkOut,
            nights: numberOfNights,
            pax: numberOfRooms,
            price: totalPrice,
            currency: selectedCurrency
          } : hotel
        )
      });
      
      // Reset editing state
      setIsEditing(false);
      setEditingHotelId(null);
    } else {
      // Add new hotel selection
      const newSelection: HotelSelection = {
        id: Date.now().toString(),
        hotelId: parseInt(selectedHotel),
        hotelName: hotel.hotel_name,
        roomType: roomType.room_name,
        checkIn: checkIn,
        checkOut: checkOut,
        nights: numberOfNights,
        pax: numberOfRooms, // Using rooms as pax for now
        price: totalPrice,
        currency: selectedCurrency
      };

      updateQuoteData({
        selectedHotels: [...quoteData.selectedHotels, newSelection]
      });
    }

    // Save to database
    const updatedHotels = isEditing && editingHotelId 
      ? quoteData.selectedHotels.map(hotel =>
          hotel.id === editingHotelId ? {
            ...hotel,
            hotelId: parseInt(selectedHotel),
            hotelName: hotel.hotel_name,
            roomType: roomType.room_name,
            checkIn: checkIn,
            checkOut: checkOut,
            nights: numberOfNights,
            pax: numberOfRooms,
            price: totalPrice,
            currency: selectedCurrency
          } : hotel
        )
      : [...quoteData.selectedHotels, newSelection];

    await saveSelectedHotels(updatedHotels);

    // Reset form
    setSelectedHotel('');
    setSelectedRoomType('');
    setSelectedMealPlan('');
    setSelectedEntryType('');
    setNumberOfRooms(1);
    setNumberOfNights(1);
    setPricePerNight(0);
    setHotelRates([]);
  };

  const editHotelSelection = (hotelId: string) => {
    const hotel = quoteData.selectedHotels.find(h => h.id === hotelId);
    if (!hotel) return;

    // Find the hotel data to get category
    const hotelData = hotels.find(h => h.id === hotel.hotelId);
    if (hotelData) {
      setSelectedCategory(hotelData.category_name);
    }

    // Populate form with hotel data
    setSelectedHotel(hotel.hotelId.toString());
    setSelectedRoomType(roomTypes.find(r => r.room_name === hotel.roomType)?.id.toString() || '');
    setSelectedMealPlan(''); // Will be set when room type is selected
    setSelectedEntryType(''); // Will be set when meal plan is selected
    setNumberOfRooms(hotel.pax);
    setNumberOfNights(hotel.nights);
    setPricePerNight(hotel.nights > 0 && hotel.pax > 0 ? hotel.price / (hotel.nights * hotel.pax) : 0);
    setSelectedCurrency(hotel.currency);

    // Set editing state
    setIsEditing(true);
    setEditingHotelId(hotelId);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingHotelId(null);
    
    // Reset form
    setSelectedHotel('');
    setSelectedRoomType('');
    setSelectedMealPlan('');
    setSelectedEntryType('');
    setNumberOfRooms(1);
    setNumberOfNights(1);
    setPricePerNight(0);
    setHotelRates([]);
  };

  const removeHotelSelection = async (id: string) => {
    const updatedHotels = quoteData.selectedHotels.filter(hotel => hotel.id !== id);
    updateQuoteData({
      selectedHotels: updatedHotels
    });
    
    // Save to database
    await saveSelectedHotels(updatedHotels);
  };

  const updateHotelSelection = async (id: string, updates: Partial<HotelSelection>) => {
    const updatedHotels = quoteData.selectedHotels.map(hotel =>
      hotel.id === id ? { ...hotel, ...updates } : hotel
    );
    
    updateQuoteData({
      selectedHotels: updatedHotels
    });
    
    // Save to database
    await saveSelectedHotels(updatedHotels);
  };

  return (
    <div className="space-y-6">
      {/* Hotel Selection Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-blue-600" />
            Hotel & Accommodation Selection
          </CardTitle>
          {quoteData.selectedParks && quoteData.selectedParks.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Selected National Parks:</p>
              <div className="flex flex-wrap gap-2">
                {quoteData.selectedParks.map((park, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    🏞️ {park.nationalParkName}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                💡 Hotels located in these national park areas will be prioritized in the selection below
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Selection Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Category and Hotel */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-select" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Star className="h-4 w-4 text-purple-500" />
                    Hotel Category *
                  </Label>
                  <SearchableDropdown
                    id="category-select"
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={[
                      { id: '', label: 'Select category', value: '' },
                      ...categories.map((category) => ({
                        id: category.id,
                        label: category.name,
                        value: category.name
                      }))
                    ]}
                    placeholder="Choose hotel category"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hotel-select" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-green-500" />
                      Hotel *
                    </Label>
                    {quoteData.selectedParks && quoteData.selectedParks.length > 0 && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        🏞️ Hotels in selected parks shown first
                      </div>
                    )}
                  </div>
                  <SearchableDropdown
                    id="hotel-select"
                    value={selectedHotel}
                    onChange={setSelectedHotel}
                    options={[
                      { id: '', label: 'Select hotel', value: '' },
                      ...hotels.map((hotel) => {
                        const selectedNationalParks = quoteData.selectedParks?.map(park => park.nationalParkName) || [];
                        const isInSelectedPark = hotel.national_park_name && selectedNationalParks.includes(hotel.national_park_name);
                        
                        let label = hotel.hotel_name;
                        if (isInSelectedPark) {
                          label += ' 🏞️'; // National park indicator
                        }
                        if (hotel.is_partner) {
                          label += ' ⭐'; // Partner indicator
                        }
                        
                        return {
                          id: hotel.id,
                          label: label,
                          value: hotel.id.toString()
                        };
                      })
                    ]}
                    placeholder="Choose hotel"
                    required
                    disabled={!selectedCategory}
                  />
                </div>
              </div>

              {/* Right Column - Room Type and Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-type-select" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Bed className="h-4 w-4 text-orange-500" />
                    Room Type *
                  </Label>
                  <SearchableDropdown
                    id="room-type-select"
                    value={selectedRoomType}
                    onChange={setSelectedRoomType}
                    options={[
                      { id: '', label: 'Select room type', value: '' },
                      ...roomTypes.map((roomType) => ({
                        id: roomType.id,
                        label: roomType.room_name,
                        value: roomType.id.toString()
                      }))
                    ]}
                    placeholder="Choose room type"
                    required
                    disabled={!selectedHotel}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meal-plan-select" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-purple-500" />
                      Meal Plan *
                    </Label>
                    <SearchableDropdown
                      id="meal-plan-select"
                      value={selectedMealPlan}
                      onChange={setSelectedMealPlan}
                      options={[
                        { id: '', label: 'Select meal plan', value: '' },
                        ...mealPlans.map((mealPlan) => ({
                          id: mealPlan.id,
                          label: `${mealPlan.name} (${mealPlan.meal_plan_abbr})`,
                          value: mealPlan.name
                        }))
                      ]}
                      placeholder="Choose meal plan"
                      required
                      disabled={!selectedRoomType}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entry-type-select" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Users className="h-4 w-4 text-indigo-500" />
                      Entry Type *
                    </Label>
                    <SearchableDropdown
                      id="entry-type-select"
                      value={selectedEntryType}
                      onChange={setSelectedEntryType}
                      options={[
                        { id: '', label: 'Select entry type', value: '' },
                        ...entryTypes.map((entryType) => ({
                          id: entryType.id,
                          label: entryType.entry_name,
                          value: entryType.entry_name
                        }))
                      ]}
                      placeholder="Choose entry type"
                      required
                      disabled={!selectedMealPlan}
                    />
                  </div>
                </div>

                {/* Price Display and Input */}
                {hotelRates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="price-per-night" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Price per Night ({selectedCurrency}) *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="price-per-night"
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
                        className="h-10 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        required
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant={selectedCurrency === 'USD' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCurrency('USD')}
                          className="px-3"
                        >
                          USD
                        </Button>
                        <Button
                          type="button"
                          variant={selectedCurrency === 'TZS' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCurrency('TZS')}
                          className="px-3"
                        >
                          TZS
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Total: {selectedCurrency} {(pricePerNight * numberOfNights * numberOfRooms).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number-of-people" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Users className="h-4 w-4 text-indigo-500" />
                      Number of People *
                    </Label>
                    <Input
                      id="number-of-people"
                      type="number"
                      min="1"
                      value={numberOfRooms}
                      onChange={(e) => setNumberOfRooms(parseInt(e.target.value) || 1)}
                      className="h-10 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number-of-nights" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-teal-500" />
                      Number of Nights *
                    </Label>
                    <Input
                      id="number-of-nights"
                      type="number"
                      min="1"
                      value={numberOfNights}
                      onChange={(e) => setNumberOfNights(parseInt(e.target.value) || 1)}
                      className="h-10 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={addHotelSelection}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                disabled={!selectedHotel || !selectedRoomType || !selectedMealPlan || !selectedEntryType || pricePerNight <= 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Hotel' : 'Add Hotel'}
              </Button>

              {isEditing && (
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold"
                >
                  Cancel Edit
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedHotel('');
                  setSelectedRoomType('');
                  setSelectedMealPlan('');
                  setSelectedEntryType('');
                  setNumberOfRooms(1);
                  setNumberOfNights(1);
                  setPricePerNight(0);
                  setHotelRates([]);
                  setIsEditing(false);
                  setEditingHotelId(null);
                }}
                className="border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-700 font-semibold"
                disabled={!selectedCategory}
              >
                Reset Selection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Hotels Tables */}
      {quoteData.selectedHotels.length > 0 && (
        <div className="space-y-6">
          {/* USD Hotels Table */}
          {quoteData.selectedHotels.filter(hotel => hotel.currency === 'USD').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>USD Hotels & Accommodations</span>
                  <Badge variant="outline">
                    {quoteData.selectedHotels.filter(hotel => hotel.currency === 'USD').length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Hotel Name</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">PAX</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Nights</th>
                        <th className="text-right py-2 px-3 font-medium text-sm text-gray-700">Amount (USD)</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData.selectedHotels
                        .filter(hotel => hotel.currency === 'USD')
                        .map((hotel) => {
                          const hotelData = hotels.find(h => h.id === hotel.hotelId);
                          const selectedNationalParks = quoteData.selectedParks?.map(park => park.nationalParkName) || [];
                          const isInSelectedPark = hotelData?.national_park_name && selectedNationalParks.includes(hotelData.national_park_name);
                          
                          return (
                            <tr key={hotel.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-3">
                                <div>
                                  <div className="font-medium text-sm">{hotel.hotelName}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {hotel.roomType} • {hotel.checkIn} - {hotel.checkOut}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {isInSelectedPark && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        🏞️ In Selected Park
                                      </Badge>
                                    )}
                                    {hotelData?.is_partner && (
                                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                        ⭐ Partner
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-medium">
                                {hotel.pax}
                              </td>
                              <td className="py-3 px-3 text-center font-medium">
                                {hotel.nights}
                              </td>
                              <td className="py-3 px-3 text-right font-medium">
                                ${hotel.price.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editHotelSelection(hotel.id)}
                                    className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeHotelSelection(hotel.id)}
                                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Total USD Hotels:</span>
                    <span className="text-lg font-bold">
                      ${quoteData.selectedHotels
                        .filter(hotel => hotel.currency === 'USD')
                        .reduce((sum, hotel) => sum + hotel.price, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TZS Hotels Table */}
          {quoteData.selectedHotels.filter(hotel => hotel.currency === 'TZS').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>TZS Hotels & Accommodations</span>
                  <Badge variant="outline">
                    {quoteData.selectedHotels.filter(hotel => hotel.currency === 'TZS').length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Hotel Name</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">PAX</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Nights</th>
                        <th className="text-right py-2 px-3 font-medium text-sm text-gray-700">Amount (TZS)</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData.selectedHotels
                        .filter(hotel => hotel.currency === 'TZS')
                        .map((hotel) => {
                          const hotelData = hotels.find(h => h.id === hotel.hotelId);
                          const selectedNationalParks = quoteData.selectedParks?.map(park => park.nationalParkName) || [];
                          const isInSelectedPark = hotelData?.national_park_name && selectedNationalParks.includes(hotelData.national_park_name);
                          
                          return (
                            <tr key={hotel.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-3">
                                <div>
                                  <div className="font-medium text-sm">{hotel.hotelName}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {hotel.roomType} • {hotel.checkIn} - {hotel.checkOut}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {isInSelectedPark && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        🏞️ In Selected Park
                                      </Badge>
                                    )}
                                    {hotelData?.is_partner && (
                                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                        ⭐ Partner
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-medium">
                                {hotel.pax}
                              </td>
                              <td className="py-3 px-3 text-center font-medium">
                                {hotel.nights}
                              </td>
                              <td className="py-3 px-3 text-right font-medium">
                                TZS {hotel.price.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editHotelSelection(hotel.id)}
                                    className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeHotelSelection(hotel.id)}
                                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Total TZS Hotels:</span>
                    <span className="text-lg font-bold">
                      TZS {quoteData.selectedHotels
                        .filter(hotel => hotel.currency === 'TZS')
                        .reduce((sum, hotel) => sum + hotel.price, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Hotels Message */}
      {selectedCategory && hotels.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No hotels found for the selected category</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
