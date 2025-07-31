"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal, Plus, Search, X, Check } from "lucide-react";

interface CampingPriceTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface CampingPrice {
  id: number;
  camping_type: string;
  price: number;
  season_name: string;
  currency_name: string;
  park_name: string;
  entry_type: string;
  age_group: string;
  category_name: string;
}

export function CampingPriceTable({ searchQuery, onSearchChange }: CampingPriceTableProps) {
  const [pricing, setPricing] = useState<CampingPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Form states
  const [selectedParkIds, setSelectedParkIds] = useState<string[]>([]);
  const [selectedCampingTypeId, setSelectedCampingTypeId] = useState<string>("");
  const [selectedEntryTypeId, setSelectedEntryTypeId] = useState<string>("");
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>("");
  const [selectedPricingTypeId, setSelectedPricingTypeId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [taxBehavior, setTaxBehavior] = useState<string>("inclusive");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Dropdown visibility states
  const [showParkDropdown, setShowParkDropdown] = useState(false);
  const [showCampingTypeDropdown, setShowCampingTypeDropdown] = useState(false);
  const [showEntryTypeDropdown, setShowEntryTypeDropdown] = useState(false);
  const [showAgeGroupDropdown, setShowAgeGroupDropdown] = useState(false);
  const [showPricingTypeDropdown, setShowPricingTypeDropdown] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Search queries
  const [parkSearchQuery, setParkSearchQuery] = useState("");
  const [campingTypeSearchQuery, setCampingTypeSearchQuery] = useState("");
  const [entryTypeSearchQuery, setEntryTypeSearchQuery] = useState("");
  const [ageGroupSearchQuery, setAgeGroupSearchQuery] = useState("");
  const [pricingTypeSearchQuery, setPricingTypeSearchQuery] = useState("");
  const [seasonSearchQuery, setSeasonSearchQuery] = useState("");
  const [currencySearchQuery, setCurrencySearchQuery] = useState("");

  // Data for dropdowns
  const [parks, setParks] = useState<any[]>([]);
  const [campingTypes, setCampingTypes] = useState<any[]>([]);
  const [entryTypes, setEntryTypes] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<any[]>([]);
  const [pricingTypes, setPricingTypes] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  const supabase = createClient();

  // Simple useEffect to fetch data on mount
  useEffect(() => {
    fetchCampingPricing();
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      console.log('Fetching dropdown data...');
      
      // Fetch parks
      const { data: parksData, error: parksError } = await supabase
        .from('national_parks')
        .select('id, national_park_name')
        .is('is_deleted', null)
        .order('national_park_name');

      if (parksError) console.error('Error fetching parks:', parksError);

      // Fetch camping types
      const { data: campingTypesData, error: campingTypesError } = await supabase
        .from('camping_type')
        .select('id, name')
        .order('name');

      if (campingTypesError) console.error('Error fetching camping types:', campingTypesError);

      // Fetch entry types
      const { data: entryTypesData, error: entryTypesError } = await supabase
        .from('entry_type')
        .select('id, entry_name')
        .is('is_deleted', null)
        .order('entry_name');

      if (entryTypesError) console.error('Error fetching entry types:', entryTypesError);

      // Fetch age groups
      const { data: ageGroupsData, error: ageGroupsError } = await supabase
        .from('age_group')
        .select('id, age_group_name')
        .order('min_age');

      if (ageGroupsError) console.error('Error fetching age groups:', ageGroupsError);

      // Fetch pricing types
      const { data: pricingTypesData, error: pricingTypesError } = await supabase
        .from('pricing_type')
        .select('id, pricing_type_name')
        .order('pricing_type_name');

      if (pricingTypesError) console.error('Error fetching pricing types:', pricingTypesError);

      // Fetch seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, season_name')
        .is('is_deleted', null)
        .order('season_name');

      if (seasonsError) console.error('Error fetching seasons:', seasonsError);

      // Fetch currencies
      const { data: currenciesData, error: currenciesError } = await supabase
        .from('currency')
        .select('id, currency_name')
        .order('currency_name');

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
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchCampingPricing = async () => {
    try {
      console.log('Fetching camping pricing...');
      
      // First, let's check if the table exists by trying a simple query
      const { data: tableCheck, error: tableError } = await supabase
        .from('camping_products_price')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('Table check error:', tableError);
        console.error('This suggests the camping_products_price table might not exist in your database.');
        console.error('Please run: npx supabase db reset');
        setPricing([]);
        setLoading(false);
        return;
      }

      console.log('Table exists, proceeding with full query...');

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
          season:seasons(id, season_name),
          currency:currency(id, currency_name)
        `)
        .is('is_deleted', null);

      if (error) {
        console.error('Error fetching camping pricing:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return;
      }

      console.log('Raw data received:', data);

      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        camping_type: item.camping_product?.camping_type?.name || 'Unknown Type',
        price: item.unit_amount,
        season_name: item.season?.season_name || 'Unknown Season',
        currency_name: item.currency?.currency_name || 'USD',
        park_name: item.camping_product?.national_park?.national_park_name || 'Unknown Park',
        entry_type: item.camping_product?.entry_type?.entry_name || 'Unknown Entry Type',
        age_group: item.camping_product?.age_group?.age_group_name || 'Unknown Age Group',
        category_name: item.camping_product?.pricing_type?.pricing_type_name || 'Unknown Category',
      }));

      console.log('Transformed data:', transformedData);
      setPricing(transformedData);
    } catch (error) {
      console.error('Error fetching camping pricing:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedParkIds([]);
    setSelectedCampingTypeId("");
    setSelectedEntryTypeId("");
    setSelectedAgeGroupId("");
    setSelectedPricingTypeId("");
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setPrice("");
    setTaxBehavior("inclusive");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParkIds([]);
    setSelectedCampingTypeId("");
    setSelectedEntryTypeId("");
    setSelectedAgeGroupId("");
    setSelectedPricingTypeId("");
    setSelectedSeasonId("");
    setSelectedCurrencyId("");
    setPrice("");
    setTaxBehavior("inclusive");
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (selectedParkIds.length === 0) {
      setFormError("Please select at least one park");
      setFormLoading(false);
      return;
    }

    if (!selectedCampingTypeId || !selectedEntryTypeId || !selectedAgeGroupId || 
        !selectedPricingTypeId || !selectedSeasonId || !selectedCurrencyId || !price) {
      setFormError("Please fill in all required fields");
      setFormLoading(false);
      return;
    }

    try {
      const productIds: number[] = [];

      // Create or find camping products for each selected park
      for (const parkId of selectedParkIds) {
        let productId: number;

        // Check if camping product already exists
        const { data: existingProduct, error: productError } = await supabase
          .from('camping_products')
          .select('id')
          .eq('national_park_id', parkId)
          .eq('camping_type_id', selectedCampingTypeId)
          .eq('entry_type_id', selectedEntryTypeId)
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
              camping_type_id: selectedCampingTypeId,
              entry_type_id: selectedEntryTypeId,
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
          <div
            className="w-full p-3 border border-gray-300 rounded-md bg-white cursor-pointer text-left"
            onClick={onToggleDropdown}
          >
            <div className="flex flex-wrap gap-1">
              {selectedIds.length === 0 ? (
                <span className="text-gray-500">Select {label.toLowerCase()}</span>
              ) : (
                selectedIds.map(id => {
                  const item = items.find(i => i[itemIdKey].toString() === id);
                  if (!item) return null;
                  
                  return (
                    <div key={id} className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item[itemNameKey]}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-48 overflow-auto">
                {filteredItems.map(item => {
                  const isSelected = selectedIds.includes(item[itemIdKey].toString());
                  
                  return (
                    <div
                      key={item[itemIdKey]}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        if (isSelected) {
                          onSelectionChange(selectedIds.filter(id => id !== item[itemIdKey].toString()));
                        } else {
                          onSelectionChange([...selectedIds, item[itemIdKey].toString()]);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900">{item[itemNameKey]}</span>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })}
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
          <div
            className="w-full p-3 border border-gray-300 rounded-md bg-white cursor-pointer text-left"
            onClick={onToggleDropdown}
          >
            {selectedItem ? (
              <span className="text-gray-900">{selectedItem[itemNameKey]}</span>
            ) : (
              <span className="text-gray-500">Select {label.toLowerCase()}</span>
            )}
          </div>
          
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-48 overflow-auto">
                {filteredItems.map(item => (
                  <div
                    key={item[itemIdKey]}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      onSelectionChange(item[itemIdKey].toString());
                      onToggleDropdown();
                    }}
                  >
                    <span className="text-gray-900">{item[itemNameKey]}</span>
                    {selectedId === item[itemIdKey].toString() && (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const columns = [
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

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search camping pricing..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64 text-gray-900"
            />
          </div>
        </div>
        <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]">
          <Plus className="h-4 w-4 mr-2" />
          Add New Camping Pricing
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={pricing}
        searchQuery={searchQuery}
        title="Camping Pricing"
        description="Manage pricing for camping products and services"
        searchFields={['camping_type', 'park_name', 'entry_type', 'age_group', 'category_name']}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Camping Pricing"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Camping Type */}
          {renderDropdown(
            "Camping Type",
            campingTypes,
            selectedCampingTypeId,
            setSelectedCampingTypeId,
            campingTypeSearchQuery,
            setCampingTypeSearchQuery,
            showCampingTypeDropdown,
            () => setShowCampingTypeDropdown(!showCampingTypeDropdown),
            'name'
          )}

          {/* Entry Type */}
          {renderDropdown(
            "Entry Type",
            entryTypes,
            selectedEntryTypeId,
            setSelectedEntryTypeId,
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="text-gray-900"
                required
              />
            </div>
            <div>
              {renderDropdown(
                "Currency",
                currencies,
                selectedCurrencyId,
                setSelectedCurrencyId,
                currencySearchQuery,
                setCurrencySearchQuery,
                showCurrencyDropdown,
                () => setShowCurrencyDropdown(!showCurrencyDropdown),
                'currency_name'
              )}
            </div>
          </div>

          {/* Tax Behavior */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Behavior
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="inclusive"
                  checked={taxBehavior === "inclusive"}
                  onChange={(e) => setTaxBehavior(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Inclusive</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="exclusive"
                  checked={taxBehavior === "exclusive"}
                  onChange={(e) => setTaxBehavior(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Exclusive</span>
              </label>
            </div>
          </div>

          {formError && (
            <div className="text-red-600 text-sm">{formError}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formLoading}
              className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]"
            >
              {formLoading ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 