"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Plus, Minus, Calendar, Users, MapPin, DollarSign, Building, Bed, Ticket, UserCheck, Search } from "lucide-react";

interface QuoteForm {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  childAges: number[];
  selectedParks: number[];
  selectedEntryTypes: string[];
  selectedRoomTypes: string[];
  selectedHotels: number[];
  searchParkQuery: string;
  searchHotelQuery: string;
}

interface ParkProduct {
  id: number;
  product_name: string;
  currency: string;
  category: string;
  entry_type: string;
  season_name?: string;
  start_date?: string;
  end_date?: string;
  final_price?: number;
}

interface HotelRate {
  id: number;
  hotel_name: string;
  room_name: string;
  season_name: string;
  start_date?: string;
  end_date?: string;
  rate: number;
  meal_plan: string;
  pricing_type: string;
  currency: string;
  final_price?: number;
  hotel_id: number;
}

interface HotelChildPolicy {
  id: number;
  hotel_id: number;
  min_age: number;
  max_age: number;
  fee_percentage: number;
  adult_sharing: boolean;
}

interface QuoteItem {
  type: 'park' | 'hotel';
  name: string;
  description: string;
  adultPrice: number;
  childPrice: number;
  adultQuantity: number;
  childQuantity: number;
  adultTotal: number;
  childTotal: number;
  total: number;
  currency: string;
}

