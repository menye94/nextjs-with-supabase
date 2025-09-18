"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Users, Calendar, DollarSign, Star, Bed } from "lucide-react";
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

  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
  }, []);

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
        setHotels(transformedHotels);
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

  const addHotelSelection = () => {
    if (!selectedHotel || !selectedRoomType || !selectedMealPlan || !selectedEntryType) return;

    const hotel = hotels.find(h => h.id.toString() === selectedHotel);
    const roomType = roomTypes.find(r => r.id.toString() === selectedRoomType);
    
    if (!hotel || !roomType) return;

    // Calculate check-in and check-out dates based on trip dates
    const checkIn = quoteData.startDate || new Date().toISOString().split('T')[0];
    const checkOut = quoteData.endDate || new Date(Date.now() + numberOfNights * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Calculate total price
    const totalPrice = pricePerNight * numberOfNights * numberOfRooms;

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

  const removeHotelSelection = (id: string) => {
    updateQuoteData({
      selectedHotels: quoteData.selectedHotels.filter(hotel => hotel.id !== id)
    });
  };

  const updateHotelSelection = (id: string, updates: Partial<HotelSelection>) => {
    updateQuoteData({
      selectedHotels: quoteData.selectedHotels.map(hotel =>
        hotel.id === id ? { ...hotel, ...updates } : hotel
      )
    });
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
                  <Label htmlFor="hotel-select" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-green-500" />
                    Hotel *
                  </Label>
                  <SearchableDropdown
                    id="hotel-select"
                    value={selectedHotel}
                    onChange={setSelectedHotel}
                    options={[
                      { id: '', label: 'Select hotel', value: '' },
                      ...hotels.map((hotel) => ({
                        id: hotel.id,
                        label: `${hotel.hotel_name} ${hotel.is_partner ? '⭐' : ''}`,
                        value: hotel.id.toString()
                      }))
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
                Add Hotel
              </Button>

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

      {/* Selected Hotels */}
      {quoteData.selectedHotels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Hotels & Accommodations</span>
              <Badge variant="outline">
                {quoteData.selectedHotels.length} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quoteData.selectedHotels.map((hotel) => (
                <div key={hotel.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{hotel.hotelName}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {hotel.roomType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {hotel.checkIn} - {hotel.checkOut}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {hotel.currency}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-green-600">
                          Total Price: {hotel.currency} {hotel.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {hotel.currency} {hotel.nights > 0 && hotel.pax > 0 
                            ? (hotel.price / (hotel.nights * hotel.pax)).toFixed(2)
                            : '0.00'
                          } per person per night
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHotelSelection(hotel.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`pax-${hotel.id}`} className="text-sm">
                        Number of People
                      </Label>
                      <Input
                        id={`pax-${hotel.id}`}
                        type="number"
                        min="1"
                        value={hotel.pax}
                        onChange={(e) => {
                          const newPax = parseInt(e.target.value) || 1;
                          // Calculate price per person per night safely
                          const currentPricePerPersonPerNight = hotel.nights > 0 && hotel.pax > 0 
                            ? hotel.price / (hotel.nights * hotel.pax) 
                            : 0;
                          const newTotalPrice = currentPricePerPersonPerNight * hotel.nights * newPax;
                          updateHotelSelection(hotel.id, { 
                            pax: newPax,
                            price: newTotalPrice
                          });
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`nights-${hotel.id}`} className="text-sm">
                        Number of Nights
                      </Label>
                      <Input
                        id={`nights-${hotel.id}`}
                        type="number"
                        min="1"
                        value={hotel.nights}
                        onChange={(e) => {
                          const newNights = parseInt(e.target.value) || 1;
                          // Calculate price per person per night safely
                          const currentPricePerPersonPerNight = hotel.nights > 0 && hotel.pax > 0 
                            ? hotel.price / (hotel.nights * hotel.pax) 
                            : 0;
                          const newTotalPrice = currentPricePerPersonPerNight * newNights * hotel.pax;
                          updateHotelSelection(hotel.id, { 
                            nights: newNights,
                            price: newTotalPrice
                          });
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`price-${hotel.id}`} className="text-sm">
                        Price per Person per Night ({hotel.currency})
                      </Label>
                      <Input
                        id={`price-${hotel.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={hotel.nights > 0 && hotel.pax > 0 
                          ? (hotel.price / (hotel.nights * hotel.pax)).toFixed(2)
                          : '0.00'
                        }
                        onChange={(e) => {
                          const newPricePerPersonPerNight = parseFloat(e.target.value) || 0;
                          const newTotalPrice = newPricePerPersonPerNight * hotel.nights * hotel.pax;
                          updateHotelSelection(hotel.id, { 
                            price: newTotalPrice
                          });
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        <div>Total: {hotel.pax} people</div>
                        <div>{hotel.nights} night{hotel.nights !== 1 ? 's' : ''}</div>
                        <div className="font-semibold text-green-600">
                          {hotel.currency} {hotel.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
