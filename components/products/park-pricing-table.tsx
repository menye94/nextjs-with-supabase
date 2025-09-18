"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronDown, Check, Search, Plus, Download, Filter } from "lucide-react";

interface ParkPricingTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface ParkPricing {
  id: number;
  product_name: string;
  park_name: string;
  entry_type: string;
  age_group: string;
  category_name?: string;
  price: number;
  season_name: string;
  currency_name: string;
}

interface NationalPark {
  id: number;
  national_park_name: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface EntryType {
  id: number;
  entry_name: string;
}



interface Currency {
  id: number;
  currency_name: string;
}

interface AgeGroup {
  id: number;
  age_group_name: string;
  min_age: number;
  max_age: number;
}

interface PricingType {
  id: number;
  pricing_type_name: string;
}

interface Season {
  id: number;
  season_name: string;
  start_date: string;
  end_date: string;
}

interface ParkProduct {
  id: number;
  national_park_id: number;
  entry_type_id: number;
  park_category_id?: number;
  age_group: number;
  pricing_type_id: number;
}

export function ParkPricingTable({ searchQuery, onSearchChange }: ParkPricingTableProps) {
  const [pricing, setPricing] = useState<ParkPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<ParkPricing | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Filter states
  const [filterPark, setFilterPark] = useState<string>("");
  const [filterEntryType, setFilterEntryType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [selectedParkIds, setSelectedParkIds] = useState<string[]>([]); // Changed to array for multiple parks
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedEntryTypeIds, setSelectedEntryTypeIds] = useState<string[]>([]); // Changed to array for multiple entry types
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("");
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<string[]>([]); // Changed to array for multiple age groups
  const [selectedPricingTypeId, setSelectedPricingTypeId] = useState<string>("1"); // Default to "Per Person"
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [taxBehavior, setTaxBehavior] = useState<string>("exclusive");

  // Dropdown data
  const [parks, setParks] = useState<NationalPark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [pricingTypes, setPricingTypes] = useState<PricingType[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [existingProducts, setExistingProducts] = useState<{ [key: string]: boolean }>({});
  const [exactDuplicates, setExactDuplicates] = useState<{ [key: string]: boolean }>({});

  // Dropdown states
  const [parkDropdownOpen, setParkDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [entryTypeDropdownOpen, setEntryTypeDropdownOpen] = useState(false);

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [ageGroupDropdownOpen, setAgeGroupDropdownOpen] = useState(false);
  const [pricingTypeDropdownOpen, setPricingTypeDropdownOpen] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);

  // Search states
  const [parkSearchQuery, setParkSearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [entryTypeSearchQuery, setEntryTypeSearchQuery] = useState("");

  const [currencySearchQuery, setCurrencySearchQuery] = useState("");
  const [ageGroupSearchQuery, setAgeGroupSearchQuery] = useState("");
  const [pricingTypeSearchQuery, setPricingTypeSearchQuery] = useState("");
  const [seasonSearchQuery, setSeasonSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchParkPricing();
    fetchDropdownData();
  }, []);

     // Debug: Log when parks data changes
   useEffect(() => {
     console.log('Parks data updated:', parks.length, 'parks available');
     if (parks.length > 0) {
       console.log('Sample parks:', parks.slice(0, 3).map(p => p.national_park_name));
     }
   }, [parks]);

       // Debug: Log when age groups data changes
    useEffect(() => {
      console.log('Age groups data updated:', ageGroups.length, 'age groups available');
      if (ageGroups.length > 0) {
        console.log('Sample age groups:', ageGroups.slice(0, 3).map(ag => ag.age_group_name));
      }
    }, [ageGroups]);

         // Update existing products when relevant form fields change
     useEffect(() => {
       const updateExistingProducts = async () => {
         if (selectedEntryTypeIds.length > 0 && selectedAgeGroupIds.length > 0 && selectedPricingTypeId && selectedSeasonId && parks.length > 0) {
           const existing = await getExistingProducts();
           setExistingProducts(existing);
         }
       };

       const updateExactDuplicates = async () => {
         if (selectedEntryTypeIds.length > 0 && selectedAgeGroupIds.length > 0 && selectedPricingTypeId && selectedSeasonId && taxBehavior && parks.length > 0) {
           const exact = await getExactDuplicates();
           setExactDuplicates(exact);
         }
       };

       updateExistingProducts();
       updateExactDuplicates();
            }, [selectedEntryTypeIds, selectedCategoryId, selectedAgeGroupIds, selectedPricingTypeId, selectedSeasonId, taxBehavior, parks]);

     // Debug: Log when age group selection changes
     useEffect(() => {
       console.log('Age group selection changed to:', selectedAgeGroupIds);
     }, [selectedAgeGroupIds]);

     // Debug: Log when pricing type selection changes
     useEffect(() => {
       console.log('Pricing type selection changed to:', selectedPricingTypeId);
     }, [selectedPricingTypeId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchParkPricing = async () => {
    try {
      // First try to use the new readable view for better data structure
      let { data, error } = await supabase
        .from('park_product_readable')
        .select(`
          id,
          abbreviated_name,
          full_park_name,
          full_entry_type,
          full_age_group,
          category,
          pricing_type
        `);
      
      // If the view doesn't exist or fails, fall back to the original approach
      if (error || !data || data.length === 0) {
        console.log('Falling back to original park_product table fetch');
        
        // Fetch from the original park_product table
        const { data: productData, error: productError } = await supabase
          .from('park_product')
          .select(`
            id,
            product_name,
            national_park:national_parks(national_park_name),
            entry_type:entry_type(entry_name),
            age_group:age_group(age_group_name),
            park_category:park_category(category_name),
            pricing_type:pricing_type(pricing_type_name)
          `);
        
        if (productError) {
          console.error('Error fetching product data:', productError);
          return;
        }
        
        // Transform the fallback data
        data = (productData || []).map((item: any) => ({
          id: item.id,
          abbreviated_name: item.product_name, // Use existing product_name as fallback
          full_park_name: item.national_park?.national_park_name || 'Unknown Park',
          full_entry_type: item.entry_type?.entry_name || 'Unknown Entry Type',
          full_age_group: item.age_group?.age_group_name || 'Unknown Age Group',
          category: item.park_category?.category_name || 'No Category',
          pricing_type: item.pricing_type?.pricing_type_name || 'Unknown Pricing Type'
        }));
      }
      
      // Also fetch pricing data separately
      const { data: pricingData, error: pricingError } = await supabase
        .from('park_product_price')
        .select(`
          id,
          unit_amount,
          park_product_id,
          season:seasons(season_name),
          currency:currency(currency_name)
        `);
      
      if (pricingError) {
        console.error('Error fetching pricing data:', pricingError);
        return;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => {
        // Find corresponding pricing data
        const pricing = pricingData?.find((p: any) => p.park_product_id === item.id);
        
        // Generate abbreviated name if the original is too long
        let productName = item.abbreviated_name;
        if (!productName || productName.length > 20) {
          productName = generateAbbreviatedName(
            item.full_park_name || 'Unknown Park',
            item.full_entry_type || 'Unknown Entry Type',
            item.full_age_group || 'Unknown Age Group',
            item.category
          );
        }
        
        return {
          id: item.id,
          product_name: productName,
          park_name: item.full_park_name,
          entry_type: item.full_entry_type,
          age_group: item.full_age_group,
          category_name: item.category || 'No Category',
          price: pricing?.unit_amount || 0,
          season_name: (pricing?.season as any)?.season_name || 'Unknown Season',
          currency_name: (pricing?.currency as any)?.currency_name || 'USD',
        };
      });

      console.log('Transformed pricing data:', transformedData.slice(0, 3));
      console.log('Sample product names:', transformedData.slice(0, 3).map(item => ({
        id: item.id,
        product_name: item.product_name,
        length: item.product_name?.length
      })));
      setPricing(transformedData);
    } catch (error) {
      console.error('Error fetching park pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch parks
      const { data: parksData, error: parksError } = await supabase
        .from('national_parks')
        .select('id, national_park_name')
        .order('national_park_name');
      
      if (parksError) {
        console.error('Error fetching parks:', parksError);
      } else {
        console.log('Parks loaded:', parksData?.length || 0);
        setParks(parksData || []);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('park_category')
        .select('id, category_name')
        .order('category_name');
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

      // Fetch entry types
      const { data: entryTypesData, error: entryTypesError } = await supabase
        .from('entry_type')
        .select('id, entry_name')
        .order('entry_name');
      
      if (entryTypesError) {
        console.error('Error fetching entry types:', entryTypesError);
      } else {
        setEntryTypes(entryTypesData || []);
      }

      // Fetch seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, season_name, start_date, end_date')
        .order('season_name');
      
      if (seasonsError) {
        console.error('Error fetching seasons:', seasonsError);
      } else {
        setSeasons(seasonsData || []);
      }

             // Fetch currencies
       const { data: currenciesData, error: currenciesError } = await supabase
         .from('currency')
         .select('id, currency_name')
         .order('currency_name');
       
       if (currenciesError) {
         console.error('Error fetching currencies:', currenciesError);
       } else {
         setCurrencies(currenciesData || []);
       }

               // Fetch age groups
        const { data: ageGroupsData, error: ageGroupsError } = await supabase
          .from('age_group')
          .select('id, age_group_name, min_age, max_age')
          .order('min_age');
        
        if (ageGroupsError) {
          console.error('Error fetching age groups:', ageGroupsError);
        } else {
          console.log('Age groups loaded:', ageGroupsData?.length || 0);
          if (ageGroupsData && ageGroupsData.length > 0) {
            console.log('Sample age groups:', ageGroupsData.slice(0, 3).map(ag => ag.age_group_name));
          }
          setAgeGroups(ageGroupsData || []);
        }

        // Fetch pricing types
        const { data: pricingTypesData, error: pricingTypesError } = await supabase
          .from('pricing_type')
          .select('id, pricing_type_name')
          .order('pricing_type_name');
        
        if (pricingTypesError) {
          console.error('Error fetching pricing types:', pricingTypesError);
        } else {
          console.log('Pricing types loaded:', pricingTypesData?.length || 0);
          if (pricingTypesData && pricingTypesData.length > 0) {
            console.log('Sample pricing types:', pricingTypesData.slice(0, 3).map(pt => pt.pricing_type_name));
          }
          setPricingTypes(pricingTypesData || []);
        }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

     const getSelectedParks = () => parks.filter(park => selectedParkIds.includes(park.id.toString()));
   const getSelectedPark = () => parks.find(park => park.id.toString() === selectedParkIds[0]); // For backward compatibility
   const getSelectedCategory = () => categories.find(cat => cat.id.toString() === selectedCategoryId);

       // Function to check for existing products based on current form selections
    const getExistingProducts = async () => {
      if (selectedEntryTypeIds.length === 0 || selectedAgeGroupIds.length === 0 || selectedPricingTypeId === undefined) {
        return {};
      }

      const existingProducts: { [key: string]: boolean } = {};
      
      for (const park of parks) {
        const { data: existingProduct } = await supabase
          .from('park_product')
          .select('id')
          .eq('national_park_id', park.id)
          .in('entry_type_id', selectedEntryTypeIds)
          .eq('park_category_id', selectedCategoryId || null)
          .in('age_group', selectedAgeGroupIds)
          .eq('pricing_type_id', selectedPricingTypeId);

        existingProducts[park.id.toString()] = (existingProduct && existingProduct.length > 0) || false;
      }

      return existingProducts;
    };

    // Function to check for exact duplicates (including tax behavior)
    const getExactDuplicates = async () => {
      if (selectedEntryTypeIds.length === 0 || selectedAgeGroupIds.length === 0 || selectedPricingTypeId === undefined || taxBehavior === undefined) {
        return {};
      }

      const exactDuplicates: { [key: string]: boolean } = {};
      const taxBehaviorId = taxBehavior === 'exclusive' ? 2 : 1;
      
      for (const park of parks) {
        // First check if product exists
        const { data: existingProduct } = await supabase
          .from('park_product')
          .select('id')
          .eq('national_park_id', park.id)
          .in('entry_type_id', selectedEntryTypeIds)
          .eq('park_category_id', selectedCategoryId || null)
          .in('age_group', selectedAgeGroupIds)
          .eq('pricing_type_id', selectedPricingTypeId);

        if (existingProduct && existingProduct.length > 0) {
          // Then check if pricing exists with same season and tax behavior
          const { data: existingPricing } = await supabase
            .from('park_product_price')
            .select('id')
            .eq('park_product_id', existingProduct[0].id)
            .eq('season_id', selectedSeasonId)
            .eq('tax_behavior', taxBehaviorId);

          exactDuplicates[park.id.toString()] = (existingPricing && existingPricing.length > 0) || false;
        } else {
          exactDuplicates[park.id.toString()] = false;
        }
      }

      return exactDuplicates;
    };
  const getSelectedEntryType = () => entryTypes.find(type => type.id.toString() === selectedEntryTypeIds[0]);

  const getSelectedCurrency = () => currencies.find(currency => currency.id.toString() === selectedCurrencyId);
  const getSelectedAgeGroup = () => ageGroups.find(ageGroup => ageGroup.id.toString() === selectedAgeGroupIds[0]);
  const getSelectedPricingType = () => pricingTypes.find(pricingType => pricingType.id.toString() === selectedPricingTypeId);
  const getSelectedSeason = () => seasons.find(season => season.id.toString() === selectedSeasonId);

  // Filter the pricing data based on selected filters
  const getFilteredPricing = () => {
    let filtered = pricing;

    if (filterPark) {
      filtered = filtered.filter(item => 
        item.park_name.toLowerCase().includes(filterPark.toLowerCase())
      );
    }

    if (filterEntryType) {
      filtered = filtered.filter(item => 
        item.entry_type.toLowerCase().includes(filterEntryType.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter(item => 
        item.category_name?.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }

    return filtered;
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterPark("");
    setFilterEntryType("");
    setFilterCategory("");
  };

  // Check if any filters are active
  const hasActiveFilters = filterPark || filterEntryType || filterCategory;

  // Function to generate abbreviated product names on the fly
  const generateAbbreviatedName = (parkName: string, entryType: string, ageGroup: string, category?: string) => {
    // Extract first 3-4 letters from park name
    const parkAbbr = parkName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 3);
    
    // Extract first 2-3 letters from entry type
    const entryAbbr = entryType.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
    
    // Extract age group abbreviation
    let ageAbbr = '16+';
    if (ageGroup.toLowerCase().includes('5') && ageGroup.toLowerCase().includes('15')) {
      ageAbbr = '5-15';
    } else if (ageGroup.toLowerCase().includes('below') || ageGroup.toLowerCase().includes('5')) {
      ageAbbr = '0-4';
    } else if (ageGroup.toLowerCase().includes('student')) {
      ageAbbr = 'STU';
    } else if (ageGroup.toLowerCase().includes('senior')) {
      ageAbbr = 'SEN';
    }
    
    // Extract category abbreviation if exists
    const categoryAbbr = category ? category.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2) : '';
    
    return categoryAbbr ? `${parkAbbr}-${entryAbbr}-${categoryAbbr}-${ageAbbr}` : `${parkAbbr}-${entryAbbr}-${ageAbbr}`;
  };

  const columns = [
    {
      key: 'product_name',
      label: 'Product Code',
      sortable: true,
      render: (value: string, row: ParkPricing) => (
        <div className="group relative">
          <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded border max-w-[120px] truncate block">
            {value}
          </span>
          {/* Tooltip with full description */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 max-w-xs">
            <div className="text-center">
              <div className="font-semibold mb-1">Full Description</div>
              <div className="break-words">{row.park_name}</div>
              <div className="break-words">{row.entry_type}</div>
              <div className="break-words">{row.age_group}</div>
              <div className="break-words">{row.category_name}</div>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      ),
    },
    {
      key: 'park_name',
      label: 'Park Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </span>
      ),
    },
    {
      key: 'entry_type',
      label: 'Entry Type',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </span>
      ),
    },
    {
      key: 'age_group',
      label: 'Age Group',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {value}
        </span>
      ),
    },
    {
      key: 'category_name',
      label: 'Category',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">
          {value.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, row: ParkPricing) => (
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
          {value.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: ParkPricing) => (
        <div className="relative flex justify-center" ref={(el) => {
          if (el) {
            menuRefs.current[row.id] = el;
          }
        }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-600" />
          </button>
          
          {openMenuId === row.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleDelete(row)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
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

  const handleAddNew = () => {
    setEditingPricing(null);
    setSelectedParkIds([]); // Reset to empty array
    setSelectedCategoryId("");
    setSelectedEntryTypeIds([]);
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setSelectedAgeGroupIds([]); // Reset to empty array
    setSelectedPricingTypeId("1"); // Default to "Per Person"
    setPrice("");
    setTaxBehavior("exclusive");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = async (pricing: ParkPricing) => {
    setEditingPricing(pricing);
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);

    try {
             // Fetch the full pricing record to get all the related data
       const { data: pricingData, error } = await supabase
         .from('park_product_price')
         .select(`
           id,
           unit_amount,
           tax_behavior,
           park_product:park_product(
             id,
             national_park_id,
             entry_type_id,
             park_category_id,
             age_group,
             pricing_type_id
           ),
           season_id,
           currency_id
         `)
         .eq('id', pricing.id)
         .single();

      if (error) {
        console.error('Error fetching pricing data for edit:', error);
        setFormError('Error loading pricing data for editing');
        return;
      }

                           if (pricingData) {
          // Debug: Log the fetched data
          console.log('Pricing data for edit:', pricingData);
          console.log('Park product data:', pricingData.park_product);
          
          // Populate form with existing data
          setPrice(pricingData.unit_amount.toString());
          // Convert tax_behavior integer to string based on seed data
          // From seed data: 1='Tax Inclusive', 2='Tax Exclusive'
          const taxBehaviorString = pricingData.tax_behavior === 2 ? 'exclusive' : 'inclusive';
          setTaxBehavior(taxBehaviorString);
          setSelectedSeasonId(pricingData.season_id.toString());
          setSelectedCurrencyId(pricingData.currency_id.toString());

                  if (pricingData.park_product) {
            const parkProduct = Array.isArray(pricingData.park_product) ? pricingData.park_product[0] : pricingData.park_product;
            setSelectedParkIds([parkProduct.national_park_id.toString()]); // Single park for editing
            setSelectedEntryTypeIds([parkProduct.entry_type_id.toString()]);
            setSelectedCategoryId(parkProduct.park_category_id?.toString() || '');
            
            // Debug: Log age group and pricing type data
            console.log('Age group from DB:', parkProduct.age_group);
            console.log('Pricing type from DB:', parkProduct.pricing_type_id);
            
            setSelectedAgeGroupIds([parkProduct.age_group?.toString() || '4']);
            setSelectedPricingTypeId(parkProduct.pricing_type_id?.toString() || '1');
            
            // Debug: Log the set values
            console.log('Set age group ID to:', parkProduct.age_group?.toString() || '4');
            console.log('Set pricing type ID to:', parkProduct.pricing_type_id?.toString() || '1');
          }
       }
    } catch (error) {
      console.error('Error setting up edit form:', error);
      setFormError('Error loading pricing data for editing');
    }
  };

  const handleDelete = async (pricing: ParkPricing) => {
    if (window.confirm(`Are you sure you want to delete this pricing record? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('park_product_price')
          .delete()
          .eq('id', pricing.id);

        if (error) {
          console.error('Error deleting pricing:', error);
          return;
        }

        fetchParkPricing();
        setOpenMenuId(null);
      } catch (error) {
        console.error('Error deleting pricing:', error);
      }
    }
  };

  const handleCloseModal = () => {
    // Prevent closing if form is loading
    if (formLoading) {
      return;
    }
    
    setIsModalOpen(false);
    setEditingPricing(null);
    setSelectedParkIds([]);
    setSelectedCategoryId("");
    setSelectedEntryTypeIds([]);
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setSelectedAgeGroupIds([]);
    setSelectedPricingTypeId("1");
    setPrice("");
    setTaxBehavior("exclusive");
    setFormError("");
    // Reset dropdown states
    setParkDropdownOpen(false);
    setCategoryDropdownOpen(false);
    setEntryTypeDropdownOpen(false);
    setSeasonDropdownOpen(false);
    setCurrencyDropdownOpen(false);
    setAgeGroupDropdownOpen(false);
    setPricingTypeDropdownOpen(false);
    
    // Reset loading progress
    setLoadingProgress({ current: 0, total: 0 });
  };

  // Reset filters when new data is fetched
  useEffect(() => {
    if (!loading && pricing.length > 0) {
      // Only reset filters if they don't match any data
      if (filterPark && !pricing.some(item => item.park_name.toLowerCase().includes(filterPark.toLowerCase()))) {
        setFilterPark("");
      }
      if (filterEntryType && !pricing.some(item => item.entry_type.toLowerCase().includes(filterEntryType.toLowerCase()))) {
        setFilterEntryType("");
      }
      if (filterCategory && !pricing.some(item => item.category_name?.toLowerCase().includes(filterCategory.toLowerCase()))) {
        setFilterCategory("");
      }
    }
  }, [pricing, loading, filterPark, filterEntryType, filterCategory]);

         const handleSubmit = async () => {
          if (selectedParkIds.length === 0 || selectedEntryTypeIds.length === 0 || !selectedSeasonId || !selectedCurrencyId || selectedAgeGroupIds.length === 0 || selectedPricingTypeId === undefined || !price) {
        setFormError("All fields are required");
        return;
      }

     const priceValue = parseFloat(price);
     if (isNaN(priceValue) || priceValue <= 0) {
       setFormError("Please enter a valid price");
       return;
     }

     setFormLoading(true);
     setFormError("");
     
     // Calculate total records to be created
     const totalRecords = selectedParkIds.length * selectedEntryTypeIds.length * selectedAgeGroupIds.length;
     setLoadingProgress({ current: 0, total: totalRecords });

          try {
                 // First, check for existing products and pricing to avoid duplicates
         const duplicateChecks: { parkName: string; hasProduct: boolean; hasPricing: boolean; hasExactMatch: boolean }[] = [];
         
         for (const parkId of selectedParkIds) {
           const selectedPark = parks.find(p => p.id.toString() === parkId);
           const parkName = selectedPark?.national_park_name || 'Unknown Park';
           
           // Check each combination of entry type and age group for this park
           let hasAnyProduct = false;
           let hasAnyExactMatch = false;
           
           for (const entryTypeId of selectedEntryTypeIds) {
             for (const ageGroupId of selectedAgeGroupIds) {
               // Check if a park product already exists for this specific combination
               const { data: existingProduct, error: productCheckError } = await supabase
                 .from('park_product')
                 .select('id')
                 .eq('national_park_id', parkId)
                 .eq('entry_type_id', entryTypeId)
                 .eq('park_category_id', selectedCategoryId || null)
                 .eq('age_group', ageGroupId)
                 .eq('pricing_type_id', selectedPricingTypeId);

               if (productCheckError) {
                 console.error('Error checking existing product:', productCheckError);
                 setFormError('Error checking existing product');
                 return;
               }

               const hasProduct = existingProduct && existingProduct.length > 0;
               if (hasProduct) hasAnyProduct = true;
               
               let hasPricing = false;
               let hasExactMatch = false;

               if (hasProduct) {
                 // Check if pricing already exists for this product, season, and tax behavior
                 const taxBehaviorId = taxBehavior === 'exclusive' ? 2 : 1;
                 
                 const { data: existingPricing, error: pricingCheckError } = await supabase
                   .from('park_product_price')
                   .select('id')
                   .eq('park_product_id', existingProduct[0].id)
                   .eq('season_id', selectedSeasonId)
                   .eq('tax_behavior', taxBehaviorId);

                 if (pricingCheckError) {
                   console.error('Error checking existing pricing:', pricingCheckError);
                   setFormError('Error checking existing pricing');
                   return;
                 }

                 hasPricing = existingPricing && existingPricing.length > 0;
                 hasExactMatch = hasPricing; // Exact match means same park, entry type, age group, category, season, and tax behavior
                 if (hasExactMatch) hasAnyExactMatch = true;
               }
             }
           }

           duplicateChecks.push({ parkName, hasProduct: hasAnyProduct, hasPricing: false, hasExactMatch: hasAnyExactMatch });
         }

         // Check for exact duplicates (same park, entry type, age group, category, season, and tax behavior)
         const exactDuplicates = duplicateChecks.filter(check => check.hasExactMatch);
         const partialDuplicates = duplicateChecks.filter(check => check.hasProduct && !check.hasExactMatch);

         if (exactDuplicates.length > 0) {
           const duplicateNames = exactDuplicates.map(check => check.parkName).join(', ');
           setFormError(`Exact pricing already exists for: ${duplicateNames}. This combination of park, entry type, age group, category, season, and tax behavior already exists.`);
           setFormLoading(false);
           return;
         }

        // Handle multiple parks, entry types, and age groups - create products for each combination
        const productIds: number[] = [];
        let currentProgress = 0;
        
        for (const parkId of selectedParkIds) {
          const selectedPark = parks.find(p => p.id.toString() === parkId);
          
          for (const entryTypeId of selectedEntryTypeIds) {
            for (const ageGroupId of selectedAgeGroupIds) {
              // Check if a park product already exists for this specific combination
              const { data: existingProduct, error: productCheckError } = await supabase
                .from('park_product')
                .select('id')
                .eq('national_park_id', parkId)
                .eq('entry_type_id', entryTypeId)
                .eq('park_category_id', selectedCategoryId || null)
                .eq('age_group', ageGroupId)
                .eq('pricing_type_id', selectedPricingTypeId);

              if (productCheckError) {
                console.error('Error checking existing product:', productCheckError);
                setFormError('Error checking existing product');
                return;
              }

              let productId: number;

              if (existingProduct && existingProduct.length > 0) {
                // Use existing product
                productId = existingProduct[0].id;
              } else {
                // Create new park product for this specific combination
                const entryType = entryTypes.find(et => et.id.toString() === entryTypeId);
                const ageGroup = ageGroups.find(ag => ag.id.toString() === ageGroupId);
                
                const { data: newProduct, error: createProductError } = await supabase
                  .from('park_product')
                  .insert({
                    national_park_id: parseInt(parkId),
                    entry_type_id: parseInt(entryTypeId),
                    park_category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
                    age_group: parseInt(ageGroupId),
                    pricing_type_id: parseInt(selectedPricingTypeId),
                    product_name: `${selectedPark?.national_park_name} - ${entryType?.entry_name}${selectedCategoryId ? ` - ${getSelectedCategory()?.category_name}` : ''} - ${ageGroup?.age_group_name} - ${getSelectedPricingType()?.pricing_type_name}`
                  })
                  .select('id')
                  .single();

                if (createProductError) {
                  console.error('Error creating park product:', createProductError);
                  setFormError('Error creating park product');
                  return;
                }

                productId = newProduct.id;
              }
              
              productIds.push(productId);
              
              // Update progress
              currentProgress++;
              setLoadingProgress({ current: currentProgress, total: totalRecords });
            }
          }
        }

             // Handle pricing creation for multiple products
       if (editingPricing) {
         // Update existing pricing (single product for editing)
         const taxBehaviorId = taxBehavior === 'exclusive' ? 2 : 1;
         
         const { error: updateError } = await supabase
           .from('park_product_price')
           .update({
             unit_amount: priceValue,
             currency_id: parseInt(selectedCurrencyId),
             tax_behavior: taxBehaviorId
           })
           .eq('id', editingPricing.id);

         if (updateError) {
           console.error('Error updating pricing:', updateError);
           setFormError('Error updating pricing');
           return;
         }
               } else {
          // Create pricing for each product (duplicates already checked above)
          const taxBehaviorId = taxBehavior === 'exclusive' ? 2 : 1;
          
          for (const productId of productIds) {
            // Create new pricing
            const { error: createPricingError } = await supabase
              .from('park_product_price')
              .insert({
                park_product_id: productId,
                season_id: parseInt(selectedSeasonId),
                unit_amount: priceValue,
                currency_id: parseInt(selectedCurrencyId),
                tax_behavior: taxBehaviorId
              });

            if (createPricingError) {
              console.error('Error creating pricing:', createPricingError);
              setFormError('Error creating pricing');
              return;
            }
          }
        }

      // Refresh the pricing data
      await fetchParkPricing();
      
      // Close modal and show success
      const totalRecordsCreated = productIds.length;
      console.log(`Successfully created ${totalRecordsCreated} pricing records`);
      
      handleCloseModal();
      fetchParkPricing(); // Refresh the table data
      
      // Show success message
      alert(`Successfully created ${totalRecordsCreated} pricing records for ${selectedParkIds.length} park(s) × ${selectedEntryTypeIds.length} entry type(s) × ${selectedAgeGroupIds.length} age group(s)`);
    } catch (error) {
      console.error('Error saving pricing:', error);
      setFormError('An unexpected error occurred');
    } finally {
      setFormLoading(false);
    }
  };

           const renderMultiSelectDropdown = (
        label: string,
        isOpen: boolean,
        setIsOpen: (open: boolean) => void,
        selectedValues: string[],
        setSelectedValues: (values: string[]) => void,
        searchQuery: string,
        setSearchQuery: (query: string) => void,
        items: any[],
        searchField: string,
        displayField: string,
        existingProducts?: { [key: string]: boolean },
        exactDuplicates?: { [key: string]: boolean }
      ) => {
     const filteredItems = searchQuery 
       ? items.filter(item => 
           item[searchField].toLowerCase().includes(searchQuery.toLowerCase())
         )
       : items;

     const handleToggleItem = (itemId: string) => {
       if (selectedValues.includes(itemId)) {
         setSelectedValues(selectedValues.filter(id => id !== itemId));
       } else {
         setSelectedValues([...selectedValues, itemId]);
       }
     };

     const getSelectedItems = () => items.filter(item => selectedValues.includes(item.id.toString()));

     return (
       <div className="relative">
         <label className="block text-sm font-medium text-gray-700 mb-2">
           {label}
         </label>
         <div className="relative">
           <button
             type="button"
             onClick={() => setIsOpen(!isOpen)}
             className="w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm flex items-center justify-between"
           >
             <span className={selectedValues.length > 0 ? "text-gray-900" : "text-gray-500"}>
               {selectedValues.length > 0 
                 ? `${selectedValues.length} park${selectedValues.length > 1 ? 's' : ''} selected`
                 : `Select ${label}`
               }
             </span>
             <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
           </button>
           
           {isOpen && (
             <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
               <div className="p-2 border-b border-gray-200">
                 <div className="relative">
                   <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                   <input
                     type="text"
                     placeholder={`Search ${label}...`}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                   />
                 </div>
               </div>
               <div className="py-1">
                 {filteredItems.length > 0 ? (
                   filteredItems.map((item) => (
                                           <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id.toString())}
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center justify-between"
                      >
                                                 <div className="flex items-center">
                           <span className="truncate">{item[displayField]}</span>
                           {exactDuplicates?.[item.id.toString()] && (
                             <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                               Exact Duplicate
                             </span>
                           )}
                           {existingProducts?.[item.id.toString()] && !exactDuplicates?.[item.id.toString()] && (
                             <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                               Existing Product
                             </span>
                           )}
                         </div>
                        {selectedValues.includes(item.id.toString()) && (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
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

   const renderDropdown = (
     label: string,
     isOpen: boolean,
     setIsOpen: (open: boolean) => void,
     selectedValue: string,
     setSelectedValue: (value: string) => void,
     searchQuery: string,
     setSearchQuery: (query: string) => void,
     items: any[],
     getSelectedItem: () => any,
     searchField: string,
     displayField: string
   ) => {
    const filteredItems = searchQuery 
      ? items.filter(item => 
          item[searchField].toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;

         // Debug logging for parks dropdown
     if (label === "National Park" && isOpen) {
       console.log('Parks dropdown debug:', {
         totalItems: items.length,
         searchQuery,
         filteredItems: filteredItems.length,
         sampleItems: items.slice(0, 3).map(item => item[searchField])
       });
     }

     // Debug logging for age group dropdown
     if (label === "Age Group" && isOpen) {
       console.log('Age Group dropdown debug:', {
         totalItems: items.length,
         searchQuery,
         filteredItems: filteredItems.length,
         sampleItems: items.slice(0, 3).map(item => item[searchField])
       });
     }

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm flex items-center justify-between"
          >
            <span className={getSelectedItem() ? "text-gray-900" : "text-gray-500"}>
              {getSelectedItem() ? getSelectedItem()[displayField] : `Select ${label}`}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${label}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                  />
                </div>
              </div>
              <div className="py-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedValue(item.id.toString());
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="truncate">{item[displayField]}</span>
                      {selectedValue === item.id.toString() && (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading park pricing...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Park Pricing</h2>
            <p className="text-sm text-gray-500 mt-1">Manage pricing for park products and services</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Park Pricing
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

             {/* Search Bar and Filters */}
       <div className="bg-white rounded-lg border border-gray-200 p-4">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
               <input
                 type="text"
                 placeholder="Search for pricing..."
                 value={searchQuery}
                 onChange={(e) => {
                   if (onSearchChange) {
                     onSearchChange(e.target.value);
                   }
                 }}
                 className="pl-10 w-96 text-gray-900 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
               />
             </div>
             <Button 
               variant="outline" 
               size="sm" 
               className={`border-gray-300 text-gray-700 hover:bg-gray-50 ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
               onClick={() => setShowFilters(!showFilters)}
             >
               <Filter className="mr-2 h-4 w-4" />
               Filters {hasActiveFilters && <span className="ml-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{[filterPark, filterEntryType, filterCategory].filter(Boolean).length}</span>}
             </Button>
           </div>
           
           {/* Clear filters button */}
           {hasActiveFilters && (
             <Button 
               variant="outline" 
               size="sm" 
               className="border-red-300 text-red-700 hover:bg-red-50"
               onClick={clearFilters}
             >
               Clear Filters
             </Button>
           )}
         </div>

         {/* Filter Panel */}
         {showFilters && (
           <div className="border-t border-gray-200 pt-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Park Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Filter by Park
                 </label>
                 <input
                   type="text"
                   placeholder="Enter park name..."
                   value={filterPark}
                   onChange={(e) => setFilterPark(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                 />
               </div>

               {/* Entry Type Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Filter by Entry Type
                 </label>
                 <input
                   type="text"
                   placeholder="Enter entry type..."
                   value={filterEntryType}
                   onChange={(e) => setFilterEntryType(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                 />
               </div>

               {/* Category Filter */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Filter by Category
                 </label>
                 <input
                   type="text"
                   placeholder="Enter category..."
                   value={filterCategory}
                   onChange={(e) => setFilterCategory(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                 />
               </div>
             </div>

             {/* Active Filters Display */}
             {hasActiveFilters && (
               <div className="mt-4 pt-4 border-t border-gray-200">
                 <div className="flex items-center space-x-2 text-sm text-gray-600">
                   <span className="font-medium">Active Filters:</span>
                   {filterPark && (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                       Park: {filterPark}
                       <button
                         onClick={() => setFilterPark("")}
                         className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                       >
                         ×
                       </button>
                     </span>
                   )}
                   {filterEntryType && (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       Entry Type: {filterEntryType}
                       <button
                         onClick={() => setFilterEntryType("")}
                         className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                       >
                         ×
                       </button>
                       </span>
                   )}
                   {filterCategory && (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                       Category: {filterCategory}
                       <button
                         onClick={() => setFilterCategory("")}
                         className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                       >
                         ×
                       </button>
                     </span>
                   )}
                 </div>
               </div>
             )}
           </div>
                  )}
       </div>

       {/* Results Summary */}
       {hasActiveFilters && (
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
           <div className="text-sm text-blue-800">
             <strong>Filtered Results:</strong> Showing {getFilteredPricing().length} of {pricing.length} total pricing records
             {filterPark && ` • Park: "${filterPark}"`}
             {filterEntryType && ` • Entry Type: "${filterEntryType}"`}
             {filterCategory && ` • Category: "${filterCategory}"`}
           </div>
         </div>
       )}

       <DataTable
         columns={columns}
         data={getFilteredPricing()}
         searchQuery={searchQuery}
         searchFields={['park_name', 'entry_type']}
       />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPricing ? "Edit Park Pricing" : "Add New Park Pricing"}
        disableClose={formLoading}
        isLoading={formLoading}
        loadingProgress={formLoading ? loadingProgress : undefined}
      >
        <div className="space-y-6">
          {/* Summary of combinations to be created */}
          {selectedParkIds.length > 0 && selectedEntryTypeIds.length > 0 && selectedAgeGroupIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Summary:</strong> This will create pricing for{' '}
                <strong>{selectedParkIds.length}</strong> park(s) ×{' '}
                <strong>{selectedEntryTypeIds.length}</strong> entry type(s) ×{' '}
                <strong>{selectedAgeGroupIds.length}</strong> age group(s) ={' '}
                <strong>{selectedParkIds.length * selectedEntryTypeIds.length * selectedAgeGroupIds.length}</strong> total pricing records
              </div>
            </div>
          )}
          
          {/* Form Fields */}
          <div className="space-y-4">
                         {/* National Parks Multi-Select Dropdown */}
             {renderMultiSelectDropdown(
               "National Parks",
               parkDropdownOpen,
               setParkDropdownOpen,
               selectedParkIds,
               setSelectedParkIds,
               parkSearchQuery,
               setParkSearchQuery,
               parks,
               "national_park_name",
               "national_park_name",
               existingProducts,
               exactDuplicates
             )}

            {/* Category Dropdown */}
            {renderDropdown(
              "Category",
              categoryDropdownOpen,
              setCategoryDropdownOpen,
              selectedCategoryId,
              setSelectedCategoryId,
              categorySearchQuery,
              setCategorySearchQuery,
              categories,
              getSelectedCategory,
              "category_name",
              "category_name"
            )}

            {/* Entry Type Dropdown */}
            {renderMultiSelectDropdown(
              "Entry Types",
              entryTypeDropdownOpen,
              setEntryTypeDropdownOpen,
              selectedEntryTypeIds,
              setSelectedEntryTypeIds,
              entryTypeSearchQuery,
              setEntryTypeSearchQuery,
              entryTypes,
              "entry_name",
              "entry_name"
            )}

            {/* Season Dropdown */}
            {renderDropdown(
              "Season",
              seasonDropdownOpen,
              setSeasonDropdownOpen,
              selectedSeasonId,
              setSelectedSeasonId,
              seasonSearchQuery,
              setSeasonSearchQuery,
              seasons,
              getSelectedSeason,
              "season_name",
              "season_name"
            )}

            {/* Age Group Dropdown */}
            {renderMultiSelectDropdown(
              "Age Groups",
              ageGroupDropdownOpen,
              setAgeGroupDropdownOpen,
              selectedAgeGroupIds,
              setSelectedAgeGroupIds,
              ageGroupSearchQuery,
              setAgeGroupSearchQuery,
              ageGroups,
              "age_group_name",
              "age_group_name"
            )}

             {/* Pricing Type Dropdown */}
             {renderDropdown(
               "Pricing Type",
               pricingTypeDropdownOpen,
               setPricingTypeDropdownOpen,
               selectedPricingTypeId,
               setSelectedPricingTypeId,
               pricingTypeSearchQuery,
               setPricingTypeSearchQuery,
               pricingTypes,
               getSelectedPricingType,
               "pricing_type_name",
               "pricing_type_name"
             )}

             {/* Price and Currency Input Group */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Price
               </label>
               <div className="flex">
                 <div className="flex-1">
                   <input
                     type="number"
                     step="0.01"
                     min="0"
                     value={price}
                     onChange={(e) => setPrice(e.target.value)}
                     placeholder="Enter price"
                     className="block w-full px-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                   />
                 </div>
                 <div className="w-32">
                   <button
                     type="button"
                     onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                     className="w-full px-3 py-2 border border-l-0 border-gray-300 rounded-r-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm flex items-center justify-between"
                   >
                     <span className={getSelectedCurrency() ? "text-gray-900" : "text-gray-500"}>
                       {getSelectedCurrency()?.currency_name || "USD"}
                     </span>
                     <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>
                   
                                       {currencyDropdownOpen && (
                      <div className="absolute z-50 w-32 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        <div className="py-1">
                          {currencies.length > 0 ? (
                            currencies.map((currency) => (
                              <button
                                key={currency.id}
                                onClick={() => {
                                  setSelectedCurrencyId(currency.id.toString());
                                  setCurrencyDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center justify-between"
                              >
                                <span className="truncate">{currency.currency_name}</span>
                                {selectedCurrencyId === currency.id.toString() && (
                                  <Check className="h-4 w-4 text-[var(--theme-green)] flex-shrink-0 ml-2" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No currencies available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                 </div>
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
                     value="exclusive"
                     checked={taxBehavior === "exclusive"}
                     onChange={(e) => setTaxBehavior(e.target.value)}
                     className="h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300"
                   />
                   <span className="ml-3 text-sm font-medium text-gray-900">Tax Exclusive</span>
                 </label>
                 
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
              onClick={handleSubmit}
              disabled={formLoading}
              className="px-4 py-2 bg-[var(--theme-green)] text-white rounded-md text-sm font-medium hover:bg-[var(--theme-green-dark)] disabled:opacity-50"
            >
              {formLoading ? (editingPricing ? "Updating..." : "Adding...") : (editingPricing ? "Update" : "Add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 