"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal, ChevronDown, Check, Search } from "lucide-react";

interface ParkPricingTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface ParkPricing {
  id: number;
  park_name: string;
  entry_type: string;
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

interface Season {
  id: number;
  season_name: string;
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

export function ParkPricingTable({ searchQuery, onSearchChange }: ParkPricingTableProps) {
  const [pricing, setPricing] = useState<ParkPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<ParkPricing | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Form states
  const [selectedParkIds, setSelectedParkIds] = useState<string[]>([]); // Changed to array for multiple parks
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedEntryTypeId, setSelectedEntryTypeId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("");
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>("4"); // Default to Adult (18-64)
  const [selectedPricingTypeId, setSelectedPricingTypeId] = useState<string>("1"); // Default to "Per Person"
  const [price, setPrice] = useState<string>("");
  const [taxBehavior, setTaxBehavior] = useState<string>("exclusive");

  // Dropdown data
  const [parks, setParks] = useState<NationalPark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
     const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
   const [pricingTypes, setPricingTypes] = useState<PricingType[]>([]);
   const [existingProducts, setExistingProducts] = useState<{ [key: string]: boolean }>({});
   const [exactDuplicates, setExactDuplicates] = useState<{ [key: string]: boolean }>({});

  // Dropdown states
  const [parkDropdownOpen, setParkDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [entryTypeDropdownOpen, setEntryTypeDropdownOpen] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [ageGroupDropdownOpen, setAgeGroupDropdownOpen] = useState(false);
  const [pricingTypeDropdownOpen, setPricingTypeDropdownOpen] = useState(false);

  // Search states
  const [parkSearchQuery, setParkSearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [entryTypeSearchQuery, setEntryTypeSearchQuery] = useState("");
  const [seasonSearchQuery, setSeasonSearchQuery] = useState("");
  const [currencySearchQuery, setCurrencySearchQuery] = useState("");
  const [ageGroupSearchQuery, setAgeGroupSearchQuery] = useState("");
  const [pricingTypeSearchQuery, setPricingTypeSearchQuery] = useState("");

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
         if (selectedEntryTypeId && selectedAgeGroupId && selectedPricingTypeId && parks.length > 0) {
           const existing = await getExistingProducts();
           setExistingProducts(existing);
         }
       };

       const updateExactDuplicates = async () => {
         if (selectedEntryTypeId && selectedAgeGroupId && selectedPricingTypeId && selectedSeasonId && taxBehavior && parks.length > 0) {
           const exact = await getExactDuplicates();
           setExactDuplicates(exact);
         }
       };

       updateExistingProducts();
       updateExactDuplicates();
     }, [selectedEntryTypeId, selectedCategoryId, selectedAgeGroupId, selectedPricingTypeId, selectedSeasonId, taxBehavior, parks]);

     // Debug: Log when age group selection changes
     useEffect(() => {
       console.log('Age group selection changed to:', selectedAgeGroupId);
     }, [selectedAgeGroupId]);

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
      const { data, error } = await supabase
        .from('park_product_price')
        .select(`
          id,
          unit_amount,
          park_product:park_product(
            product_name,
            national_park:national_parks(national_park_name),
            entry_type:entry_type(entry_name),
            park_category:park_category(category_name)
          ),
          season:seasons(season_name),
          currency:currency(currency_name)
        `);

      if (error) {
        console.error('Error fetching park pricing:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        park_name: item.park_product?.national_park?.national_park_name || 'Unknown Park',
        entry_type: item.park_product?.entry_type?.entry_name || 'Unknown Type',
        category_name: item.park_product?.park_category?.category_name || 'No Category',
        price: item.unit_amount,
        season_name: item.season?.season_name || 'Unknown Season',
        currency_name: item.currency?.currency_name || 'USD',
      }));

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
        .select('id, season_name')
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
      if (!selectedEntryTypeId || !selectedAgeGroupId || !selectedPricingTypeId) {
        return {};
      }