export default function TestQuotePage() {
  const [form, setForm] = useState<QuoteForm>({
    startDate: "",
    endDate: "",
    adults: 1,
    children: 0,
    childAges: [],
    selectedParks: [],
    selectedEntryTypes: [],
    selectedRoomTypes: [],
    selectedHotels: [],
    searchParkQuery: "",
    searchHotelQuery: ""
  });

  const [parkProducts, setParkProducts] = useState<ParkProduct[]>([]);
  const [hotelRates, setHotelRates] = useState<HotelRate[]>([]);
  const [hotelChildPolicies, setHotelChildPolicies] = useState<HotelChildPolicy[]>([]);
  const [filteredParkProducts, setFilteredParkProducts] = useState<ParkProduct[]>([]);
  const [filteredHotelRates, setFilteredHotelRates] = useState<HotelRate[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const supabase = createClient();

  // Fetch park products with pricing
  const fetchParkProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('park_product')
                 .select(`
           id,
           product_name,
           category:park_category(category_name),
           entry_type:entry_type(entry_name),
           park_product_price(
             unit_amount,
             currency:currency(currency_name),
             season:seasons(season_name, start_date, end_date)
           )
         `)
        .order('product_name');

      if (error) throw error;

      const processedData: ParkProduct[] = [];
      
      data?.forEach((product: any) => {
        // If product has multiple seasons, create separate entries for each
        if (product.park_product_price && product.park_product_price.length > 0) {
          product.park_product_price.forEach((parkPrice: any) => {
                         processedData.push({
               id: product.id,
               product_name: product.product_name,
               currency: parkPrice.currency?.currency_name || 'USD',
               category: product.category?.category_name || 'N/A',
               entry_type: product.entry_type?.entry_name || 'N/A',
               season_name: parkPrice.season?.season_name,
               start_date: parkPrice.season?.start_date,
               end_date: parkPrice.season?.end_date,
               final_price: parkPrice.unit_amount || 0
             });
          });
        } else {
                     // If no season pricing, use default price
           processedData.push({
             id: product.id,
             product_name: product.product_name,
             currency: 'USD', // Default currency when no pricing data
             category: product.category?.category_name || 'N/A',
             entry_type: product.entry_type?.entry_name || 'N/A',
             season_name: undefined,
             start_date: undefined,
             end_date: undefined,
             final_price: 0
           });
        }
      });

      setParkProducts(processedData);
    } catch (error) {
      console.error('Error fetching park products:', error);
    }
  };

  // Fetch hotel rates
  const fetchHotelRates = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_rates')
        .select(`
          id,
          rate,
          hotel_id,
          hotel:hotels(hotel_name),
          hotel_room:hotel_rooms(room:rooms(room_name)),
          hotel_season:hotels_seasons(season_name, start_date, end_date),
          meal_plan:hotel_meal_plans(name),
          hotel_pricing_type:hotel_pricing_type(name),
          currency:currency(currency_name)
        `)
        .order('id');

      if (error) throw error;

      const processedData = data?.map((rate: any) => ({
        id: rate.id,
        hotel_id: rate.hotel_id,
        hotel_name: rate.hotel?.hotel_name || 'N/A',
        room_name: rate.hotel_room?.room?.room_name || 'N/A',
        season_name: rate.hotel_season?.season_name || 'N/A',
        start_date: rate.hotel_season?.start_date,
        end_date: rate.hotel_season?.end_date,
        rate: rate.rate,
        meal_plan: rate.meal_plan?.name || 'N/A',
        pricing_type: rate.hotel_pricing_type?.name || 'N/A',
        currency: rate.currency?.currency_name || 'USD',
        final_price: rate.rate
      })) || [];

      setHotelRates(processedData);
    } catch (error) {
      console.error('Error fetching hotel rates:', error);
    }
  };

  // Fetch hotel child policies
  const fetchHotelChildPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_child_policy')
        .select('*')
        .order('min_age');

      if (error) throw error;
      setHotelChildPolicies(data || []);
    } catch (error) {
      console.error('Error fetching hotel child policies:', error);
    }
  };

  useEffect(() => {
    fetchParkProducts();
    fetchHotelRates();
    fetchHotelChildPolicies();
  }, []);

  // Filter products based on date range and selections
  const filterProducts = () => {
    if (!form.startDate || !form.endDate) {
      setFilteredParkProducts(parkProducts);
      setFilteredHotelRates(hotelRates);
      return;
    }

    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);

    // Filter park products
    const filteredParks = parkProducts.filter(product => {
      // Date filter - check if trip dates fall within any season dates
      if (product.start_date && product.end_date) {
        const seasonStart = new Date(product.start_date);
        const seasonEnd = new Date(product.end_date);
        
        // Check if trip dates overlap with season dates
        const tripOverlapsSeason = (
          (startDate >= seasonStart && startDate <= seasonEnd) || // trip starts within season
          (endDate >= seasonStart && endDate <= seasonEnd) || // trip ends within season
          (startDate <= seasonStart && endDate >= seasonEnd) // trip spans entire season
        );
        
        if (!tripOverlapsSeason) return false;
      }
      
      // Entry type filter
      if (form.selectedEntryTypes.length > 0 && !form.selectedEntryTypes.includes(product.entry_type)) {
        return false;
      }

      // Search filter
      if (form.searchParkQuery && !product.product_name.toLowerCase().includes(form.searchParkQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Filter hotel rates
    const filteredHotels = hotelRates.filter(rate => {
      // Date filter
      if (rate.start_date && rate.end_date) {
        const seasonStart = new Date(rate.start_date);
        const seasonEnd = new Date(rate.end_date);
        if (startDate < seasonStart || endDate > seasonEnd) return false;
      }
      
      // Room type filter
      if (form.selectedRoomTypes.length > 0 && !form.selectedRoomTypes.includes(rate.room_name)) {
        return false;
      }

      // Search filter
      if (form.searchHotelQuery && !rate.hotel_name.toLowerCase().includes(form.searchHotelQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    setFilteredParkProducts(filteredParks);
    setFilteredHotelRates(filteredHotels);
  };

  useEffect(() => {
    filterProducts();
  }, [form.startDate, form.endDate, form.selectedEntryTypes, form.selectedRoomTypes, form.searchParkQuery, form.searchHotelQuery, parkProducts, hotelRates]);

  // Calculate child rate based on age and hotel child policy
  const calculateChildRate = (adultRate: number, childAge: number, hotelId: number) => {
    const policy = hotelChildPolicies.find(p => 
      p.hotel_id === hotelId && 
      childAge >= p.min_age && 
      childAge <= p.max_age
    );
    
    if (policy) {
      return adultRate * (policy.fee_percentage / 100);
    }
    
    // Default: full adult rate if no policy found
    return adultRate;
  };

  // Generate quote items
  useEffect(() => {
    const items: QuoteItem[] = [];
    
    // Add park products (same for adults and children)
    filteredParkProducts.forEach(product => {
      if (form.selectedParks.includes(product.id)) {
        const parkPrice = product.final_price || 0;
        const adultTotal = parkPrice * form.adults;
        const childTotal = parkPrice * form.children;
        
        items.push({
          type: 'park',
          name: product.product_name,
          description: `${product.category} - ${product.entry_type}`,
          adultPrice: parkPrice,
          childPrice: parkPrice,
          adultQuantity: form.adults,
          childQuantity: form.children,
          adultTotal: adultTotal,
          childTotal: childTotal,
          total: adultTotal + childTotal,
          currency: product.currency
        });
      }
    });

    // Add hotel rates with child pricing
    const nights = form.startDate && form.endDate 
      ? Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    filteredHotelRates.forEach(rate => {
      if (form.selectedHotels.includes(rate.id)) {
        const adultRate = rate.final_price || 0;
        const adultTotal = adultRate * form.adults * nights;
        
        // Calculate child rates based on their ages
        let childTotal = 0;
        let averageChildRate = 0;
        if (form.children > 0) {
          form.childAges.forEach(childAge => {
            const childRate = calculateChildRate(adultRate, childAge, rate.hotel_id);
            childTotal += childRate * nights;
          });
          averageChildRate = childTotal / form.children;
        }

        const totalHotelCost = adultTotal + childTotal;
        
        items.push({
          type: 'hotel',
          name: `${rate.hotel_name} - ${rate.room_name}`,
          description: `${rate.meal_plan} (${rate.pricing_type}) - ${nights} nights`,
          adultPrice: adultRate,
          childPrice: averageChildRate,
          adultQuantity: form.adults * nights,
          childQuantity: form.children * nights,
          adultTotal: adultTotal,
          childTotal: childTotal,
          total: totalHotelCost,
          currency: rate.currency
        });
      }
    });

    setQuoteItems(items);
  }, [filteredParkProducts, filteredHotelRates, form.selectedParks, form.selectedHotels, form.adults, form.children, form.childAges, form.startDate, form.endDate, hotelChildPolicies]);

  // Calculate total price
  useEffect(() => {
    const total = quoteItems.reduce((sum, item) => sum + item.total, 0);
    setTotalPrice(total);
  }, [quoteItems]);

  const handleChildAgeChange = (index: number, age: number) => {
    const newChildAges = [...form.childAges];
    newChildAges[index] = age;
    setForm(prev => ({ ...prev, childAges: newChildAges }));
  };

  const addChild = () => {
    setForm(prev => ({
      ...prev,
      children: prev.children + 1,
      childAges: [...prev.childAges, 0]
    }));
  };

  const removeChild = () => {
    if (form.children > 0) {
      setForm(prev => ({
        ...prev,
        children: prev.children - 1,
        childAges: prev.childAges.slice(0, -1)
      }));
    }
  };

  const toggleParkSelection = (parkId: number) => {
    setForm(prev => ({
      ...prev,
      selectedParks: prev.selectedParks.includes(parkId)
        ? prev.selectedParks.filter(id => id !== parkId)
        : [...prev.selectedParks, parkId]
    }));
  };

  const toggleHotelSelection = (hotelId: number) => {
    setForm(prev => ({
      ...prev,
      selectedHotels: prev.selectedHotels.includes(hotelId)
        ? prev.selectedHotels.filter(id => id !== hotelId)
        : [...prev.selectedHotels, hotelId]
    }));
  };

  const handleStartDateChange = (date: string) => {
    setForm(prev => ({ 
      ...prev, 
      startDate: date,
      // Reset end date if it's before the new start date
      endDate: prev.endDate && date && new Date(prev.endDate) < new Date(date) ? "" : prev.endDate
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getUniqueEntryTypes = () => {
    return [...new Set(parkProducts.map(p => p.entry_type))];
  };

  const getUniqueRoomTypes = () => {
    return [...new Set(hotelRates.map(h => h.room_name))];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Quote</h1>
        <p className="text-gray-600">Create a detailed quote for your trip</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
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
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1"
                    disabled={!form.startDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adults */}
              <div className="flex items-center gap-4">
                <Label htmlFor="adults" className="min-w-[80px]">Adults:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForm(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    value={form.adults}
                    onChange={(e) => setForm(prev => ({ ...prev, adults: parseInt(e.target.value) || 1 }))}
                    className="w-16 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForm(prev => ({ ...prev, adults: prev.adults + 1 }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center gap-4">
                <Label htmlFor="children" className="min-w-[80px]">Children:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeChild}
                    disabled={form.children === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={form.children}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      const newChildAges = Array(count).fill(0);
                      setForm(prev => ({ ...prev, children: count, childAges: newChildAges }));
                    }}
                    className="w-16 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addChild}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Child Ages */}
              {form.children > 0 && (
                <div className="space-y-2">
                  <Label>Child Ages:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {form.childAges.map((age, index) => (
                      <div key={`child-age-${index}`} className="flex items-center gap-2">
                        <Label className="text-sm">Child {index + 1}:</Label>
                        <Input
                          type="number"
                          min="0"
                          max="17"
                          value={age}
                          onChange={(e) => handleChildAgeChange(index, parseInt(e.target.value) || 0)}
                          className="w-16"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

                     {/* Filters Section */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Search className="h-5 w-5" />
                 Filters
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Entry Type Filter */}
                 <div>
                   <Label className="text-sm font-medium">Entry Types</Label>
                   <Select 
                     value={form.selectedEntryTypes.length > 0 ? form.selectedEntryTypes[0] : "all"} 
                     onValueChange={(value) => setForm(prev => ({ 
                       ...prev, 
                       selectedEntryTypes: value && value !== "all" ? [value] : [] 
                     }))}
                   >
                     <option value="all">All Entry Types</option>
                     {getUniqueEntryTypes().map((entryType) => (
                       <option key={entryType} value={entryType}>
                         {entryType}
                       </option>
                     ))}
                   </Select>
                 </div>

                 {/* Room Type Filter */}
                 <div>
                   <Label className="text-sm font-medium">Room Types</Label>
                   <Select 
                     value={form.selectedRoomTypes.length > 0 ? form.selectedRoomTypes[0] : "all"} 
                     onValueChange={(value) => setForm(prev => ({ 
                       ...prev, 
                       selectedRoomTypes: value && value !== "all" ? [value] : [] 
                     }))}
                   >
                     <option value="all">All Room Types</option>
                     {getUniqueRoomTypes().map((roomType) => (
                       <option key={roomType} value={roomType}>
                         {roomType}
                       </option>
                     ))}
                   </Select>
                 </div>
               </div>
             </CardContent>
           </Card>

                     {/* Park Selection */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <MapPin className="h-5 w-5" />
                 Park Products ({filteredParkProducts.length})
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Action Buttons */}
               <div className="flex justify-end gap-2">
                 <Button variant="destructive" size="sm">
                   Delete
                 </Button>
                 <Button size="sm">
                   Save
                 </Button>
               </div>

               {/* Table Header with Filters */}
               <div className="grid grid-cols-9 gap-2 text-sm font-medium text-gray-700 border-b pb-2">
                 <div className="col-span-1"></div> {/* Empty column for Select buttons */}
                 <div className="col-span-1">
                   <Label className="text-xs">National Park</Label>
                   <Select className="h-8 text-xs">
                     <option value="all">All Parks</option>
                     {[...new Set(parkProducts.map(p => p.category))].map((park) => (
                       <option key={park} value={park}>
                         {park}
                       </option>
                     ))}
                   </Select>
                 </div>
                 <div className="col-span-1">
                   <Label className="text-xs">Category</Label>
                   <Select className="h-8 text-xs">
                     <option value="all">All Categories</option>
                     {getUniqueEntryTypes().map((category) => (
                       <option key={category} value={category}>
                         {category}
                       </option>
                     ))}
                   </Select>
                 </div>
                 <div className="col-span-1">
                   <Label className="text-xs">Type</Label>
                   <Select className="h-8 text-xs">
                     <option value="all">All Types</option>
                     {getUniqueEntryTypes().map((type) => (
                       <option key={type} value={type}>
                         {type}
                       </option>
                     ))}
                   </Select>
                 </div>
                 <div className="col-span-1">
                   <Label className="text-xs">Product</Label>
                   <Input 
                     placeholder="Product name" 
                     className="h-8 text-xs"
                     value={form.searchParkQuery}
                     onChange={(e) => setForm(prev => ({ ...prev, searchParkQuery: e.target.value }))}
                   />
                 </div>
                 <div className="col-span-1">
                   <Label className="text-xs">USD</Label>
                   <Input placeholder="" className="h-8 text-xs" />
                 </div>
                 <div className="col-span-1">
                   <Label className="text-xs">TZS</Label>
                   <Input placeholder="" className="h-8 text-xs" />
                 </div>
                 <div className="col-span-1">
                   <Label className="text-xs">DURATION</Label>
                   <Input placeholder="" className="h-8 text-xs" />
                 </div>
                 <div className="col-span-1">
                   <Label className="text-xs">PAX/QTY</Label>
                   <Input placeholder="" className="h-8 text-xs" />
                 </div>
               </div>

               {/* Table Data Rows */}
               <div className="space-y-1">
                 {filteredParkProducts.map((product) => (
                   <div 
                     key={product.id} 
                     className={`grid grid-cols-9 gap-2 items-center py-2 px-2 rounded hover:bg-gray-50 ${
                       form.selectedParks.includes(product.id) ? 'bg-blue-50' : ''
                     }`}
                   >
                     <div className="col-span-1">
                       <Button
                         size="sm"
                         variant={form.selectedParks.includes(product.id) ? "default" : "outline"}
                         onClick={() => toggleParkSelection(product.id)}
                         className="w-full text-xs"
                       >
                         {form.selectedParks.includes(product.id) ? 'Selected' : 'Select'}
                       </Button>
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       {product.category}
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       {product.category}
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       {product.entry_type}
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       {product.product_name}
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       ${product.final_price?.toFixed(2)}
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       {/* Convert USD to TZS (approximate rate) */}
                       {(product.final_price || 0) * 2500}
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       1 day
                     </div>
                     <div className="col-span-1 text-xs text-gray-600">
                       {form.adults + form.children}
                     </div>
                   </div>
                 ))}
                 {filteredParkProducts.length === 0 && (
                   <div className="text-center text-gray-500 py-8">
                     No park products available for selected criteria
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>

          {/* Hotel Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Hotel Accommodation ({filteredHotelRates.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search hotels..."
                  value={form.searchHotelQuery}
                  onChange={(e) => setForm(prev => ({ ...prev, searchHotelQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHotelRates.map((rate) => (
                  <div 
                    key={rate.id} 
                    className={`border rounded-lg p-4 space-y-2 cursor-pointer transition-colors ${
                      form.selectedHotels.includes(rate.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleHotelSelection(rate.id)}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-gray-900">{rate.hotel_name}</h3>
                      <input
                        type="checkbox"
                        checked={form.selectedHotels.includes(rate.id)}
                        onChange={() => toggleHotelSelection(rate.id)}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-sm text-gray-600">{rate.room_name}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{rate.meal_plan}</span>
                      <span className="font-semibold text-blue-600">
                        ${rate.final_price?.toFixed(2)} {rate.currency}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Pricing: {rate.pricing_type}</div>
                      <div>Season: {rate.season_name}</div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredHotelRates.length === 0 && (
                <p className="text-center text-gray-500 py-8">No hotel rates available for selected criteria</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quote Summary */}
        <div className="space-y-6">
          {/* Quote Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Quote Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                             {/* Trip Info */}
               <div className="space-y-2">
                 <h4 className="font-medium text-gray-900">Trip Details</h4>
                 <div className="text-sm text-gray-600">
                   <div>Dates: {form.startDate && form.endDate ? `${formatDate(form.startDate)} - ${formatDate(form.endDate)}` : 'Not set'}</div>
                   <div>Adults: {form.adults}</div>
                   <div>Children: {form.children}</div>
                   {form.children > 0 && (
                     <div>Child Ages: {form.childAges.join(', ')}</div>
                   )}
                   {form.startDate && form.endDate && (
                     <div>Nights: {Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24))}</div>
                   )}
                 </div>
               </div>

                             {/* Selected Items */}
               <div className="space-y-2">
                 <h4 className="font-medium text-gray-900">Selected Items</h4>
                 <div className="space-y-3">
                   {quoteItems.map((item, index) => (
                     <div key={`quote-item-${index}`} className="border rounded-lg p-3 space-y-2">
                       <div className="flex justify-between items-start">
                         <div className="flex-1">
                           <div className="font-medium text-sm">{item.name}</div>
                           <div className="text-gray-500 text-xs">{item.description}</div>
                         </div>
                         <div className="text-right text-sm font-semibold">
                           ${item.total.toFixed(2)}
                         </div>
                       </div>
                       
                       {/* Adult Pricing */}
                       {item.adultQuantity > 0 && (
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-600">Adults ({item.adultQuantity}):</span>
                           <span>${item.adultPrice.toFixed(2)} × {item.adultQuantity} = ${item.adultTotal.toFixed(2)}</span>
                         </div>
                       )}
                       
                       {/* Child Pricing */}
                       {item.childQuantity > 0 && (
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-600">Children ({item.childQuantity}):</span>
                           <span>${item.childPrice.toFixed(2)} × {item.childQuantity} = ${item.childTotal.toFixed(2)}</span>
                         </div>
                       )}
                     </div>
                   ))}
                   {quoteItems.length === 0 && (
                     <p className="text-gray-500 text-sm">No items selected</p>
                   )}
                 </div>
               </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Generate Quote Button */}
              <Button 
                className="w-full bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white"
                disabled={quoteItems.length === 0}
              >
                Generate Quote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 