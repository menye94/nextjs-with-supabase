"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { DateInput } from "@/components/ui/date-input";
import { MoreHorizontal, Plus, Search, X, Check, Download, ChevronDown, Filter } from "lucide-react";
import { EnvVarWarning } from "@/components/env-var-warning";

interface CampingPriceTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface CampingPrice {
  id: number;
  product_name: string;
  camping_type: string;
  price: number;
  season_name: string;
  season_start_date?: string;
  season_end_date?: string;
  currency_name: string;
  park_name: string;
  entry_type: string;
  age_group: string;
  category_name: string;
}

export function CampingPriceTable({ searchQuery, onSearchChange }: CampingPriceTableProps) {
  const [pricing, setPricing] = useState<CampingPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingPricing, setEditingPricing] = useState<CampingPrice | null>(null);

  // Form states
  const [selectedParkIds, setSelectedParkIds] = useState<string[]>([]);
  const [selectedCampingTypeIds, setSelectedCampingTypeIds] = useState<string[]>([]);
  const [selectedEntryTypeIds, setSelectedEntryTypeIds] = useState<string[]>([]);
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>("");
  const [selectedPricingTypeId, setSelectedPricingTypeId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [taxBehavior, setTaxBehavior] = useState<string>("inclusive");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [dataError, setDataError] = useState("");
  const [dropdownError, setDropdownError] = useState("");

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    campingType: "",
    park: "",
    entryType: "",
    ageGroup: "",
    pricingType: "",
    season: "",
    minPrice: "",
    maxPrice: "",
    currency: "",
    startDate: "",
    endDate: ""
  });

  // Dropdown visibility states
  const [showParkDropdown, setShowParkDropdown] = useState(false);
  const [showCampingTypeDropdown, setShowCampingTypeDropdown] = useState(false);
  const [showEntryTypeDropdown, setShowEntryTypeDropdown] = useState(false);
  const [showAgeGroupDropdown, setShowAgeGroupDropdown] = useState(false);
  const [showPricingTypeDropdown, setShowPricingTypeDropdown] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  // Search queries
  const [parkSearchQuery, setParkSearchQuery] = useState("");
  const [campingTypeSearchQuery, setCampingTypeSearchQuery] = useState("");
  const [entryTypeSearchQuery, setEntryTypeSearchQuery] = useState("");
  const [ageGroupSearchQuery, setAgeGroupSearchQuery] = useState("");
  const [pricingTypeSearchQuery, setPricingTypeSearchQuery] = useState("");
  const [seasonSearchQuery, setSeasonSearchQuery] = useState("");

  // Data for dropdowns
  const [parks, setParks] = useState<any[]>([]);
  const [campingTypes, setCampingTypes] = useState<any[]>([]);
  const [entryTypes, setEntryTypes] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<any[]>([]);
  const [pricingTypes, setPricingTypes] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Debug: Log when rowsPerPage changes
  useEffect(() => {
    console.log('rowsPerPage changed to:', rowsPerPage);
  }, [rowsPerPage]);

  const supabase = createClient();

  // Function to generate camping product names in format: Park-CampingType-AgeGroup(EntryType)
  const generateCampingProductName = (parkName: string, campingType: string, ageGroup: string, entryType: string) => {
    // Extract park abbreviation (first 3-4 letters)
    const parkAbbr = parkName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 3);
    
    // Extract camping type abbreviation
    let campingAbbr = campingType;
    if (campingType.toLowerCase().includes('tent')) {
      campingAbbr = 'Tent';
    } else if (campingType.toLowerCase().includes('rv')) {
      campingAbbr = 'RV';
    } else if (campingType.toLowerCase().includes('glamping')) {
      campingAbbr = 'Glamping';
    } else if (campingType.toLowerCase().includes('cabin')) {
      campingAbbr = 'Cabin';
    } else if (campingType.toLowerCase().includes('treehouse')) {
      campingAbbr = 'Tree';
    } else if (campingType.toLowerCase().includes('caravan')) {
      campingAbbr = 'Caravan';
    } else if (campingType.toLowerCase().includes('backpack')) {
      campingAbbr = 'Backpack';
    }
    
    // Extract age group abbreviation
    let ageAbbr = ageGroup;
    if (ageGroup.toLowerCase().includes('adult') || ageGroup.toLowerCase().includes('18')) {
      ageAbbr = 'ADT';
    } else if (ageGroup.toLowerCase().includes('child') || ageGroup.toLowerCase().includes('kid')) {
      ageAbbr = 'CHD';
    } else if (ageGroup.toLowerCase().includes('senior') || ageGroup.toLowerCase().includes('65')) {
      ageAbbr = 'SEN';
    } else if (ageGroup.toLowerCase().includes('infant') || ageGroup.toLowerCase().includes('0')) {
      ageAbbr = 'INF';
    } else if (ageGroup.toLowerCase().includes('teen') || ageGroup.toLowerCase().includes('13')) {
      ageAbbr = 'TEN';
    }
    
    // Extract entry type abbreviation
    let entryAbbr = entryType;
    if (entryType.toLowerCase().includes('day')) {
      entryAbbr = 'Day';
    } else if (entryType.toLowerCase().includes('overnight')) {
      entryAbbr = 'Overnight';
    } else if (entryType.toLowerCase().includes('weekly')) {
      entryAbbr = 'Weekly';
    } else if (entryType.toLowerCase().includes('monthly')) {
      entryAbbr = 'Monthly';
    } else if (entryType.toLowerCase().includes('seasonal')) {
      entryAbbr = 'Seasonal';
    }
    
    return `${parkAbbr}-${campingAbbr}-${ageAbbr}(${entryAbbr})`;
  };

  // Apply filters to the data
  const filteredData = useMemo(() => {
    // Early return if no data
    if (!pricing || !Array.isArray(pricing)) return [];
    
    // Debug: Log current filters
    if (filters.startDate || filters.endDate) {
      console.log('Current date filters:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        totalItems: pricing.length
      });
    }
    
    return pricing.filter(item => {
      // Search query filtering (fast path)
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          item.product_name,
          item.camping_type,
          item.park_name,
          item.entry_type,
          item.age_group,
          item.category_name,
          item.season_name,
          item.currency_name,
          item.price.toString()
        ];
        
        if (!searchableFields.some(field => field.toLowerCase().includes(query))) {
          return false;
        }
      }
      // Camping Type filter
      if (filters.campingType && !item.camping_type.toLowerCase().includes(filters.campingType.toLowerCase())) {
        return false;
      }
      
      // Park filter
      if (filters.park && !item.park_name.toLowerCase().includes(filters.park.toLowerCase())) {
        return false;
      }
      
      // Entry Type filter
      if (filters.entryType && !item.entry_type.toLowerCase().includes(filters.entryType.toLowerCase())) {
        return false;
      }
      
      // Age Group filter
      if (filters.ageGroup && !item.age_group.toLowerCase().includes(filters.ageGroup.toLowerCase())) {
        return false;
      }
      
      // Pricing Type filter
      if (filters.pricingType && !item.category_name.toLowerCase().includes(filters.pricingType.toLowerCase())) {
        return false;
      }
      
      // Season filter
      if (filters.season && !item.season_name.toLowerCase().includes(filters.season.toLowerCase())) {
        return false;
      }
      
      // Currency filter
      if (filters.currency && !item.currency_name.toLowerCase().includes(filters.currency.toLowerCase())) {
        return false;
      }
      
      // Price range filters
      if (filters.minPrice && item.price < parseFloat(filters.minPrice)) {
        return false;
      }
      
      if (filters.maxPrice && item.price > parseFloat(filters.maxPrice)) {
        return false;
      }
      
      // Date range filters
      if (filters.startDate && filters.endDate && item.season_start_date && item.season_end_date) {
        const filterStartDate = new Date(filters.startDate);
        const filterEndDate = new Date(filters.endDate);
        const seasonStartDate = new Date(item.season_start_date);
        const seasonEndDate = new Date(item.season_end_date);
        
        // Debug logging for date range filtering
        console.log('Date range filtering:', {
          itemId: item.id,
          seasonName: item.season_name,
          filterStartDate: filterStartDate.toISOString(),
          filterEndDate: filterEndDate.toISOString(),
          seasonStartDate: seasonStartDate.toISOString(),
          seasonEndDate: seasonEndDate.toISOString(),
          hasOverlap: !(seasonStartDate > filterEndDate || seasonEndDate < filterStartDate)
        });
        
        // Check if there's any overlap between the selected range and the season
        // A season overlaps if: season starts before filter ends AND season ends after filter starts
        if (seasonStartDate > filterEndDate || seasonEndDate < filterStartDate) {
          return false;
        }
      } else if (filters.startDate && item.season_start_date) {
        // Only start date filter
        const filterStartDate = new Date(filters.startDate);
        const seasonEndDate = new Date(item.season_end_date || item.season_start_date);
        if (seasonEndDate < filterStartDate) {
          return false;
        }
      } else if (filters.endDate && item.season_end_date) {
        // Only end date filter
        const filterEndDate = new Date(filters.endDate);
        const seasonStartDate = new Date(item.season_start_date || item.season_end_date);
        if (seasonStartDate > filterEndDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [pricing, filters]);

  // Simple useEffect to fetch data on mount
  useEffect(() => {
    // Load data in parallel for better performance
    Promise.all([
      fetchCampingPricing(),
      fetchDropdownData()
    ]).catch(error => {
      console.error('Error loading initial data:', error);
    });
  }, []);

  // Keyboard shortcut for resetting rows per page
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        setRowsPerPage(25);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debug useEffect to monitor dropdown data
  useEffect(() => {
    console.log('Dropdown data state updated:', {
      entryTypes: entryTypes,
      seasons: seasons,
      entryTypesLength: entryTypes.length,
      seasonsLength: seasons.length
    });
  }, [entryTypes, seasons]);

  // Debug useEffect to check environment variables
  useEffect(() => {
    console.log('Environment variables check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ? 'Set' : 'Not set'
    });
  }, []);

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      
      // Test basic connection by checking if we can access any table
      const { data: testData, error: testError } = await supabase
        .from('entry_type')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Basic connection test failed:', testError);
        console.error('This might mean:');
        console.error('1. Environment variables are not set correctly');
        console.error('2. Database tables do not exist');
        console.error('3. Database is not accessible');
        return false;
      }
      
      console.log('Basic connection test successful');
      
      // Test specific tables
      const { data: entryTypeTest, error: entryTypeError } = await supabase
        .from('entry_type')
        .select('id, entry_name')
        .limit(1);
      
      if (entryTypeError) {
        console.error('Entry type table test failed:', entryTypeError);
        console.error('This might mean the entry_type table does not exist');
        return false;
      }
      
      const { data: seasonsTest, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, season_name')
        .limit(1);
      
      if (seasonsError) {
        console.error('Seasons table test failed:', seasonsError);
        console.error('This might mean the seasons table does not exist');
        return false;
      }
      
      console.log('Database connection test successful');
      console.log('Entry type test data:', entryTypeTest);
      console.log('Seasons test data:', seasonsTest);
      return true;
    } catch (error: any) {
      console.error('Database connection test error:', error);
      return false;
    }
  };

  const fetchDropdownData = async () => {
    try {
      console.log('Fetching dropdown data...');
      
      // Check environment variables first
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
      
      if (!hasSupabaseUrl || !hasSupabaseKey) {
        console.error('Missing environment variables:', { hasSupabaseUrl, hasSupabaseKey });
        setDropdownError('Missing Supabase environment variables. Please check your .env.local file.');
        return;
      }
      
      console.log('Environment variables are set, testing database connection...');
      
      // First test the database connection
      const connectionOk = await testDatabaseConnection();
      if (!connectionOk) {
        console.error('Database connection failed, aborting dropdown data fetch');
        setDropdownError('Database connection failed. Please check your environment variables and database setup.');
        return;
      }
      
             // Fetch all dropdown data in parallel for better performance
      const [
        { data: parksData, error: parksError },
        { data: campingTypesData, error: campingTypesError },
        { data: entryTypesData, error: entryTypesError },
        { data: ageGroupsData, error: ageGroupsError },
        { data: pricingTypesData, error: pricingTypesError },
        { data: seasonsData, error: seasonsError },
        { data: currenciesData, error: currenciesError }
      ] = await Promise.all([
        supabase.from('national_parks').select('id, national_park_name').order('national_park_name'),
        supabase.from('camping_type').select('id, name').order('name'),
        supabase.from('entry_type').select('id, entry_name').order('entry_name'),
        supabase.from('age_group').select('id, age_group_name').order('min_age'),
        supabase.from('pricing_type').select('id, pricing_type_name').order('pricing_type_name'),
        supabase.from('seasons').select('id, season_name').order('season_name'),
        supabase.from('currency').select('id, currency_name').order('currency_name')
      ]);

      // Handle errors for each query
      if (parksError) console.error('Error fetching parks:', parksError);
      if (campingTypesError) console.error('Error fetching camping types:', campingTypesError);
      if (entryTypesError) console.error('Error fetching entry types:', entryTypesError);
      if (ageGroupsError) console.error('Error fetching age groups:', ageGroupsError);
      if (pricingTypesError) console.error('Error fetching pricing types:', pricingTypesError);
      if (seasonsError) console.error('Error fetching seasons:', seasonsError);
      if (currenciesError) console.error('Error fetching currencies:', currenciesError);





      console.log('Dropdown data fetched:', {
        parks: parksData?.length || 0,
        campingTypes: campingTypesData?.length || 0,
        entryTypes: entryTypesData?.length || 0,
        ageGroups: ageGroupsData?.length || 0,
        pricingTypes: pricingTypesData?.length || 0,
        seasons: seasonsData?.length || 0,
        currencies: currenciesData?.length || 0
      });

      setParks(parksData || []);
      setCampingTypes(campingTypesData || []);
      setEntryTypes(entryTypesData || []);
      setAgeGroups(ageGroupsData || []);
      setPricingTypes(pricingTypesData || []);
      setSeasons(seasonsData || []);
      setCurrencies(currenciesData || []);
      
      // Clear dropdown error if data was fetched successfully
      setDropdownError("");
      setDropdownsLoading(false);
    } catch (error: any) {
      console.error('Error fetching dropdown data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      setDropdownError(`Error fetching dropdown data: ${error.message}`);
    }
  };

  const fetchCampingPricing = async () => {
    try {
      console.log('Fetching camping pricing...');
      
      // Single optimized query with all necessary data
      const { data, error } = await supabase
        .from('camping_products_price')
        .select(`
          id,
          unit_amount,
          camping_product:camping_products(
            id,
            product_name,
            camping_type:camping_type(id, name),
            national_park:national_parks(id, national_park_name),
            entry_type:entry_type(id, entry_name),
            age_group:age_group(id, age_group_name),
            pricing_type:pricing_type(id, pricing_type_name)
          ),
          season:seasons(id, season_name, start_date, end_date),
          currency:currency(id, currency_name)
        `)
        .is('is_deleted', null);

      if (error) {
        console.error('Error fetching camping pricing:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        console.error('Error message:', error?.message);
        console.error('Error details:', error?.details);
        console.error('Error hint:', error?.hint);
        console.error('Error code:', error?.code);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        setDataError('Failed to fetch camping pricing data. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Raw data received:', data);

      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => {
        // Generate product name using the format: Park-CampingType-AgeGroup(EntryType)
        const productName = generateCampingProductName(
          item.camping_product?.national_park?.national_park_name || 'Unknown Park',
          item.camping_product?.camping_type?.name || 'Unknown Type',
          item.camping_product?.age_group?.age_group_name || 'Unknown Age Group',
          item.camping_product?.entry_type?.entry_name || 'Unknown Entry Type'
        );

        return {
          id: item.id,
          product_name: productName,
          camping_type: item.camping_product?.camping_type?.name || 'Unknown Type',
          price: item.unit_amount,
          season_name: item.season?.season_name || 'Unknown Season',
          season_start_date: item.season?.start_date || null,
          season_end_date: item.season?.end_date || null,
          currency_name: item.currency?.currency_name || 'USD',
          park_name: item.camping_product?.national_park?.national_park_name || 'Unknown Park',
          entry_type: item.camping_product?.entry_type?.entry_name || 'Unknown Entry Type',
          age_group: item.camping_product?.age_group?.age_group_name || 'Unknown Age Group',
          category_name: item.camping_product?.pricing_type?.pricing_type_name || 'Unknown Category',
        };
      });

      console.log('Transformed data:', transformedData);
      
      // Debug: Log some sample date values
      if (transformedData.length > 0) {
        console.log('Sample product names generated:', {
          firstItem: {
            product_name: transformedData[0].product_name,
            park_name: transformedData[0].park_name,
            camping_type: transformedData[0].camping_type,
            age_group: transformedData[0].age_group,
            entry_type: transformedData[0].entry_type
          }
        });
      }
      
      setPricing(transformedData);
      setDataError(""); // Clear any previous errors
    } catch (error: any) {
      console.error('Error fetching camping pricing:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Set a user-friendly error message
      setDataError('Failed to fetch camping pricing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingPricing(null);
    setSelectedParkIds([]);
    setSelectedCampingTypeIds([]);
    setSelectedEntryTypeIds([]);
    setSelectedAgeGroupId("");
    setSelectedPricingTypeId("");
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setPrice("");
    setTaxBehavior("inclusive");
    setFormError("");
    setDataError(""); // Clear data errors when opening modal
    setDropdownError(""); // Clear dropdown errors when opening modal
    setIsModalOpen(true);
  };

  const handleEdit = async (pricing: CampingPrice) => {
    try {
      // Fetch the detailed pricing data to populate the form
      const { data: pricingData, error } = await supabase
        .from('camping_products_price')
        .select(`
          id,
          unit_amount,
          tax_behavior,
          camping_product:camping_products(
            id,
            national_park_id,
            camping_type_id,
            entry_type_id,
            age_group_id,
            pricing_type_id
          ),
          season_id,
          currency_id
        `)
        .eq('id', pricing.id)
        .single();

      if (error) {
        console.error('Error fetching pricing details:', error);
        return;
      }

      const campingProduct = pricingData.camping_product as any;

      setEditingPricing(pricing);
      setSelectedParkIds([campingProduct?.national_park_id?.toString() || ""]);
      setSelectedCampingTypeIds([campingProduct?.camping_type_id?.toString() || ""]);
      setSelectedEntryTypeIds([campingProduct?.entry_type_id?.toString() || ""]);
      setSelectedAgeGroupId(campingProduct?.age_group_id?.toString() || "");
      setSelectedPricingTypeId(campingProduct?.pricing_type_id?.toString() || "");
      setSelectedSeasonId(pricingData.season_id?.toString() || "");
      setSelectedCurrencyId(pricingData.currency_id?.toString() || "");
      setPrice(pricingData.unit_amount?.toString() || "");
      setTaxBehavior(pricingData.tax_behavior === 1 ? "inclusive" : "exclusive");
      setFormError("");
      setDataError("");
      setDropdownError("");
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error preparing edit form:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPricing(null);
    setSelectedParkIds([]);
    setSelectedCampingTypeIds([]);
    setSelectedEntryTypeIds([]);
    setSelectedAgeGroupId("");
    setSelectedPricingTypeId("");
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setPrice("");
    setTaxBehavior("inclusive");
    setFormError("");
    setDataError(""); // Clear data errors when closing modal
    setDropdownError(""); // Clear dropdown errors when closing modal
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      campingType: "",
      park: "",
      entryType: "",
      ageGroup: "",
      pricingType: "",
      season: "",
      minPrice: "",
      maxPrice: "",
      currency: "",
      startDate: "",
      endDate: ""
    });
  };

  const clearDateFilters = () => {
    setFilters(prev => ({
      ...prev,
      startDate: "",
      endDate: ""
    }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (selectedParkIds.length === 0) {
      setFormError("Please select at least one park");
      setFormLoading(false);
      return;
    }

    if (selectedCampingTypeIds.length === 0 || selectedEntryTypeIds.length === 0 || !selectedAgeGroupId || 
        !selectedPricingTypeId || !selectedSeasonId || !selectedCurrencyId || !price) {
      setFormError("Please fill in all required fields");
      setFormLoading(false);
      return;
    }

    try {
      if (editingPricing) {
        // Update existing pricing
        const { error } = await supabase
          .from('camping_products_price')
          .update({
            season_id: selectedSeasonId,
            tax_behavior: taxBehavior === 'inclusive' ? 1 : 2,
            currency_id: selectedCurrencyId,
            unit_amount: parseFloat(price)
          })
          .eq('id', editingPricing.id);

        if (error) {
          console.error('Error updating camping pricing:', error);
          setFormError('Error updating camping pricing');
          setFormLoading(false);
          return;
        }
      } else {
        // Create new pricing
        const productIds: number[] = [];

        // Create or find camping products for each selected park, camping type, and entry type combination
        for (const parkId of selectedParkIds) {
          for (const campingTypeId of selectedCampingTypeIds) {
            for (const entryTypeId of selectedEntryTypeIds) {
              let productId: number;

              // Check if camping product already exists
              const { data: existingProduct, error: productError } = await supabase
                .from('camping_products')
                .select('id')
                .eq('national_park_id', parkId)
                .eq('camping_type_id', campingTypeId)
                .eq('entry_type_id', entryTypeId)
                .eq('age_group_id', selectedAgeGroupId)
                .eq('pricing_type_id', selectedPricingTypeId)
                .is('is_deleted', null)
                .single();

              if (existingProduct) {
                productId = existingProduct.id;
              } else {
                // Create new camping product
                const { data: newProduct, error: createError } = await supabase
                  .from('camping_products')
                  .insert({
                    camping_type_id: campingTypeId,
                    entry_type_id: entryTypeId,
                    national_park_id: parkId,
                    age_group_id: selectedAgeGroupId,
                    pricing_type_id: selectedPricingTypeId,
                    product_name: `Camping Product`,
                    is_active: true
                  })
                  .select('id')
                  .single();

                if (createError) {
                  console.error('Error creating camping product:', createError);
                  setFormError('Error creating camping product');
                  setFormLoading(false);
                  return;
                }

                productId = newProduct.id;
              }

              productIds.push(productId);
            }
          }
        }

        const taxBehaviorId = taxBehavior === 'inclusive' ? 1 : 2;

        // Create pricing for each product
        for (const productId of productIds) {
          const { error } = await supabase
            .from('camping_products_price')
            .insert({
              camping_product_id: productId,
              season_id: selectedSeasonId,
              tax_behavior: taxBehaviorId,
              currency_id: selectedCurrencyId,
              unit_amount: parseFloat(price)
            });

          if (error) {
            console.error('Error creating camping pricing:', error);
            setFormError('Error creating camping pricing');
            setFormLoading(false);
            return;
          }
        }
      }

      handleCloseModal();
      fetchCampingPricing();
    } catch (error) {
      console.error('Error saving camping pricing:', error);
      setFormError('Error saving camping pricing');
    } finally {
      setFormLoading(false);
    }
  };

  const renderMultiSelectDropdown = (
    label: string,
    items: any[],
    selectedIds: string[],
    onSelectionChange: (ids: string[]) => void,
    searchQuery: string,
    onSearchChange: (query: string) => void,
    showDropdown: boolean,
    onToggleDropdown: () => void,
    itemNameKey: string,
    itemIdKey: string = 'id'
  ) => {
    const filteredItems = items.filter(item =>
      item[itemNameKey].toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleDropdown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm flex items-center justify-between"
          >
            <span className={selectedIds.length > 0 ? "text-gray-900" : "text-gray-500"}>
              {selectedIds.length > 0 
                ? `${selectedIds.length} park${selectedIds.length > 1 ? 's' : ''} selected`
                : `Select ${label}`
              }
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${label}...`}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                  />
                </div>
              </div>
              <div className="py-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const isSelected = selectedIds.includes(item[itemIdKey].toString());
                    
                    return (
                      <button
                        key={item[itemIdKey]}
                        onClick={() => {
                          if (isSelected) {
                            onSelectionChange(selectedIds.filter(id => id !== item[itemIdKey].toString()));
                          } else {
                            onSelectionChange([...selectedIds, item[itemIdKey].toString()]);
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="truncate">{item[itemNameKey]}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[var(--theme-green)] flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                ) : searchQuery ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No {label.toLowerCase()} found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No {label.toLowerCase()} available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDropdown = (
    label: string,
    items: any[],
    selectedId: string,
    onSelectionChange: (id: string) => void,
    searchQuery: string,
    onSearchChange: (query: string) => void,
    showDropdown: boolean,
    onToggleDropdown: () => void,
    itemNameKey: string,
    itemIdKey: string = 'id'
  ) => {
    const selectedItem = items.find(item => item[itemIdKey].toString() === selectedId);
    const filteredItems = items.filter(item =>
      item[itemNameKey].toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleDropdown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm flex items-center justify-between"
          >
            <span className={selectedItem ? "text-gray-900" : "text-gray-500"}>
              {selectedItem ? selectedItem[itemNameKey] : `Select ${label}`}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${label}...`}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                  />
                </div>
              </div>
              <div className="py-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <button
                      key={item[itemIdKey]}
                      onClick={() => {
                        onSelectionChange(item[itemIdKey].toString());
                        onToggleDropdown();
                        onSearchChange("");
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="truncate">{item[itemNameKey]}</span>
                      {selectedId === item[itemIdKey].toString() && (
                        <Check className="h-4 w-4 text-[var(--theme-green)] flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))
                ) : searchQuery ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No {label.toLowerCase()} found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No {label.toLowerCase()} available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: 'product_name',
      label: 'Product Code',
      sortable: true,
      render: (value: string, row: CampingPrice) => (
        <div className="group relative">
          <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded border max-w-[140px] truncate block">
            {value}
          </span>
          {/* Tooltip with full description */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 max-w-xs">
            <div className="text-center">
              <div className="font-semibold mb-1">Full Description</div>
              <div className="break-words">{row.park_name}</div>
              <div className="break-words">{row.camping_type}</div>
              <div className="break-words">{row.age_group}</div>
              <div className="break-words">{row.entry_type}</div>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      ),
    },
    {
      key: 'camping_type',
      label: 'Camping Type',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </span>
      ),
    },
    {
      key: 'park_name',
      label: 'Park',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </span>
      ),
    },
    {
      key: 'entry_type',
      label: 'Entry Type',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </span>
      ),
    },
    {
      key: 'age_group',
      label: 'Age Group',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </span>
      ),
    },
    {
      key: 'category_name',
      label: 'Pricing Type',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, row: CampingPrice) => (
        <span className="font-medium">
          {value?.toFixed(2)} {row.currency_name}
        </span>
      ),
    },
    {
      key: 'season_name',
      label: 'Season',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: CampingPrice) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {openMenuId === row.id && (
            <div className="absolute right-0 top-8 z-50 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="py-1">
                                 <button
                   onClick={() => {
                     setOpenMenuId(null);
                     handleEdit(row);
                   }}
                   className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                 >
                   Edit
                 </button>
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading camping pricing...</div>
      </div>
    );
  }

  // Show table even if dropdowns are still loading
  if (pricing.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No camping pricing data found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
             <EnvVarWarning />
      
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Camping Pricing</h1>
            <p className="text-sm text-gray-500 mt-1">Manage pricing for camping products and services</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Camping Pricing
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search camping pricing..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-96 text-gray-900"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-gray-300 text-gray-700 hover:bg-gray-50 ${hasActiveFilters ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {Object.values(filters).filter(v => v !== "").length}
              </span>
            )}
          </Button>
        </div>
      </div>

       {/* Filters Section */}
       {showFilters && (
         <div className="bg-white rounded-lg border border-gray-200 p-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-medium text-gray-900">Filters</h3>
             <div className="flex items-center space-x-2">
               {hasActiveFilters && (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={clearFilters}
                   className="text-red-600 border-red-300 hover:bg-red-50"
                 >
                   Clear All
                 </Button>
               )}
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowFilters(false)}
                 className="text-gray-600"
               >
                 <X className="h-4 w-4" />
               </Button>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {/* Camping Type Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Camping Type
               </label>
               <input
                 type="text"
                 placeholder="Filter by camping type..."
                 value={filters.campingType}
                 onChange={(e) => handleFilterChange('campingType', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Park Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Park
               </label>
               <input
                 type="text"
                 placeholder="Filter by park..."
                 value={filters.park}
                 onChange={(e) => handleFilterChange('park', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Entry Type Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Entry Type
               </label>
               <input
                 type="text"
                 placeholder="Filter by entry type..."
                 value={filters.entryType}
                 onChange={(e) => handleFilterChange('entryType', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Age Group Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Age Group
               </label>
               <input
                 type="text"
                 placeholder="Filter by age group..."
                 value={filters.ageGroup}
                 onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Pricing Type Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Pricing Type
               </label>
               <input
                 type="text"
                 placeholder="Filter by pricing type..."
                 value={filters.pricingType}
                 onChange={(e) => handleFilterChange('pricingType', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Season Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Season
               </label>
               <input
                 type="text"
                 placeholder="Filter by season..."
                 value={filters.season}
                 onChange={(e) => handleFilterChange('season', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Currency Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Currency
               </label>
               <input
                 type="text"
                 placeholder="Filter by currency..."
                 value={filters.currency}
                 onChange={(e) => handleFilterChange('currency', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Min Price Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Min Price
               </label>
               <input
                 type="number"
                 step="0.01"
                 min="0"
                 placeholder="Min price..."
                 value={filters.minPrice}
                 onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Max Price Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Max Price
               </label>
               <input
                 type="number"
                 step="0.01"
                 min="0"
                 placeholder="Max price..."
                 value={filters.maxPrice}
                 onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>

             {/* Start Date Filter */}
             <div className="flex items-center space-x-2">
               <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                 Start Date:
               </Label>
               <DateInput
                 id="startDate"
                 value={filters.startDate}
                 onChange={(value) => handleFilterChange('startDate', value)}
                 size="small"
               />
             </div>

             {/* End Date Filter */}
             <div className="flex items-center space-x-2">
               <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                 End Date:
               </Label>
               <DateInput
                 id="endDate"
                 value={filters.endDate}
                 onChange={(value) => handleFilterChange('endDate', value)}
                 size="small"
               />
             </div>
           </div>

           {/* Active Filters Summary */}
           {hasActiveFilters && (
             <div className="mt-4 pt-4 border-t border-gray-200">
               <div className="flex items-center space-x-2">
                 <span className="text-sm font-medium text-gray-700">Active filters:</span>
                 {Object.entries(filters).map(([key, value]) => {
                   if (!value) return null;
                   return (
                     <span
                       key={key}
                       className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                     >
                       {key}: {value}
                       <button
                         onClick={() => handleFilterChange(key, "")}
                         className="ml-1 text-blue-600 hover:text-blue-800"
                       >
                         <X className="h-3 w-3" />
                       </button>
                     </span>
                   );
                 })}
               </div>
             </div>
           )}
         </div>
       )}

      {/* Error Display */}
      {dataError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <div className="mt-2 text-sm text-red-700">{dataError}</div>
              <div className="mt-3">
                <Button
                  onClick={() => {
                    setDataError("");
                    setLoading(true);
                    fetchCampingPricing();
                  }}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Info */}
      {pricing.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center justify-between text-sm text-blue-800">
            <div className="flex items-center space-x-4">
              <span>
                📊 Showing {filteredData.length} of {pricing.length} camping pricing records
                {dropdownsLoading && " • Loading dropdown data..."}
              </span>
              {/* Page Size Info */}
              <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                📄 {rowsPerPage === filteredData.length ? 'All rows' : `${rowsPerPage} rows per page`}
                {rowsPerPage !== filteredData.length && ` • ${Math.ceil(filteredData.length / rowsPerPage)} pages`}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span>⚡ Optimized for performance</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Table with Enhanced Pagination */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Pagination Controls Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{filteredData.length}</span> camping pricing records found
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="pagination-limit" className="text-sm font-medium text-gray-700">
                  Show:
                </Label>
                <select
                  id="pagination-limit"
                  value={rowsPerPage === filteredData.length ? 'all' : rowsPerPage}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'all') {
                      setRowsPerPage(filteredData.length);
                    } else {
                      setRowsPerPage(Number(value));
                    }
                  }}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] hover:border-gray-400 transition-colors"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value={200}>200 per page</option>
                  <option value={500}>500 per page</option>
                  <option value="all">Show All ({filteredData.length})</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRowsPerPage(25)}
                  className="text-xs h-8 px-3 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>💡 Tip: Use Ctrl+R to reset pagination</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          searchQuery={searchQuery}
          onAddNew={handleAddNew}
          addNewLabel="Add New Camping Pricing"
          searchFields={['product_name', 'camping_type', 'park_name', 'entry_type', 'age_group', 'category_name']}
          itemsPerPage={rowsPerPage}
          showPagination={true}
        />
      </div>

             {/* Modal */}
       <Modal
         isOpen={isModalOpen}
         onClose={handleCloseModal}
         title={editingPricing ? "Edit Camping Pricing" : "Add New Camping Pricing"}
       >
        <div className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
                         {/* Dropdown Error Display */}
             {dropdownError && (
               <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                 <div className="flex">
                   <div className="flex-shrink-0">
                     <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                     </svg>
                   </div>
                   <div className="ml-3 flex-1">
                     <h3 className="text-sm font-medium text-red-800">Dropdown Data Error</h3>
                     <div className="mt-2 text-sm text-red-700">{dropdownError}</div>
                     <div className="mt-3 space-y-2">
                       <div className="text-xs text-red-600">
                         <p>Possible solutions:</p>
                         <ul className="list-disc list-inside mt-1">
                           <li>Check if .env.local file exists with Supabase credentials</li>
                           <li>Verify database tables exist and have data</li>
                           <li>Check browser console for detailed error messages</li>
                         </ul>
                       </div>
                       <Button
                         onClick={() => {
                           setDropdownError("");
                           fetchDropdownData();
                         }}
                         size="sm"
                         className="bg-red-600 hover:bg-red-700"
                       >
                         Retry Fetch
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             )}

            {/* National Parks - Multi-select */}
            {renderMultiSelectDropdown(
              "National Parks",
              parks,
              selectedParkIds,
              setSelectedParkIds,
              parkSearchQuery,
              setParkSearchQuery,
              showParkDropdown,
              () => setShowParkDropdown(!showParkDropdown),
              'national_park_name',
              'id'
            )}

                         {/* Camping Type - Multi-select */}
             {renderMultiSelectDropdown(
               "Camping Type",
               campingTypes,
               selectedCampingTypeIds,
               setSelectedCampingTypeIds,
               campingTypeSearchQuery,
               setCampingTypeSearchQuery,
               showCampingTypeDropdown,
               () => setShowCampingTypeDropdown(!showCampingTypeDropdown),
               'name'
             )}

                         {/* Entry Type - Multi-select */}
             {renderMultiSelectDropdown(
               "Entry Type",
               entryTypes,
               selectedEntryTypeIds,
               setSelectedEntryTypeIds,
               entryTypeSearchQuery,
               setEntryTypeSearchQuery,
               showEntryTypeDropdown,
               () => setShowEntryTypeDropdown(!showEntryTypeDropdown),
               'entry_name'
             )}

            {/* Age Group */}
            {renderDropdown(
              "Age Group",
              ageGroups,
              selectedAgeGroupId,
              setSelectedAgeGroupId,
              ageGroupSearchQuery,
              setAgeGroupSearchQuery,
              showAgeGroupDropdown,
              () => setShowAgeGroupDropdown(!showAgeGroupDropdown),
              'age_group_name'
            )}

            {/* Pricing Type */}
            {renderDropdown(
              "Pricing Type",
              pricingTypes,
              selectedPricingTypeId,
              setSelectedPricingTypeId,
              pricingTypeSearchQuery,
              setPricingTypeSearchQuery,
              showPricingTypeDropdown,
              () => setShowPricingTypeDropdown(!showPricingTypeDropdown),
              'pricing_type_name'
            )}

            {/* Season */}
            {renderDropdown(
              "Season",
              seasons,
              selectedSeasonId,
              setSelectedSeasonId,
              seasonSearchQuery,
              setSeasonSearchQuery,
              showSeasonDropdown,
              () => setShowSeasonDropdown(!showSeasonDropdown),
              'season_name'
            )}

                         {/* Price and Currency Input Group */}
             <div className="grid grid-cols-3 gap-4">
               <div className="col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Price
                 </label>
                 <input
                   type="number"
                   step="0.01"
                   min="0"
                   value={price}
                   onChange={(e) => setPrice(e.target.value)}
                   placeholder="Enter price"
                   className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                 />
               </div>
                               <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={selectedCurrencyId}
                    onChange={(e) => setSelectedCurrencyId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                  >
                    <option value="">Select Currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.currency_name}
                      </option>
                    ))}
                  </select>
                </div>
             </div>

            {/* Tax Behavior Radio Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tax Behavior
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="taxBehavior"
                    value="inclusive"
                    checked={taxBehavior === "inclusive"}
                    onChange={(e) => setTaxBehavior(e.target.value)}
                    className="h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">Tax Inclusive</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="taxBehavior"
                    value="exclusive"
                    checked={taxBehavior === "exclusive"}
                    onChange={(e) => setTaxBehavior(e.target.value)}
                    className="h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">Tax Exclusive</span>
                </label>
              </div>
            </div>
            
            {/* Error Message */}
            {formError && (
              <div className="text-red-600 text-sm">
                {formError}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseModal}
              disabled={formLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
                         <button
               onClick={(e) => handleSubmit(e as any)}
               disabled={formLoading}
               className="px-4 py-2 bg-[var(--theme-green)] text-white rounded-md text-sm font-medium hover:bg-[var(--theme-green-dark)] disabled:opacity-50"
             >
               {formLoading ? (editingPricing ? "Updating..." : "Saving...") : (editingPricing ? "Update" : "Add")}
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 