      const existingProducts: { [key: string]: boolean } = {};
      
      for (const park of parks) {
        const { data: existingProduct } = await supabase
          .from('park_product')
          .select('id')
          .eq('national_park_id', park.id)
          .eq('entry_type_id', selectedEntryTypeId)
          .eq('park_category_id', selectedCategoryId || null)
          .eq('age_group', selectedAgeGroupId)
          .eq('pricing_type_id', selectedPricingTypeId);

        existingProducts[park.id.toString()] = existingProduct && existingProduct.length > 0;
      }

      return existingProducts;
    };

    // Function to check for exact duplicates (including tax behavior)
    const getExactDuplicates = async () => {
      if (!selectedEntryTypeId || !selectedAgeGroupId || !selectedPricingTypeId || !selectedSeasonId || !taxBehavior) {
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
          .eq('entry_type_id', selectedEntryTypeId)
          .eq('park_category_id', selectedCategoryId || null)
          .eq('age_group', selectedAgeGroupId)
          .eq('pricing_type_id', selectedPricingTypeId);

        if (existingProduct && existingProduct.length > 0) {
          // Then check if pricing exists with same season and tax behavior
          const { data: existingPricing } = await supabase
            .from('park_product_price')
            .select('id')
            .eq('park_product_id', existingProduct[0].id)
            .eq('season_id', selectedSeasonId)
            .eq('tax_behavior', taxBehaviorId);

          exactDuplicates[park.id.toString()] = existingPricing && existingPricing.length > 0;
        } else {
          exactDuplicates[park.id.toString()] = false;
        }
      }

      return exactDuplicates;
    };
  const getSelectedEntryType = () => entryTypes.find(type => type.id.toString() === selectedEntryTypeId);
  const getSelectedSeason = () => seasons.find(season => season.id.toString() === selectedSeasonId);
  const getSelectedCurrency = () => currencies.find(currency => currency.id.toString() === selectedCurrencyId);
  const getSelectedAgeGroup = () => ageGroups.find(ageGroup => ageGroup.id.toString() === selectedAgeGroupId);
  const getSelectedPricingType = () => pricingTypes.find(pricingType => pricingType.id.toString() === selectedPricingTypeId);

  const columns = [
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
        <div className="relative flex justify-center" ref={(el) => menuRefs.current[row.id] = el}>
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
    setSelectedEntryTypeId("");
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setSelectedAgeGroupId("4"); // Default to Adult
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
            setSelectedParkIds([pricingData.park_product.national_park_id.toString()]); // Single park for editing
            setSelectedEntryTypeId(pricingData.park_product.entry_type_id.toString());
            setSelectedCategoryId(pricingData.park_product.park_category_id?.toString() || '');
            
            // Debug: Log age group and pricing type data
            console.log('Age group from DB:', pricingData.park_product.age_group);
            console.log('Pricing type from DB:', pricingData.park_product.pricing_type_id);
            
            setSelectedAgeGroupId(pricingData.park_product.age_group?.toString() || '4');
            setSelectedPricingTypeId(pricingData.park_product.pricing_type_id?.toString() || '1');
            
            // Debug: Log the set values
            console.log('Set age group ID to:', pricingData.park_product.age_group?.toString() || '4');
            console.log('Set pricing type ID to:', pricingData.park_product.pricing_type_id?.toString() || '1');
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
    setIsModalOpen(false);
    setEditingPricing(null);
    setSelectedParkIds([]);
    setSelectedCategoryId("");
    setSelectedEntryTypeId("");
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setSelectedAgeGroupId("4");
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
  };

         const handleSubmit = async () => {
          if (selectedParkIds.length === 0 || !selectedEntryTypeId || !selectedSeasonId || !selectedCurrencyId || !selectedAgeGroupId || !selectedPricingTypeId || !price) {
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

          try {
                 // First, check for existing products and pricing to avoid duplicates
         const duplicateChecks: { parkName: string; hasProduct: boolean; hasPricing: boolean; hasExactMatch: boolean }[] = [];
         
         for (const parkId of selectedParkIds) {
           const selectedPark = parks.find(p => p.id.toString() === parkId);
           const parkName = selectedPark?.national_park_name || 'Unknown Park';
           
           // Check if a park product already exists for this combination
           const { data: existingProduct, error: productCheckError } = await supabase
             .from('park_product')
             .select('id')
             .eq('national_park_id', parkId)
             .eq('entry_type_id', selectedEntryTypeId)
             .eq('park_category_id', selectedCategoryId || null)
             .eq('age_group', selectedAgeGroupId)
             .eq('pricing_type_id', selectedPricingTypeId);

           if (productCheckError) {
             console.error('Error checking existing product:', productCheckError);
             setFormError('Error checking existing product');
             return;
           }

           const hasProduct = existingProduct && existingProduct.length > 0;
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
           }

           duplicateChecks.push({ parkName, hasProduct, hasPricing, hasExactMatch });
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

        // Handle multiple parks - create products for each selected park
        const productIds: number[] = [];
        
        for (const parkId of selectedParkIds) {
          const selectedPark = parks.find(p => p.id.toString() === parkId);
          
          // Check if a park product already exists for this combination
          const { data: existingProduct, error: productCheckError } = await supabase
            .from('park_product')
            .select('id')
            .eq('national_park_id', parkId)
            .eq('entry_type_id', selectedEntryTypeId)
            .eq('park_category_id', selectedCategoryId || null)
            .eq('age_group', selectedAgeGroupId)
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
            // Create new park product
            const { data: newProduct, error: createProductError } = await supabase
              .from('park_product')
              .insert({
                national_park_id: parseInt(parkId),
                entry_type_id: parseInt(selectedEntryTypeId),
                park_category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
                age_group: parseInt(selectedAgeGroupId),
                pricing_type_id: parseInt(selectedPricingTypeId),
                product_name: `${selectedPark?.national_park_name} - ${getSelectedEntryType()?.entry_name}${selectedCategoryId ? ` - ${getSelectedCategory()?.category_name}` : ''} - ${getSelectedAgeGroup()?.age_group_name} - ${getSelectedPricingType()?.pricing_type_name}`
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
      handleCloseModal();
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
        existingProducts?: { [key: string]: boolean } = {},
        exactDuplicates?: { [key: string]: boolean } = {}
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
                           {exactDuplicates[item.id.toString()] && (
                             <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                               Exact Duplicate
                             </span>
                           )}
                           {existingProducts[item.id.toString()] && !exactDuplicates[item.id.toString()] && (
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
      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for pricing..."
                value={searchQuery}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  }
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-3">
            {/* Filters Button */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Filters
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pricing}
        searchQuery={searchQuery}
        title="Park Pricing"
        description="Manage pricing for park products and services"
        onAddNew={handleAddNew}
        searchFields={['park_name', 'entry_type']}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPricing ? "Edit Park Pricing" : "Add New Park Pricing"}
      >
        <div className="space-y-6">
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
            {renderDropdown(
              "Entry Type",
              entryTypeDropdownOpen,
              setEntryTypeDropdownOpen,
              selectedEntryTypeId,
              setSelectedEntryTypeId,
              entryTypeSearchQuery,
              setEntryTypeSearchQuery,
              entryTypes,
              getSelectedEntryType,
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
             {renderDropdown(
               "Age Group",
               ageGroupDropdownOpen,
               setAgeGroupDropdownOpen,
               selectedAgeGroupId,
               setSelectedAgeGroupId,
               ageGroupSearchQuery,
               setAgeGroupSearchQuery,
               ageGroups,
               getSelectedAgeGroup,
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
                       {getSelectedCurrency() ? getSelectedCurrency().currency_name : "USD"}
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
                                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
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
                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
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
                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
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
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {formLoading ? (editingPricing ? "Updating..." : "Adding...") : (editingPricing ? "Update" : "Add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 