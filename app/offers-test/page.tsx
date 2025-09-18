"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Calendar, Users, MapPin, DollarSign, Search, Trash2, X } from "lucide-react";

interface TripDetails {
  clientId: string;
  adults: number;
  children: number;
  childAges: number[];
  adultAges: number[]; // Add adult ages array
  startDate: string;
  endDate: string;
  selectedParks: string[];
}

interface ParkProduct {
  id: number;
  park: string;
  category: string;
  entry: string;
  product_name: string;
  usdPrice: number;
  tzsPrice: number;
  pax: number;
  days: number;
}

interface Client {
  id: number;
  cus_first_name: string;
  cus_last_name: string;
  cus_email_address: string;
}

interface NationalPark {
  id: number;
  national_park_name: string;
}

interface ParkCategory {
  id: number;
  category_name: string;
}

interface EntryType {
  id: number;
  entry_name: string;
}

interface ProductDetails {
  id: number;
  product_name: string;
  category_name: string;
  entry_type_name: string;
  age_group_name: string;
  min_age: number;
  max_age: number;
  pricing: {
    unit_amount: number;
    currency_name: string;
    season_name: string;
  }[];
}

export default function OffersTestPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [nationalParks, setNationalParks] = useState<NationalPark[]>([]);
  const [parkCategories, setParkCategories] = useState<ParkCategory[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [parkProducts, setParkProducts] = useState<ParkProduct[]>([]);
  
  // Store existing categories and entry types for each park
  const [parkExistingData, setParkExistingData] = useState<{[parkId: string]: {categories: string[], entryTypes: string[]}}>({});

  // Product selection states
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [availableProducts, setAvailableProducts] = useState<ProductDetails[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Form states
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    clientId: "",
    adults: 1,
    children: 0,
    childAges: [],
    adultAges: [18], // Add adult ages array
    startDate: "",
    endDate: "",
    selectedParks: []
  });

  // Search states
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [parkSearchQuery, setParkSearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [entryTypeSearchQuery, setEntryTypeSearchQuery] = useState("");

  // Dropdown visibility states
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<number | null>(null);
  const [showEntryTypeDropdown, setShowEntryTypeDropdown] = useState<number | null>(null);
  const [showParkDropdown, setShowParkDropdown] = useState<number | null>(null);

  // Refs for dropdown containers
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const entryTypeDropdownRef = useRef<HTMLDivElement>(null);
  const parkDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Debug function to test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      
      // Test 1: Get all products
      const { data: allProducts, error: allProductsError } = await supabase
        .from('park_product')
        .select('id, product_name')
        .limit(5);
      
      console.log('All products test:', { allProducts, allProductsError });
      
      // Test 2: Get categories
      const { data: allCategories, error: allCategoriesError } = await supabase
        .from('park_category')
        .select('id, category_name')
        .limit(5);
      
      console.log('All categories test:', { allCategories, allCategoriesError });
      
      // Test 3: Get entry types
      const { data: allEntryTypes, error: allEntryTypesError } = await supabase
        .from('entry_type')
        .select('id, entry_name')
        .limit(5);
      
      console.log('All entry types test:', { allEntryTypes, allEntryTypesError });
      
    } catch (error) {
      console.error('Database connection test error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-test database connection on mount
  useEffect(() => {
    testDatabaseConnection();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(null);
      }
      if (entryTypeDropdownRef.current && !entryTypeDropdownRef.current.contains(event.target as Node)) {
        setShowEntryTypeDropdown(null);
      }
      if (parkDropdownRef.current && !parkDropdownRef.current.contains(event.target as Node)) {
        setShowParkDropdown(null);
        setParkSearchQuery("");
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(null);
        setProductSearchQuery("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug useEffect for availableProducts
  useEffect(() => {
    console.log('Available products changed:', availableProducts);
  }, [availableProducts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('customers')
        .select('id, cus_first_name, cus_last_name, cus_email_address')
        .limit(50);

      // Fetch national parks
      const { data: parksData } = await supabase
        .from('national_parks')
        .select('id, national_park_name')
        .limit(50);

      // Fetch park categories
      const { data: categoriesData } = await supabase
        .from('park_category')
        .select('id, category_name')
        .order('category_name');

      // Fetch entry types
      const { data: entryTypesData } = await supabase
        .from('entry_type')
        .select('id, entry_name')
        .order('entry_name');

      setClients(clientsData || []);
      setNationalParks(parksData || []);
      setParkCategories(categoriesData || []);
      setEntryTypes(entryTypesData || []);

      console.log('Initial data loaded:', {
        clients: clientsData?.length || 0,
        parks: parksData?.length || 0,
        categories: categoriesData?.length || 0,
        entryTypes: entryTypesData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage("Error fetching data");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing categories and entry types for a specific park
  const fetchParkExistingData = async (parkName: string) => {
    try {
      // Find the park ID from the park name
      const park = nationalParks.find(p => p.national_park_name === parkName);
      if (!park) return;

      // Fetch existing categories and entry types for this park from park_product table
      const { data: existingData } = await supabase
        .from('park_product')
        .select('park_category_id, entry_type_id')
        .eq('national_park_id', park.id);

      if (existingData && existingData.length > 0) {
        // Get unique category IDs and entry type IDs
        const categoryIds = [...new Set(existingData.map(item => item.park_category_id))];
        const entryTypeIds = [...new Set(existingData.map(item => item.entry_type_id))];

        // Fetch the actual category and entry type names
        const { data: categoriesData } = await supabase
          .from('park_category')
          .select('category_name')
          .in('id', categoryIds);

        const { data: entryTypesData } = await supabase
          .from('entry_type')
          .select('entry_name')
          .in('id', entryTypeIds);

        const categories = categoriesData?.map(c => c.category_name) || [];
        const entryTypes = entryTypesData?.map(e => e.entry_name) || [];

        setParkExistingData(prev => ({
          ...prev,
          [parkName]: { categories, entryTypes }
        }));
      }
    } catch (error) {
      console.error('Error fetching park existing data:', error);
    }
  };

  // Fetch products based on selected criteria and date filtering
  const fetchAvailableProducts = async (category: string, entryType: string) => {
    if (!category || !entryType) {
      setAvailableProducts([]);
      return;
    }

    try {
      // Find the IDs for the selected criteria
      const categoryData = parkCategories.find(c => c.category_name === category);
      const entryTypeData = entryTypes.find(e => e.entry_name === entryType);
      
      if (!categoryData || !entryTypeData) return;

      // Step 1: First get all products that match the category and entry type
      const { data: productsData, error: productsError } = await supabase
        .from('park_product')
        .select(`
          id,
          product_name,
          park_category:park_category(category_name),
          entry_type:entry_type(entry_name),
          age_group:age_group(age_group_name, min_age, max_age)
        `)
        .eq('park_category_id', categoryData.id)
        .eq('entry_type_id', entryTypeData.id);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setAvailableProducts([]);
        return;
      }

      console.log('Database query result:', { productsData, productsError });

      if (productsData && productsData.length > 0) {
        console.log('Raw products data:', productsData);
        
        // Step 2: Filter products by age group if ages are set
        const ageFilteredProducts = productsData.filter(product => {
          if (!product.age_group || !Array.isArray(product.age_group) || !product.age_group[0]) return false;
          
          const ageGroupData = product.age_group[0];
          const minAge = ageGroupData.min_age || 0;
          const maxAge = ageGroupData.max_age || 999;
          
          // Get all guest ages
          const allAges = [...tripDetails.adultAges, ...tripDetails.childAges];
          
          // If no ages are set yet, show all products
          if (allAges.length === 0 || allAges.every(age => age === 0)) {
            return true;
          }
          
          // Check if any of the selected ages fall within this age group range
          const isValid = allAges.some(age => age >= minAge && age <= maxAge);
          console.log(`Product ${product.product_name}: age range ${minAge}-${maxAge}, guest ages ${allAges}, valid: ${isValid}`);
          return isValid;
        });

        console.log('Age filtered products:', ageFilteredProducts);

        // Step 3: For each age-filtered product, fetch pricing and filter by seasons
        const productsWithPricing: ProductDetails[] = [];
        
        for (const product of ageFilteredProducts) {
          const { data: pricingData, error: pricingError } = await supabase
            .from('park_product_price')
            .select(`
              unit_amount,
              currency:currency(currency_name),
              season:seasons(season_name, start_date, end_date)
            `)
            .eq('park_product_id', product.id);

          if (pricingError) {
            console.error(`Error fetching pricing for product ${product.id}:`, pricingError);
          }

          console.log(`Pricing data for product ${product.id}:`, pricingData);

          // Step 4: Filter pricing by season dates if dates are set
          let validPricing = pricingData || [];
          
          if (tripDetails.startDate && tripDetails.endDate) {
            validPricing = pricingData?.filter(price => {
              if (!price.season || !Array.isArray(price.season) || !price.season[0]?.start_date || !price.season[0]?.end_date) return false;
              
              const seasonStart = new Date(price.season[0].start_date);
              const seasonEnd = new Date(price.season[0].end_date);
              const tripStart = new Date(tripDetails.startDate);
              const tripEnd = new Date(tripDetails.endDate);
              
              // Check if trip dates overlap with season dates
              const hasSeasonOverlap = tripStart <= seasonEnd && tripEnd >= seasonStart;
              console.log(`Product ${product.product_name}: Season ${price.season[0].season_name} (${seasonStart.toDateString()}-${seasonEnd.toDateString()}) vs Trip (${tripStart.toDateString()}-${tripEnd.toDateString()}) - Overlap: ${hasSeasonOverlap}`);
              return hasSeasonOverlap;
            }) || [];
          }

          // Only include products that have valid pricing for the selected dates
          if (validPricing.length > 0 || !tripDetails.startDate || !tripDetails.endDate) {
            const ageGroupData = Array.isArray(product.age_group) ? product.age_group[0] : product.age_group;
            const categoryData = Array.isArray(product.park_category) ? product.park_category[0] : product.park_category;
            const entryTypeData = Array.isArray(product.entry_type) ? product.entry_type[0] : product.entry_type;
            
            productsWithPricing.push({
              id: product.id,
              product_name: product.product_name,
              category_name: categoryData?.category_name || '',
              entry_type_name: entryTypeData?.entry_name || '',
              age_group_name: ageGroupData?.age_group_name || '',
              min_age: ageGroupData?.min_age || 0,
              max_age: ageGroupData?.max_age || 0,
              pricing: validPricing.map(price => ({
                unit_amount: price.unit_amount || 0,
                currency_name: (price.currency as any)?.[0]?.currency_name || 'USD',
                season_name: (price.season as any)?.[0]?.season_name || ''
              }))
            });
          }
        }

        console.log('Final products with pricing:', productsWithPricing);
        setAvailableProducts(productsWithPricing);
      } else {
        console.log('No products data returned from database');
        setAvailableProducts([]);
      }
    } catch (error) {
      console.error('Error fetching available products:', error);
      setAvailableProducts([]);
    }
  };

  // Function to refresh all products when filtering criteria change
  const refreshAllProducts = () => {
    parkProducts.forEach(product => {
      if (product.park && product.category && product.entry) {
        fetchAvailableProducts(product.category, product.entry);
      }
    });
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const newChildAges = [...tripDetails.childAges];
    newChildAges[index] = age;
    setTripDetails(prev => ({ ...prev, childAges: newChildAges }));
    
    // Trigger product refresh after state update
    setTimeout(() => {
      refreshAllProducts();
    }, 100);
  };

  const handleAdultAgeChange = (index: number, age: number) => {
    const newAdultAges = [...tripDetails.adultAges];
    newAdultAges[index] = age;
    setTripDetails(prev => ({ ...prev, adultAges: newAdultAges }));
    
    // Trigger product refresh after state update
    setTimeout(() => {
      refreshAllProducts();
    }, 100);
  };

  const addChild = () => {
    setTripDetails(prev => ({
      ...prev,
      children: prev.children + 1,
      childAges: [...prev.childAges, 0]
    }));
    
    // Trigger product refresh after state update
    setTimeout(() => {
      refreshAllProducts();
    }, 100);
  };

  const removeChild = () => {
    if (tripDetails.children > 0) {
      setTripDetails(prev => ({
        ...prev,
        children: prev.children - 1,
        childAges: prev.childAges.slice(0, -1)
      }));
      
      // Trigger product refresh after state update
      setTimeout(() => {
        refreshAllProducts();
      }, 100);
    }
  };

  // Add functions to handle adult age management
  const addAdult = () => {
    setTripDetails(prev => ({
      ...prev,
      adults: prev.adults + 1,
      adultAges: [...prev.adultAges, 18]
    }));
    
    // Trigger product refresh after state update
    setTimeout(() => {
      refreshAllProducts();
    }, 100);
  };

  const removeAdult = () => {
    if (tripDetails.adults > 1) { // Keep at least 1 adult
      setTripDetails(prev => ({
        ...prev,
        adults: prev.adults - 1,
        adultAges: prev.adultAges.slice(0, -1)
      }));
      
      // Trigger product refresh after state update
      setTimeout(() => {
        refreshAllProducts();
      }, 100);
    }
  };

  const toggleParkSelection = (parkId: string) => {
    setTripDetails(prev => ({
      ...prev,
      selectedParks: prev.selectedParks.includes(parkId)
        ? prev.selectedParks.filter(id => id !== parkId)
        : [...prev.selectedParks, parkId]
    }));
  };

  const addParkProduct = () => {
    const newProduct: ParkProduct = {
      id: Date.now(),
      park: "",
      category: "",
      entry: "",
      product_name: "",
      usdPrice: 0,
      tzsPrice: 0,
      pax: tripDetails.adults + tripDetails.children,
      days: 1
    };
    setParkProducts(prev => [...prev, newProduct]);
  };

  const updateParkProduct = (id: number, field: keyof ParkProduct, value: any) => {
    setParkProducts(prev => prev.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const removeParkProduct = (id: number) => {
    setParkProducts(prev => prev.filter(product => product.id !== id));
  };

  const selectClient = (client: Client) => {
    setTripDetails(prev => ({ ...prev, clientId: client.id.toString() }));
    setClientSearchQuery(`${client.cus_first_name} ${client.cus_last_name}`);
    setShowClientDropdown(false);
  };

  const clearClientSelection = () => {
    setTripDetails(prev => ({ ...prev, clientId: "" }));
    setClientSearchQuery("");
  };

  const selectCategory = (productId: number, category: string) => {
    updateParkProduct(productId, 'category', category);
    updateParkProduct(productId, 'product_name', ''); // Clear product when category changes
    setShowCategoryDropdown(null);
    setCategorySearchQuery("");
    
    // Fetch available products when category is selected
    const product = parkProducts.find(p => p.id === productId);
    if (product && product.park && product.entry) {
      fetchAvailableProducts(category, product.entry);
    }
  };

  const selectEntryType = (productId: number, entryType: string) => {
    updateParkProduct(productId, 'entry', entryType);
    updateParkProduct(productId, 'product_name', ''); // Clear product when entry type changes
    setShowEntryTypeDropdown(null);
    setEntryTypeSearchQuery("");
    
    // Fetch available products when entry type is selected
    const product = parkProducts.find(p => p.id === productId);
    if (product && product.park && product.category) {
      fetchAvailableProducts(product.category, entryType);
    }
  };

  // Handle age group selection
  const handleAgeGroupChange = (ageGroup: string) => {
    setSelectedAgeGroup(ageGroup);
    
    // Clear all product selections when age group changes
    setParkProducts(prev => prev.map(product => ({
      ...product,
      product_name: ''
    })));
    
    // Fetch available products for all products that have category and entry type selected
    parkProducts.forEach(product => {
      if (product.park && product.category && product.entry) {
        fetchAvailableProducts(product.category, product.entry);
      }
    });
  };

  // Handle product selection and auto-populate pricing
  const selectProduct = (productId: number, selectedProduct: ProductDetails) => {
    updateParkProduct(productId, 'product_name', selectedProduct.product_name);
    
    // Auto-populate pricing if available
    if (selectedProduct.pricing && selectedProduct.pricing.length > 0) {
      const firstPricing = selectedProduct.pricing[0];
      updateParkProduct(productId, 'usdPrice', firstPricing.currency_name === 'USD' ? firstPricing.unit_amount : 0);
      updateParkProduct(productId, 'tzsPrice', firstPricing.currency_name === 'TZS' ? firstPricing.unit_amount : 0);
    }
    
    setShowProductDropdown(null);
  };

  const createOffer = async () => {
    if (!tripDetails.clientId || !tripDetails.startDate || !tripDetails.endDate || parkProducts.length === 0) {
      setMessage("Please fill in all required fields and add at least one park product");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Get company ID from user context (you might need to adjust this)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // For testing, we'll use a default company ID or get it from user metadata
      const companyId = "test-company-id"; // Replace with actual company ID logic

      // Create the offer
      const { data: offer, error: offerError } = await supabase
        .from('offer')
        .insert({
          offer_code: `TEST${Date.now()}`, // Simple test code
          offer_name: `Safari Package for ${clients.find(c => c.id.toString() === tripDetails.clientId)?.cus_first_name || 'Client'}`,
          active_from: tripDetails.startDate,
          active_to: tripDetails.endDate,
          client_id: parseInt(tripDetails.clientId), // Changed from customer_id to client_id
          owner_id: companyId
        })
        .select()
        .single();

      if (offerError) {
        throw offerError;
      }

      setMessage(`Test offer created successfully! Offer ID: ${offer.id}`);
      setMessageType("success");

      // Reset form
      setTripDetails({
        clientId: "",
        adults: 1,
        children: 0,
        childAges: [],
        adultAges: [18], // Reset adult ages
        startDate: "",
        endDate: "",
        selectedParks: []
      });
      setParkProducts([]);
      setClientSearchQuery("");

    } catch (error) {
      console.error('Error creating test offer:', error);
      setMessage(`Error creating test offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.cus_first_name} ${client.cus_last_name} ${client.cus_email_address}`
      .toLowerCase()
      .includes(clientSearchQuery.toLowerCase())
  );

  const filteredParks = nationalParks.filter(park =>
    park.national_park_name.toLowerCase().includes(parkSearchQuery.toLowerCase())
  );

  // Get filtered categories for a specific product (based on selected park)
  const getFilteredCategoriesForProduct = (productId: number) => {
    const product = parkProducts.find(p => p.id === productId);
    if (!product || !product.park) return [];
    
    const existingData = parkExistingData[product.park];
    if (!existingData) return [];
    
    return existingData.categories.filter(category =>
      category.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
  };

  // Get filtered entry types for a specific product (based on selected park)
  const getFilteredEntryTypesForProduct = (productId: number) => {
    const product = parkProducts.find(p => p.id === productId);
    if (!product || !product.park) return [];
    
    const existingData = parkExistingData[product.park];
    if (!existingData) return [];
    
    return existingData.entryTypes.filter(entryType =>
      entryType.toLowerCase().includes(entryTypeSearchQuery.toLowerCase())
    );
  };

   // Get current filtering criteria for display
   const getCurrentFilteringCriteria = () => {
     const criteria = [];
     
     if (tripDetails.startDate && tripDetails.endDate) {
       criteria.push(`Dates: ${tripDetails.startDate} to ${tripDetails.endDate}`);
     }
     
     if (tripDetails.adultAges.length > 0 || tripDetails.childAges.length > 0) {
       const ages = [...tripDetails.adultAges, ...tripDetails.childAges];
       criteria.push(`Ages: ${ages.join(', ')}`);
     }
     
     return criteria;
   };

  // Get filtered products for a specific product (based on selected criteria)
  const getFilteredProductsForProduct = (productId: number) => {
    const product = parkProducts.find(p => p.id === productId);
    if (!product || !product.park || !product.category || !product.entry) return [];
    
    console.log('Filtering products for product:', productId);
    console.log('Available products:', availableProducts);
    console.log('Product search query:', productSearchQuery);
    
    const filtered = availableProducts.filter(availableProduct =>
      availableProduct.product_name.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
    
    console.log('Filtered results:', filtered);
    return filtered;
  };

  const handleStartDateChange = (date: string) => {
    setTripDetails(prev => ({ 
      ...prev, 
      startDate: date,
      // Reset end date if it's before the new start date
      endDate: prev.endDate && date && new Date(prev.endDate) < new Date(date) ? "" : prev.endDate
    }));
    
    // Trigger product refresh after date change
    setTimeout(() => {
      refreshAllProducts();
    }, 100);
  };

  // Handle end date change
  const handleEndDateChange = (date: string) => {
    setTripDetails(prev => ({ ...prev, endDate: date }));
    
    // Trigger product refresh after date change
    setTimeout(() => {
      refreshAllProducts();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Offers System Testing</h1>
          <p className="mt-2 text-gray-600">
            Create comprehensive offers with trip details and park product selection
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {message}
          </div>
        )}

        {/* Trip Details Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trip Details
            </CardTitle>
            <CardDescription>
              Configure the basic trip information including client, guests, dates, and destinations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Selection */}
            <div>
              <Label htmlFor="clientSearch" className="text-sm font-medium">Client</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="clientSearch"
                  placeholder="Search for a client..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onClick={() => setShowClientDropdown(true)}
                  onFocus={() => setShowClientDropdown(true)}
                  className="pl-10 pr-10 cursor-pointer"
                />
                {tripDetails.clientId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearClientSelection}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {showClientDropdown && clientSearchQuery && (
                <div ref={clientDropdownRef} className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg z-10 relative">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        tripDetails.clientId === client.id.toString() ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => selectClient(client)}
                    >
                      <div className="font-medium">
                        {client.cus_first_name} {client.cus_last_name}
                      </div>
                      <div className="text-sm text-gray-600">{client.cus_email_address}</div>
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="p-3 text-gray-500 text-sm">No clients found</div>
                  )}
                </div>
              )}
              {tripDetails.clientId && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-sm">
                    Selected: {clients.find(c => c.id.toString() === tripDetails.clientId)?.cus_first_name} {clients.find(c => c.id.toString() === tripDetails.clientId)?.cus_last_name}
                  </Badge>
                </div>
              )}
            </div>

            {/* Guest Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Adults */}
              <div>
                <Label className="text-sm font-medium">Adults</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeAdult}
                    disabled={tripDetails.adults === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={tripDetails.adults}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 1;
                      const currentAdultAges = tripDetails.adultAges;
                      let newAdultAges;
                      
                      if (count > currentAdultAges.length) {
                        // Add new adults with default age 18
                        newAdultAges = [...currentAdultAges, ...Array(count - currentAdultAges.length).fill(18)];
                      } else if (count < currentAdultAges.length) {
                        // Remove adults from the end
                        newAdultAges = currentAdultAges.slice(0, count);
                      } else {
                        newAdultAges = currentAdultAges;
                      }
                      
                      setTripDetails(prev => ({ ...prev, adults: count, adultAges: newAdultAges }));
                      
                      // Trigger product refresh after state update
                      setTimeout(() => {
                        refreshAllProducts();
                      }, 100);
                    }}
                    className="w-16 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAdult}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Adult Ages */}
              {tripDetails.adults > 0 && (
                <div>
                  <Label className="text-sm font-medium">Adult Ages</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                    {tripDetails.adultAges.map((age, index) => (
                      <div key={`adult-age-${index}`} className="flex items-center gap-2">
                        <Label className="text-xs">Adult {index + 1}:</Label>
                        <Input
                          type="number"
                          min="18"
                          max="120"
                          value={age}
                          onChange={(e) => handleAdultAgeChange(index, parseInt(e.target.value) || 18)}
                          className="w-16 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Children */}
              <div>
                <Label className="text-sm font-medium">Children</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeChild}
                    disabled={tripDetails.children === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={tripDetails.children}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      const newChildAges = Array(count).fill(0);
                      setTripDetails(prev => ({ ...prev, children: count, childAges: newChildAges }));

                      // Trigger product refresh after state update
                      setTimeout(() => {
                        refreshAllProducts();
                      }, 100);
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

              {/* Age Group Selection */}
              <div>
                <Label className="text-sm font-medium">Age Group for Pricing</Label>
                <Select
                  value={selectedAgeGroup}
                  onValueChange={handleAgeGroupChange}
                >
                  <option value="">Select Age Group</option>
                  <option value="Adult">Adult (18+)</option>
                  <option value="Child">Child (0-17)</option>
                  <option value="Senior">Senior (65+)</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  This determines which pricing tier will be used for the selected products
                </p>
              </div>

              {/* Age Summary */}
              <div className="col-span-2">
                <Label className="text-sm font-medium">Current Age Filtering</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium text-gray-700">Adults: {tripDetails.adultAges.join(', ')}</div>
                  {tripDetails.childAges.length > 0 && (
                    <div className="font-medium text-gray-700 mt-1">Children: {tripDetails.childAges.join(', ')}</div>
                  )}
                  <div className="text-gray-500 mt-1">
                    Products will be filtered based on these specific ages
                  </div>
                </div>
              </div>
              
              {/* Filtering Status */}
              <div className="col-span-2">
                <Label className="text-sm font-medium">Product Filtering Status</Label>
                <div className="mt-1 p-2 bg-blue-50 rounded text-xs">
                  <div className="font-medium text-blue-700">Current Filters:</div>
                  <div className="text-blue-600 mt-1">
                    {tripDetails.startDate && tripDetails.endDate ? (
                      <div>✓ Dates: {tripDetails.startDate} to {tripDetails.endDate} (Season-based filtering)</div>
                    ) : (
                      <div>⚠ Dates: Not set (No season filtering)</div>
                    )}
                  </div>
                  <div className="text-blue-600 mt-1">
                    {tripDetails.adultAges.length > 0 || tripDetails.childAges.length > 0 ? (
                      <div>✓ Ages: {tripDetails.adultAges.join(', ')} {tripDetails.childAges.length > 0 && `+ Children: ${tripDetails.childAges.join(', ')}`} (Age group filtering)</div>
                    ) : (
                      <div>⚠ Ages: Not set (No age group filtering)</div>
                    )}
                  </div>
                  <div className="text-blue-600 mt-1">
                    {parkProducts.some(p => p.park && p.category && p.entry) ? (
                      <div>✓ Products: {parkProducts.filter(p => p.park && p.category && p.entry).length} configured (Ready for filtering)</div>
                    ) : (
                      <div>⚠ Products: No park products configured yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Child Ages */}
            {tripDetails.children > 0 && (
              <div>
                <Label className="text-sm font-medium">Child Ages</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                  {tripDetails.childAges.map((age, index) => (
                    <div key={`child-age-${index}`} className="flex items-center gap-2">
                      <Label className="text-xs">Child {index + 1}:</Label>
                      <Input
                        type="number"
                        min="0"
                        max="17"
                        value={age}
                        onChange={(e) => handleChildAgeChange(index, parseInt(e.target.value) || 0)}
                        className="w-16 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={tripDetails.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={tripDetails.endDate}
                  min={tripDetails.startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="mt-1"
                  disabled={!tripDetails.startDate}
                />
              </div>
            </div>

            {/* National Parks Selection */}
            <div>
              <Label className="text-sm font-medium">National Parks to Visit</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for national parks..."
                  value={parkSearchQuery}
                  onChange={(e) => setParkSearchQuery(e.target.value)}
                  onFocus={() => setParkSearchQuery("")}
                  className="pl-10 cursor-pointer"
                />
              </div>
              {parkSearchQuery && (
                <div ref={parkDropdownRef} className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                  {filteredParks.map((park) => (
                    <div
                      key={park.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        tripDetails.selectedParks.includes(park.id.toString()) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleParkSelection(park.id.toString())}
                    >
                      <div className="font-medium">{park.national_park_name}</div>
                    </div>
                  ))}
                </div>
              )}
              {tripDetails.selectedParks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tripDetails.selectedParks.map((parkId) => {
                    const park = nationalParks.find(p => p.id.toString() === parkId);
                    return park ? (
                      <Badge 
                        key={parkId} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => toggleParkSelection(parkId)}
                      >
                        {park.national_park_name} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Select Park Products Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Park Products
            </CardTitle>
            <CardDescription>
              Configure the specific park products, pricing, and quantities for this offer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtering Summary */}
            {getCurrentFilteringCriteria().length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800 mb-2">Active Filters:</div>
                <div className="flex flex-wrap gap-2">
                  {getCurrentFilteringCriteria().map((criterion, index) => (
                    <Badge key={`filter-badge-${criterion}-${index}`} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {criterion}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  Products will be filtered based on these criteria. Adjust dates or ages to see different results.
                </div>
              </div>
            )}
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 border-b pb-2">
              <div className="col-span-2">
                <Label className="text-xs">Park</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Category</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Entry</Label>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Product</Label>
              </div>
              <div className="col-span-1">
                <Label className="text-xs">USD</Label>
              </div>
              <div className="col-span-1">
                <Label className="text-xs">TZS</Label>
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Actions</Label>
              </div>
            </div>

            {/* Park Product Rows */}
            {parkProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-12 gap-2 items-center py-2 px-2 rounded hover:bg-gray-50">
                <div className="col-span-2 relative">
                  <Input
                    placeholder="Select Park"
                    value={product.park}
                    onChange={(e) => {
                      updateParkProduct(product.id, 'park', e.target.value);
                      setParkSearchQuery(e.target.value);
                    }}
                    onClick={() => {
                      setShowParkDropdown(product.id);
                      setParkSearchQuery("");
                    }}
                    onFocus={() => {
                      setShowParkDropdown(product.id);
                      setParkSearchQuery("");
                    }}
                    className="text-xs cursor-pointer"
                    readOnly
                  />
                  {showParkDropdown === product.id && (
                    <div ref={parkDropdownRef} className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg z-20">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search parks..."
                          value={parkSearchQuery}
                          onChange={(e) => setParkSearchQuery(e.target.value)}
                          className="text-xs"
                          autoFocus
                        />
                      </div>
                      {filteredParks.map((park) => (
                        <div
                          key={park.id}
                          className="p-2 cursor-pointer hover:bg-gray-50 text-xs"
                          onClick={() => {
                            updateParkProduct(product.id, 'park', park.national_park_name);
                            setParkSearchQuery("");
                            setShowParkDropdown(null);
                            // Clear category, entry, and product when park changes
                            updateParkProduct(product.id, 'category', '');
                            updateParkProduct(product.id, 'entry', '');
                            updateParkProduct(product.id, 'product_name', '');
                            // Fetch existing data for this park
                            fetchParkExistingData(park.national_park_name);
                          }}
                        >
                          <div className="font-medium">{park.national_park_name}</div>
                        </div>
                      ))}
                      {filteredParks.length === 0 && (
                        <div className="p-3 text-gray-500 text-xs">No parks found</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-2 relative">
                  <Input
                    placeholder="Category"
                    value={product.category}
                    onChange={(e) => {
                      updateParkProduct(product.id, 'category', e.target.value);
                      setCategorySearchQuery(e.target.value);
                      setShowCategoryDropdown(product.id);
                    }}
                    onClick={() => {
                      if (product.park) {
                        setShowCategoryDropdown(product.id);
                        setCategorySearchQuery("");
                      }
                    }}
                    onFocus={() => {
                      if (product.park) {
                        setShowCategoryDropdown(product.id);
                        setCategorySearchQuery("");
                      }
                    }}
                    className={`text-xs cursor-pointer ${!product.park ? 'opacity-50 cursor-not-allowed' : ''}`}
                    readOnly
                    disabled={!product.park}
                  />
                  {showCategoryDropdown === product.id && (
                    <div ref={categoryDropdownRef} className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg z-20">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search categories..."
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          className="text-xs"
                          autoFocus
                        />
                      </div>
                      {!product.park ? (
                        <div className="p-3 text-gray-500 text-xs">Please select a park first</div>
                      ) : getFilteredCategoriesForProduct(product.id).length === 0 ? (
                        <div className="p-3 text-gray-500 text-xs">No categories found for this park</div>
                      ) : (
                        getFilteredCategoriesForProduct(product.id).map((category) => (
                          <div
                            key={category}
                            className="p-2 cursor-pointer hover:bg-gray-50 text-xs"
                            onClick={() => selectCategory(product.id, category)}
                          >
                            <div className="font-medium">{category}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-2 relative">
                  <Input
                    placeholder="Entry Type"
                    value={product.entry}
                    onChange={(e) => {
                      updateParkProduct(product.id, 'entry', e.target.value);
                      setEntryTypeSearchQuery(e.target.value);
                      setShowEntryTypeDropdown(product.id);
                    }}
                    onClick={() => {
                      if (product.park) {
                        setShowEntryTypeDropdown(product.id);
                        setEntryTypeSearchQuery("");
                      }
                    }}
                    onFocus={() => {
                      if (product.park) {
                        setShowEntryTypeDropdown(product.id);
                        setEntryTypeSearchQuery("");
                      }
                    }}
                    className={`text-xs cursor-pointer ${!product.park ? 'opacity-50 cursor-not-allowed' : ''}`}
                    readOnly
                    disabled={!product.park}
                  />
                  {showEntryTypeDropdown === product.id && (
                    <div ref={entryTypeDropdownRef} className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg z-20">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search entry types..."
                          value={entryTypeSearchQuery}
                          onChange={(e) => setEntryTypeSearchQuery(e.target.value)}
                          className="text-xs"
                          autoFocus
                        />
                      </div>
                      {!product.park ? (
                        <div className="p-3 text-gray-500 text-xs">Please select a park first</div>
                      ) : getFilteredEntryTypesForProduct(product.id).length === 0 ? (
                        <div className="p-3 text-gray-500 text-xs">No entry types found for this park</div>
                      ) : (
                        getFilteredEntryTypesForProduct(product.id).map((entryType) => (
                          <div
                            key={entryType}
                            className="p-2 cursor-pointer hover:bg-gray-50 text-xs"
                            onClick={() => selectEntryType(product.id, entryType)}
                          >
                            <div className="font-medium">{entryType}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-3 relative">
                  <Input
                    placeholder="Select Product"
                    value={product.product_name}
                    onChange={(e) => updateParkProduct(product.id, 'product_name', e.target.value)}
                    onClick={() => {
                      setShowProductDropdown(product.id);
                      setProductSearchQuery("");
                    }}
                    onFocus={() => {
                      setShowProductDropdown(product.id);
                      setProductSearchQuery("");
                    }}
                    className="text-xs cursor-pointer"
                    readOnly
                  />
                  {showProductDropdown === product.id && (
                    <div ref={productDropdownRef} className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg z-20">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search products..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="text-xs"
                          autoFocus
                        />
                      </div>
                      {!product.park || !product.category || !product.entry ? (
                        <div className="p-3 text-gray-500 text-xs">Please select Park, Category, and Entry Type first</div>
                      ) : getFilteredProductsForProduct(product.id).length === 0 ? (
                        <div className="p-3 text-gray-500 text-xs">
                          <div>No products found for this combination</div>
                          {getCurrentFilteringCriteria().length > 0 && (
                            <div className="mt-1 text-xs">
                              <div className="font-medium">Current filters:</div>
                              {getCurrentFilteringCriteria().map((criterion, index) => (
                                <div key={`filter-criteria-${criterion}-${index}`} className="text-gray-400">• {criterion}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Show filtering criteria */}
                          {getCurrentFilteringCriteria().length > 0 && (
                            <div className="p-2 bg-blue-50 border-b text-xs text-blue-700">
                              <div className="font-medium">Filtering by:</div>
                              {getCurrentFilteringCriteria().map((criterion, index) => (
                                <div key={`filter-display-${criterion}-${index}`}>• {criterion}</div>
                              ))}
                            </div>
                          )}
                          
                          {/* Product list */}
                          {getFilteredProductsForProduct(product.id).map((availableProduct) => (
                            <div
                              key={availableProduct.id}
                              className="p-2 cursor-pointer hover:bg-gray-50 text-xs"
                              onClick={() => selectProduct(product.id, availableProduct)}
                            >
                              <div className="font-medium">{availableProduct.product_name}</div>
                              <div className="text-xs text-gray-500">
                                {availableProduct.pricing.map(p => `${p.currency_name} ${p.unit_amount}`).join(', ')}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={product.usdPrice}
                    onChange={(e) => updateParkProduct(product.id, 'usdPrice', parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    placeholder="0"
                    value={product.tzsPrice}
                    onChange={(e) => updateParkProduct(product.id, 'tzsPrice', parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeParkProduct(product.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add Another Park Button */}
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={addParkProduct}
                className="border-dashed border-2 border-gray-300 hover:border-gray-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                + Add Another Park
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Offer Button */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={createOffer}
            disabled={loading || !tripDetails.clientId || !tripDetails.startDate || !tripDetails.endDate || parkProducts.length === 0}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {loading ? "Creating Offer..." : "Create Offer"}
          </Button>
           
           {/* Debug button */}
           <Button
             onClick={() => {
               console.log('Current state:', {
                 parkProducts,
                 availableProducts,
                 tripDetails
               });
               if (parkProducts.length > 0) {
                 const firstProduct = parkProducts[0];
                 if (firstProduct.category && firstProduct.entry) {
                   console.log('Testing product fetch for:', firstProduct.category, firstProduct.entry);
                   fetchAvailableProducts(firstProduct.category, firstProduct.entry);
                 }
               }
             }}
             variant="outline"
             size="lg"
             className="px-8 py-3 text-lg"
           >
             Debug: Test Product Fetch
           </Button>
           
           {/* Database connection test button */}
           <Button
             onClick={testDatabaseConnection}
             variant="outline"
             size="sm"
             className="px-4 py-2"
           >
             Test DB Connection
           </Button>
         </div>

        {/* Data Overview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Test Data</CardTitle>
              <CardDescription>
                Current data available for testing offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                  <div className="text-sm text-gray-600">Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{nationalParks.length}</div>
                  <div className="text-sm text-gray-600">National Parks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{parkCategories.length}</div>
                  <div className="text-sm text-gray-600">Park Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{entryTypes.length}</div>
                  <div className="text-sm text-gray-600">Entry Types</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
