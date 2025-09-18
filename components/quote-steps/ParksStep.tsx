"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Users, Calendar, DollarSign, Calculator, Edit } from "lucide-react";
import { QuoteData, ParkSelection } from "@/app/quote-create/page";

interface ParksStepProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

interface Park {
  id: number;
  national_park_name: string;
  country_id: number;
  park_circuit_id: number;
}

interface ParkCategory {
  id: number;
  category_name: string;
}

interface EntryType {
  id: number;
  entry_name: string;
}

interface ParkProduct {
  id: number;
  product_name: string;
  category_name: string;
  entry_name: string;
  usd_price: number;
  tzs_price: number;
  currency_id: number;
  currency_code: string;
  park_name: string;
  park_circuit_name: string;
  tax_behavior: number;
  usd_tax_behavior: number | null;
  tzs_tax_behavior: number | null;
  usd_currency_id: number | null;
  tzs_currency_id: number | null;
}

export function ParksStep({ quoteData, updateQuoteData, errors, setErrors }: ParksStepProps) {
  const [parks, setParks] = useState<Park[]>([]);
  const [categories, setCategories] = useState<ParkCategory[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [usdProducts, setUsdProducts] = useState<ParkProduct[]>([]);
  const [tzsProducts, setTzsProducts] = useState<ParkProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedPark, setSelectedPark] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEntryType, setSelectedEntryType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(quoteData.adults + quoteData.children);
  const [duration, setDuration] = useState(1);
  
  // Edit state
  const [editingParkId, setEditingParkId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Currency selection state
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'TZS'>('USD');
  const [usdToTzsRate, setUsdToTzsRate] = useState<number>(2500); // Default conversion rate

  // Calculate trip duration from start and end dates
  const calculateTripDuration = () => {
    if (!quoteData.startDate || !quoteData.endDate) return 0;
    const start = new Date(quoteData.startDate);
    const end = new Date(quoteData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const tripDuration = calculateTripDuration();

  // Get product price for display
  const getProductPrice = (productId: string, currency: 'USD' | 'TZS') => {
    const product = [...usdProducts, ...tzsProducts].find(p => p.id.toString() === productId);
    if (!product) return '';
    
    if (currency === 'USD') {
      return product.usd_price > 0 ? product.usd_price.toString() : '';
    } else {
      return product.tzs_price > 0 ? product.tzs_price.toString() : '';
    }
  };

  // Get the selected product for price display
  const selectedProductData = selectedProduct ? [...usdProducts, ...tzsProducts].find(p => p.id.toString() === selectedProduct) : null;

  // Currency conversion functions
  const convertUsdToTzs = (usdAmount: number): number => {
    return usdAmount * usdToTzsRate;
  };

  const convertTzsToUsd = (tzsAmount: number): number => {
    return tzsAmount / usdToTzsRate;
  };

  // Get display price based on selected currency
  const getDisplayPrice = (product: ParkProduct | null): { usd: number; tzs: number } => {
    if (!product) return { usd: 0, tzs: 0 };

    let usdPrice = product.usd_price || 0;
    let tzsPrice = product.tzs_price || 0;

    // If we have USD price but no TZS price, convert USD to TZS
    if (usdPrice > 0 && tzsPrice === 0) {
      tzsPrice = convertUsdToTzs(usdPrice);
    }
    // If we have TZS price but no USD price, convert TZS to USD
    else if (tzsPrice > 0 && usdPrice === 0) {
      usdPrice = convertTzsToUsd(tzsPrice);
    }

    return { usd: usdPrice, tzs: tzsPrice };
  };

  // Edit park selection
  const editParkSelection = (parkId: string) => {
    const park = quoteData.selectedParks.find(p => p.id === parkId);
    if (!park) return;

    // Find the park in the parks list
    const parkData = parks.find(p => p.national_park_name === park.parkName);
    if (parkData) {
      setSelectedPark(parkData.id.toString());
    }

    // Set form values
    setSelectedCategory(park.category);
    setSelectedEntryType(park.entryType);
    setSelectedProduct(park.parkId.toString());
    setNumberOfPeople(park.pax);
    setDuration(park.duration);
    
    // Set edit mode
    setEditingParkId(parkId);
    setIsEditing(true);
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingParkId(null);
    setIsEditing(false);
    setSelectedPark('');
    setSelectedCategory('');
    setSelectedEntryType('');
    setSelectedProduct('');
    setNumberOfPeople(quoteData.adults + quoteData.children);
    setDuration(1);
  };

  // Handle duration change with validation
  const handleDurationChange = (value: number) => {
    if (isNaN(value) || value < 1) {
      setDuration(1);
      return;
    }
    
    const maxDuration = tripDuration > 0 ? tripDuration : 999; // Allow any duration if no trip dates set
    const validatedDuration = Math.min(value, maxDuration);
    setDuration(validatedDuration);
  };

  const supabase = createClient();

  // Get or create a temporary offer for this quote session
  const getOrCreateTempOffer = async (): Promise<number | null> => {
    try {
      // Check if we have a temp offer in localStorage
      let tempOfferId = localStorage.getItem('temp_offer_id');
      
      if (tempOfferId) {
        // Verify the offer still exists
        const { data, error } = await supabase
          .from('offer')
          .select('id')
          .eq('id', tempOfferId)
          .maybeSingle(); // Use maybeSingle() instead of single()
        
        if (!error && data) {
          return parseInt(tempOfferId);
        } else if (error) {
          console.warn('Error checking offer existence:', error);
        }
      }

      // For now, use a simple approach - just use a fixed offer ID
      // This avoids the complexity of creating offers and RLS issues
      const fixedOfferId = 8; // Use the test offer we just created
      
      console.log('Using fixed offer ID:', fixedOfferId);
      
      // Store the offer ID in localStorage
      localStorage.setItem('temp_offer_id', fixedOfferId.toString());
      return fixedOfferId;
      
      /* Commented out the complex offer creation for now
      // Get current user to set owner_id
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create a new temporary offer
      const offerData = {
        offer_code: `TEMP_${Date.now()}`,
        offer_name: 'Temporary Quote Session',
        active_from: new Date().toISOString().split('T')[0],
        active_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        client_id: 8, // Use existing client ID
        ...(user && { owner_id: user.id }), // Set owner_id if user is authenticated
      };

      console.log('Creating temp offer with data:', offerData);

      const { data, error } = await supabase
        .from('offer')
        .insert(offerData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating temp offer:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Offer data:', offerData);
        return null;
      }

      console.log('Successfully created temp offer with ID:', data.id);

      // Store the offer ID in localStorage
      localStorage.setItem('temp_offer_id', data.id.toString());
      return data.id;
      */
    } catch (error) {
      console.error('Error getting/creating temp offer:', error);
      return null;
    }
  };

  // Load selected parks from database
  const loadSelectedParks = async () => {
    try {
      // First, try to load from localStorage (primary)
      const savedParks = localStorage.getItem('selected_parks');
      if (savedParks) {
        try {
          const parks = JSON.parse(savedParks);
          updateQuoteData({ selectedParks: parks });
          console.log('Loaded parks from localStorage (primary)');
        } catch (e) {
          console.error('Error parsing saved parks from localStorage:', e);
        }
      }

      // Then try to load from database (secondary)
      try {
        const offerId = await getOrCreateTempOffer();
        if (!offerId) {
          console.log('No offer ID available, using localStorage only');
          return;
        }

      const { data, error } = await supabase
        .from('offer_park_services')
        .select(`
          id,
          price,
          final_service_price,
          description,
          park_product_price_id,
          park_product_price!inner(
            park_product_id,
            unit_amount,
            currency_id,
            currency!inner(currency_name),
            park_product!inner(
              product_name,
              national_park_id,
              park_category_id,
              entry_type_id,
              national_parks!inner(national_park_name),
              park_category!inner(category_name),
              entry_type!inner(entry_name)
            )
          )
        `)
        .eq('offer_id', offerId);

      if (error) {
        console.error('Error loading selected parks from database:', error);
        console.log('Continuing with localStorage data only');
        return;
      }

      if (data && data.length > 0) {
        const parksData = data.map((service: any) => {
          // Parse duration and pax from description
          let duration = 1;
          let pax = 1;
          
          if (service.description) {
            const descMatch = service.description.match(/Duration: (\d+), PAX: (\d+)/);
            if (descMatch) {
              duration = parseInt(descMatch[1]);
              pax = parseInt(descMatch[2]);
            }
          }

          return {
            id: service.id.toString(),
            parkId: service.park_product_price.park_product_id,
            parkName: service.park_product_price.park_product.national_parks.national_park_name,
            productName: service.park_product_price.park_product.product_name,
            category: service.park_product_price.park_product.park_category.category_name,
            entryType: service.park_product_price.park_product.entry_type.entry_name,
            duration: duration,
            pax: pax,
            price: parseFloat(service.final_service_price),
            currency: service.park_product_price.currency.currency_name.toUpperCase() as 'USD' | 'TZS',
          };
        });

        updateQuoteData({
          selectedParks: parksData
        });
        console.log('Loaded parks from database (secondary)');
      }
      } catch (dbError) {
        console.error('Database loading failed:', dbError);
        console.log('Using localStorage data only');
      }
    } catch (error) {
      console.error('Error loading selected parks:', error);
    }
  };

  // Save selected parks to database
  const saveSelectedParks = async (parks: ParkSelection[]) => {
    try {
      // Always save to localStorage first (primary persistence)
      localStorage.setItem('selected_parks', JSON.stringify(parks));
      console.log('Saved parks to localStorage (primary)');

      // Try database persistence as secondary (optional)
      try {
        const offerId = await getOrCreateTempOffer();
        if (!offerId) {
          console.log('No offer ID available, using localStorage only');
          return;
        }

      // Try database operations with better error handling
      try {
        console.log('Attempting to save parks to database for offer:', offerId);
        
        // First, delete existing park services for this offer
        const { error: deleteError } = await supabase
          .from('offer_park_services')
          .delete()
          .eq('offer_id', offerId);

        if (deleteError) {
          console.error('Error deleting existing park services:', deleteError);
        }

        // Then insert new park services
        if (parks.length > 0) {
          console.log('Inserting', parks.length, 'parks to database');
          
          // Get park product price IDs for each park
          const parkServicesToInsert = [];
          
          for (const park of parks) {
            try {
              console.log('Processing park for database save:', {
                parkId: park.parkId,
                currency: park.currency,
                price: park.price,
                duration: park.duration,
                pax: park.pax
              });
              
              // Find the park product price ID for this park
              const currencyId = park.currency === 'USD' ? 1 : 2;
              const { data: priceData, error: priceError } = await supabase
                .from('park_product_price')
                .select('id')
                .eq('park_product_id', park.parkId)
                .eq('currency_id', currencyId)
                .maybeSingle(); // Use maybeSingle() to handle no rows

              console.log('Price data query result:', { priceData, priceError, currencyId, parkId: park.parkId });

              if (priceError || !priceData) {
                console.warn('Error finding park product price for park:', park.parkId, 'currency:', park.currency, 'error:', priceError);
                // Try to find any price for this park product
                const { data: anyPriceData, error: anyPriceError } = await supabase
                  .from('park_product_price')
                  .select('id')
                  .eq('park_product_id', park.parkId)
                  .limit(1)
                  .maybeSingle(); // Use maybeSingle() to handle no rows
                
                if (anyPriceError || !anyPriceData) {
                  console.warn('No park product price found for park:', park.parkId);
                  continue;
                }
                
                // Use the found price
              const unitPrice = park.price / (park.duration * park.pax);
              const discountPercent = 0; // No discount by default
              const calculatedFinalPrice = unitPrice * (1 - discountPercent / 100);
              
              parkServicesToInsert.push({
                offer_id: offerId,
                park_product_price_id: anyPriceData.id,
                price: unitPrice,
                discount_percent: discountPercent,
                final_service_price: calculatedFinalPrice,
                description: `Duration: ${park.duration}, PAX: ${park.pax}`,
              });
                continue;
              }

              const unitPrice = park.price / (park.duration * park.pax);
              const discountPercent = 0; // No discount by default
              const calculatedFinalPrice = unitPrice * (1 - discountPercent / 100);
              
              parkServicesToInsert.push({
                offer_id: offerId,
                park_product_price_id: priceData.id,
                price: unitPrice,
                discount_percent: discountPercent,
                final_service_price: calculatedFinalPrice,
                description: `Duration: ${park.duration}, PAX: ${park.pax}`,
              });
            } catch (parkError) {
              console.error('Error processing park:', park.parkId, parkError);
              continue;
            }
          }

          if (parkServicesToInsert.length > 0) {
            console.log('Inserting park services:', JSON.stringify(parkServicesToInsert, null, 2));
            
            // Validate data before insert
            for (const service of parkServicesToInsert) {
              console.log('Validating service:', {
                offer_id: service.offer_id,
                park_product_price_id: service.park_product_price_id,
                price: service.price,
                discount_percent: service.discount_percent,
                final_service_price: service.final_service_price,
                description: service.description
              });
              
              // Check constraint: final_service_price = price * (1 - discount_percent / 100)
              const expectedFinalPrice = service.price * (1 - service.discount_percent / 100);
              console.log('Constraint check:', {
                expected: expectedFinalPrice,
                actual: service.final_service_price,
                matches: Math.abs(expectedFinalPrice - service.final_service_price) < 0.01
              });
            }
            
            const { error: insertError } = await supabase
              .from('offer_park_services')
              .insert(parkServicesToInsert);

            if (insertError) {
              console.error('Error inserting park services:', insertError);
              console.error('Insert data:', JSON.stringify(parkServicesToInsert, null, 2));
            } else {
              console.log('Successfully saved parks to database');
            }
          } else {
            console.warn('No park services to insert');
          }
        }
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          console.error('Continuing with localStorage only');
        }
      } catch (offerError) {
        console.error('Offer creation/retrieval failed:', offerError);
        console.log('Using localStorage only');
      }
    } catch (error) {
      console.error('Error saving selected parks:', error);
    }
  };

  useEffect(() => {
    fetchInitialData();
    loadSelectedParks();
  }, []);

  useEffect(() => {
    if (selectedPark) {
      fetchCategoriesForPark();
    }
  }, [selectedPark]);

  useEffect(() => {
    if (selectedPark && selectedCategory) {
      fetchEntryTypesForParkAndCategory();
    }
  }, [selectedPark, selectedCategory]);

  useEffect(() => {
    if (selectedPark && selectedCategory && selectedEntryType) {
      fetchProducts();
    }
  }, [selectedPark, selectedCategory, selectedEntryType]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch parks
      const { data: parksData, error: parksError } = await supabase
        .from('national_parks')
        .select('id, national_park_name, country_id, park_circuit_id')
        .eq('is_active', true)
        .order('national_park_name');

      if (parksError) {
        console.error('Error fetching parks:', parksError);
      } else {
        // Deduplicate parks by name (case-insensitive), keeping the first occurrence
        const uniqueParks = (parksData || []).reduce((acc: Park[], current) => {
          const existingPark = acc.find(park => 
            park.national_park_name.toLowerCase().trim() === current.national_park_name.toLowerCase().trim()
          );
          if (!existingPark) {
            acc.push(current);
          } else {
            console.warn(`Duplicate park name found: "${current.national_park_name}" (ID: ${current.id}), keeping first occurrence "${existingPark.national_park_name}" (ID: ${existingPark.id})`);
          }
          return acc;
        }, []);
        
        console.log(`Fetched ${parksData?.length || 0} parks, ${uniqueParks.length} unique parks after deduplication`);
        
        // Log all park names for debugging
        console.log('All park names:', uniqueParks.map(p => p.national_park_name));
        
        setParks(uniqueParks);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoriesForPark = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('park_category')
        .select('id, category_name')
        .eq('is_active', true)
        .order('category_name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEntryTypesForParkAndCategory = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching entry types:', error);
    }
  };

  // Helper function to safely access Supabase join data
  const safeAccess = (data: any, path: string) => {
    if (!data) return null;
    const keys = path.split('.');
    let current = data;
    for (const key of keys) {
      if (Array.isArray(current)) {
        current = current[0];
      }
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    return current;
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      // First, let's check if there are any products at all for this park/category/entry type combination
      console.log('Checking basic products first...');
      const { data: basicProducts, error: basicError } = await supabase
        .from('park_product')
        .select(`
          id,
          product_name,
          national_park_id,
          park_category_id,
          entry_type_id,
          park_category(category_name),
          entry_type(entry_name),
          national_parks(national_park_name)
        `)
        .eq('national_park_id', parseInt(selectedPark))
        .eq('park_category.category_name', selectedCategory)
        .eq('entry_type.entry_name', selectedEntryType);

      console.log('Basic products found:', basicProducts);
      if (basicError) {
        console.error('Error fetching basic products:', basicError);
      }

      // Now try the full query with pricing - simplified approach
      let query = supabase
        .from('park_product')
        .select(`
          id,
          product_name,
          national_park_id,
          park_category_id,
          entry_type_id,
          park_category!inner(category_name),
          entry_type!inner(entry_name),
          national_parks!inner(national_park_name, park_circuit_id, national_park_circuit!inner(national_park_circuit_name)),
          park_product_price!inner(
            unit_amount,
            currency_id,
            tax_behavior,
            season_id,
            currency!inner(currency_name),
            seasons!inner(start_date, end_date)
          )
        `)
        .eq('national_park_id', parseInt(selectedPark))
        .eq('park_category.category_name', selectedCategory)
        .eq('entry_type.entry_name', selectedEntryType);

      // Add date range filtering if trip dates are available
      if (quoteData.startDate && quoteData.endDate) {
        const startDate = new Date(quoteData.startDate);
        const endDate = new Date(quoteData.endDate);
        
        // Filter products that are active during the trip date range
        query = query
          .gte('park_product_price.seasons.start_date', startDate.toISOString())
          .lte('park_product_price.seasons.end_date', endDate.toISOString());
      }

      console.log('Fetching products with query:', {
        selectedPark,
        selectedCategory,
        selectedEntryType,
        startDate: quoteData.startDate,
        endDate: quoteData.endDate
      });

      const { data: products, error: productsError } = await query;

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setUsdProducts([]);
        setTzsProducts([]);
      } else {
        console.log('Raw products data:', products);
        console.log('First product structure:', products?.[0]);
        const productsList = products || [];
        
        // If no products found with season filtering, try without season filtering
        if (productsList.length === 0 && quoteData.startDate && quoteData.endDate) {
          console.log('No products found with season filtering, trying without...');
          const { data: productsWithoutSeason, error: seasonError } = await supabase
            .from('park_product')
            .select(`
              id,
              product_name,
              national_park_id,
              park_category_id,
              entry_type_id,
              park_category!inner(category_name),
              entry_type!inner(entry_name),
              national_parks!inner(national_park_name, park_circuit_id, national_park_circuit!inner(national_park_circuit_name)),
              park_product_price!inner(
                unit_amount,
                currency_id,
                tax_behavior,
                currency!inner(currency_name)
              )
            `)
            .eq('national_park_id', parseInt(selectedPark))
            .eq('park_category.category_name', selectedCategory)
            .eq('entry_type.entry_name', selectedEntryType);
            
          console.log('Products without season filtering:', productsWithoutSeason);
          if (seasonError) {
            console.error('Error fetching products without season filtering:', seasonError);
          }
          
          // If we found products without season filtering, use them
          if (productsWithoutSeason && productsWithoutSeason.length > 0) {
            console.log('Using products without season filtering');
            // Group products by their core attributes (excluding currency)
            const productGroupsWithoutSeason = new Map();
            
            productsWithoutSeason.forEach(product => {
              // Skip products without pricing data
              if (!product.park_product_price) {
                console.warn('Product without pricing data:', product);
                return;
              }

              const key = `${product.national_park_id}-${product.park_category_id}-${product.entry_type_id}`;
              const priceData = product.park_product_price;
              
              // Skip if currency data is missing
              const currencyName = safeAccess(priceData, 'currency.currency_name');
              if (!currencyName) {
                console.warn('Product without currency data:', product);
                return;
              }

              const currencyCode = currencyName.toLowerCase();
              
              if (!productGroupsWithoutSeason.has(key)) {
                productGroupsWithoutSeason.set(key, {
                  id: product.id,
                  product_name: product.product_name,
                  category_name: safeAccess(product, 'park_category.category_name') || 'Unknown',
                  entry_name: safeAccess(product, 'entry_type.entry_name') || 'Unknown',
                  park_name: safeAccess(product, 'national_parks.national_park_name') || 'Unknown',
                  park_circuit_name: safeAccess(product, 'national_parks.national_park_circuit.national_park_circuit_name') || 'Unknown',
                  usd_price: 0,
                  tzs_price: 0,
                  usd_tax_behavior: null,
                  tzs_tax_behavior: null,
                  usd_currency_id: null,
                  tzs_currency_id: null
                });
              }
              
              const group = productGroupsWithoutSeason.get(key);
              if (currencyCode === 'usd') {
                group.usd_price = safeAccess(priceData, 'unit_amount') || 0;
                group.usd_tax_behavior = safeAccess(priceData, 'tax_behavior');
                group.usd_currency_id = safeAccess(priceData, 'currency_id');
              } else if (currencyCode === 'tzs') {
                group.tzs_price = safeAccess(priceData, 'unit_amount') || 0;
                group.tzs_tax_behavior = safeAccess(priceData, 'tax_behavior');
                group.tzs_currency_id = safeAccess(priceData, 'currency_id');
              }
            });
            
            // Convert grouped products to array
            const transformedProductsWithoutSeason = Array.from(productGroupsWithoutSeason.values());
            
            // Separate USD and TZS products
            const usdProductsList = transformedProductsWithoutSeason.filter(p => p.usd_price > 0);
            const tzsProductsList = transformedProductsWithoutSeason.filter(p => p.tzs_price > 0);
            
            setUsdProducts(usdProductsList);
            setTzsProducts(tzsProductsList);
            return; // Exit early since we found products
          }
        }
        
        // Group products by their core attributes (excluding currency)
        const productGroups = new Map();
        
        productsList.forEach(product => {
          // Skip products without pricing data
          if (!product.park_product_price) {
            console.warn('Product without pricing data:', product);
            return;
          }

          const key = `${product.national_park_id}-${product.park_category_id}-${product.entry_type_id}`;
          const priceData = product.park_product_price;
          
          // Skip if currency data is missing
          const currencyName = safeAccess(priceData, 'currency.currency_name');
          if (!currencyName) {
            console.warn('Product without currency data:', product);
            return;
          }

          const currencyCode = currencyName.toLowerCase();
          
          if (!productGroups.has(key)) {
            productGroups.set(key, {
              id: product.id,
              product_name: product.product_name,
              category_name: safeAccess(product, 'park_category.category_name') || 'Unknown',
              entry_name: safeAccess(product, 'entry_type.entry_name') || 'Unknown',
              park_name: safeAccess(product, 'national_parks.national_park_name') || 'Unknown',
              park_circuit_name: safeAccess(product, 'national_parks.national_park_circuit.national_park_circuit_name') || 'Unknown',
              usd_price: 0,
              tzs_price: 0,
              usd_tax_behavior: null,
              tzs_tax_behavior: null,
              usd_currency_id: null,
              tzs_currency_id: null
            });
          }
          
          const group = productGroups.get(key);
          if (currencyCode === 'usd') {
            group.usd_price = safeAccess(priceData, 'unit_amount') || 0;
            group.usd_tax_behavior = safeAccess(priceData, 'tax_behavior');
            group.usd_currency_id = safeAccess(priceData, 'currency_id');
          } else if (currencyCode === 'tzs') {
            group.tzs_price = safeAccess(priceData, 'unit_amount') || 0;
            group.tzs_tax_behavior = safeAccess(priceData, 'tax_behavior');
            group.tzs_currency_id = safeAccess(priceData, 'currency_id');
          }
        });
        
        // Convert grouped products to array
        const unifiedProducts = Array.from(productGroups.values());
        
        // For backward compatibility, separate into USD and TZS lists
        const usdProductsList = unifiedProducts.filter(p => p.usd_price > 0);
        const tzsProductsList = unifiedProducts.filter(p => p.tzs_price > 0);
        
        console.log('Processed products:', {
          total: unifiedProducts.length,
          usd: usdProductsList.length,
          tzs: tzsProductsList.length,
          usdProducts: usdProductsList,
          tzsProducts: tzsProductsList
        });
        
        setUsdProducts(usdProductsList);
        setTzsProducts(tzsProductsList);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = (product: ParkProduct, currency: 'USD' | 'TZS') => {
    let basePrice: number;
    
    // Get the appropriate price based on currency selection
    if (currency === 'USD') {
      basePrice = product.usd_price || 0;
      // If no USD price, convert from TZS
      if (basePrice === 0 && product.tzs_price > 0) {
        basePrice = convertTzsToUsd(product.tzs_price);
      }
    } else {
      basePrice = product.tzs_price || 0;
      // If no TZS price, convert from USD
      if (basePrice === 0 && product.usd_price > 0) {
        basePrice = convertUsdToTzs(product.usd_price);
      }
    }
    
    const taxBehavior = currency === 'USD' ? product.usd_tax_behavior : product.tzs_tax_behavior;
    
    // Tax behavior: 2 = exclusive, 4 = exclusive (different case)
    if (taxBehavior === 2 || taxBehavior === 4) {
      // Add 18% tax for exclusive
      return basePrice * 1.18;
    }
    
    return basePrice;
  };

  const addParkSelection = async (product: ParkProduct, currency: 'USD' | 'TZS') => {
    const price = calculatePrice(product, currency);
    const totalPrice = price * duration * numberOfPeople;

    let updatedParks: ParkSelection[];

    if (isEditing && editingParkId) {
      // Update existing park selection
      updatedParks = quoteData.selectedParks.map(park => 
        park.id === editingParkId 
          ? {
              ...park,
              parkId: product.id,
              parkName: product.park_name,
              productName: product.product_name,
              category: product.category_name,
              entryType: product.entry_name,
              duration: duration,
              pax: numberOfPeople,
              price: totalPrice,
              currency: currency,
            }
          : park
      );
      
      // Reset edit mode
      cancelEdit();
    } else {
      // Add new park selection
      const newSelection: ParkSelection = {
        id: Date.now().toString(),
        parkId: product.id,
        parkName: product.park_name,
        productName: product.product_name,
        category: product.category_name,
        entryType: product.entry_name,
        duration: duration,
        pax: numberOfPeople,
        price: totalPrice,
        currency: currency,
      };

      updatedParks = [...quoteData.selectedParks, newSelection];
    }

    // Update local state
    updateQuoteData({
      selectedParks: updatedParks
    });

    // Save to database
    await saveSelectedParks(updatedParks);
  };

  const addSelectedProduct = () => {
    if (!selectedProduct || !selectedProductData) return;
    
    // Use the selected currency from radio buttons
    addParkSelection(selectedProductData, selectedCurrency);
    
    // Reset the product selection only if not editing
    if (!isEditing) {
      setSelectedProduct('');
    }
  };

  const removeParkSelection = async (id: string) => {
    const updatedParks = quoteData.selectedParks.filter(park => park.id !== id);
    
    updateQuoteData({
      selectedParks: updatedParks
    });

    // Save to database
    await saveSelectedParks(updatedParks);
  };

  const updateParkSelection = async (id: string, updates: Partial<ParkSelection>) => {
    const updatedParks = quoteData.selectedParks.map(park =>
      park.id === id ? { ...park, ...updates } : park
    );
    
    updateQuoteData({
      selectedParks: updatedParks
    });

    // Save to database
    await saveSelectedParks(updatedParks);
  };

  const calculateParkTotal = (park: ParkSelection) => {
    return park.price;
  };

  const calculateTotalParks = () => {
    return quoteData.selectedParks.reduce((total, park) => total + calculateParkTotal(park), 0);
  };

  const getFilteredProducts = () => {
    if (!selectedPark || !selectedCategory || !selectedEntryType) {
      console.log('getFilteredProducts: Missing selections', { selectedPark, selectedCategory, selectedEntryType });
      return [];
    }
    
    const allProducts = [...usdProducts, ...tzsProducts];
    const selectedParkName = parks.find(p => p.id.toString() === selectedPark)?.national_park_name;
    
    console.log('getFilteredProducts: Filtering products', {
      allProducts: allProducts.length,
      selectedPark,
      selectedParkName,
      selectedCategory,
      selectedEntryType,
      usdProducts: usdProducts.length,
      tzsProducts: tzsProducts.length
    });
    
    const filtered = allProducts.filter(product => 
      product.park_name === selectedParkName &&
      product.category_name === selectedCategory &&
      product.entry_name === selectedEntryType
    );
    
    console.log('getFilteredProducts: Filtered results', filtered);
    return filtered;
  };

  const resetFilters = () => {
    setSelectedPark('');
    setSelectedCategory('');
    setSelectedEntryType('');
    setSelectedProduct('');
    setUsdProducts([]);
    setTzsProducts([]);
  };

  return (
    <div className="space-y-6">
      {/* Search and Selection Form */}
      <Card className="border-2 border-blue-50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-gray-900">Select Park & Activities</div>
              <div className="text-sm font-normal text-gray-600 mt-1">
                Choose your national park and activities for an unforgettable safari experience
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Compact Horizontal Form Layout */}
          <div className="space-y-4">
            {/* Edit Mode Indicator */}
            {isEditing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Editing: {quoteData.selectedParks.find(p => p.id === editingParkId)?.productName}
                  </span>
                </div>
              </div>
            )}
            
            {/* Single Row with All Inputs */}
            <div className="flex flex-wrap items-end gap-3">
              {/* National Park */}
              <div className="flex-1 min-w-[120px]">
                <Label htmlFor="park-select" className="text-xs font-bold text-gray-700 block mb-1">
                  National Park
                </Label>
                <SearchableDropdown
                  id="park-select"
                  label=""
                  value={selectedPark}
                  onChange={setSelectedPark}
                  options={parks.map((park) => ({
                    id: park.id,
                    label: park.national_park_name,
                    value: park.id.toString()
                  }))}
                  placeholder=""
                  required
                />
              </div>

              {/* Category */}
              <div className="flex-1 min-w-[100px]">
                <Label htmlFor="category-select" className="text-xs font-bold text-gray-700 block mb-1">
                  Category
                </Label>
                <SearchableDropdown
                  id="category-select"
                  label=""
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={[
                    { id: '', label: 'Category', value: '' },
                    ...categories.map((category) => ({
                      id: category.id,
                      label: category.category_name,
                      value: category.category_name
                    }))
                  ]}
                  placeholder="Category"
                  required
                  disabled={!selectedPark}
                />
              </div>

              {/* Type */}
              <div className="flex-1 min-w-[100px]">
                <Label htmlFor="entry-type-select" className="text-xs font-bold text-gray-700 block mb-1">
                  Type
                </Label>
                <SearchableDropdown
                  id="entry-type-select"
                  label=""
                  value={selectedEntryType}
                  onChange={setSelectedEntryType}
                  options={[
                    { id: '', label: 'Entry type', value: '' },
                    ...entryTypes.map((entryType) => ({
                      id: entryType.id,
                      label: entryType.entry_name,
                      value: entryType.entry_name
                    }))
                  ]}
                  placeholder="Entry type"
                  required
                  disabled={!selectedCategory}
                />
              </div>

              {/* Product */}
              <div className="flex-1 min-w-[120px]">
                <Label htmlFor="product-select" className="text-xs font-bold text-gray-700 block mb-1">
                  Product
                </Label>
                <SearchableDropdown
                  id="product-select"
                  label=""
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  options={[
                    { id: '', label: 'Product name', value: '' },
                    ...getFilteredProducts().map((product) => ({
                      id: product.id,
                      label: product.product_name,
                      value: product.id.toString()
                    }))
                  ]}
                  placeholder="Product name"
                  required
                  disabled={!selectedEntryType}
                />
              </div>

              {/* Currency Selection and Price Display */}
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs font-bold text-gray-700 block mb-1">
                  Currency & Price
                </Label>
                
                {/* Currency Radio Buttons */}
                <div className="flex gap-4 mb-2">
                  <label className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    selectedCurrency === 'USD' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                      : 'hover:bg-gray-100'
                  }`}>
                    <input
                      type="radio"
                      name="currency"
                      value="USD"
                      checked={selectedCurrency === 'USD'}
                      onChange={(e) => setSelectedCurrency(e.target.value as 'USD' | 'TZS')}
                      className="w-3 h-3"
                    />
                    USD
                  </label>
                  <label className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    selectedCurrency === 'TZS' 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'hover:bg-gray-100'
                  }`}>
                    <input
                      type="radio"
                      name="currency"
                      value="TZS"
                      checked={selectedCurrency === 'TZS'}
                      onChange={(e) => setSelectedCurrency(e.target.value as 'USD' | 'TZS')}
                      className="w-3 h-3"
                    />
                    TZS
                  </label>
                </div>

                {/* Price Display */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="usd-price"
                      type="number"
                      value={selectedProductData ? getDisplayPrice(selectedProductData).usd.toFixed(2) : ''}
                      readOnly
                      className={`h-8 text-xs text-center ${
                        selectedCurrency === 'USD' 
                          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' 
                          : 'bg-gray-50'
                      }`}
                      placeholder="USD Price"
                    />
                    <div className={`text-xs text-center mt-1 ${
                      selectedCurrency === 'USD' ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}>
                      USD {selectedCurrency === 'USD' && '← Selected'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Input
                      id="tzs-price"
                      type="number"
                      value={selectedProductData ? getDisplayPrice(selectedProductData).tzs.toFixed(0) : ''}
                      readOnly
                      className={`h-8 text-xs text-center ${
                        selectedCurrency === 'TZS' 
                          ? 'bg-green-50 border-green-300 ring-1 ring-green-200' 
                          : 'bg-gray-50'
                      }`}
                      placeholder="TZS Price"
                    />
                    <div className={`text-xs text-center mt-1 ${
                      selectedCurrency === 'TZS' ? 'text-green-600 font-medium' : 'text-gray-500'
                    }`}>
                      TZS {selectedCurrency === 'TZS' && '← Selected'}
                    </div>
                  </div>
                </div>
                
                {/* Conversion Rate Input */}
                <div className="mt-2">
                  <Label htmlFor="conversion-rate" className="text-xs text-gray-600">
                    USD to TZS Rate:
                  </Label>
                  <Input
                    id="conversion-rate"
                    type="number"
                    value={usdToTzsRate}
                    onChange={(e) => setUsdToTzsRate(parseFloat(e.target.value) || 2500)}
                    className="h-6 text-xs"
                    min="1"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="w-20">
                <Label htmlFor="duration" className="text-xs font-bold text-gray-700 block mb-1">
                  DURATION
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max={tripDuration > 0 ? tripDuration : undefined}
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="h-8 text-xs text-center"
                  required
                />
              </div>

              {/* PAX/QTY */}
              <div className="w-20">
                <Label htmlFor="number-of-people" className="text-xs font-bold text-gray-700 block mb-1">
                  PAX/QTY
                </Label>
                <Input
                  id="number-of-people"
                  type="number"
                  min="1"
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs text-center"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={addSelectedProduct}
                  className="h-8 px-3 bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs font-medium"
                  disabled={!selectedProduct}
                >
                  {isEditing ? 'Update' : 'Save'}
                </Button>
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    className="h-8 px-3 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="h-8 px-3 bg-red-100 text-red-600 hover:bg-red-200 text-xs font-medium"
                  disabled={!selectedPark}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
          
          
          {/* Validation Message */}
          {errors.parks && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xs font-bold">!</span>
                </div>
                <span className="font-medium">{errors.parks}</span>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {quoteData.selectedParks.length > 0 && !errors.parks && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xs font-bold">✓</span>
                </div>
                <span className="font-medium">
                  Great! You've selected {quoteData.selectedParks.length} park{quoteData.selectedParks.length !== 1 ? 's' : ''} and activit{quoteData.selectedParks.length !== 1 ? 'ies' : 'y'}.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-2 border-blue-50">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* No Products Message */}
      {selectedPark && selectedCategory && selectedEntryType && usdProducts.length === 0 && tzsProducts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No products found for the selected criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Parks Tables */}
      {quoteData.selectedParks.length > 0 && (
        <div className="space-y-6">
          {/* USD Products Table */}
          {quoteData.selectedParks.filter(park => park.currency === 'USD').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>USD Products</span>
                  <Badge variant="outline">
                    {quoteData.selectedParks.filter(park => park.currency === 'USD').length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Product Name</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">PAX</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Duration</th>
                        <th className="text-right py-2 px-3 font-medium text-sm text-gray-700">Amount (USD)</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData.selectedParks
                        .filter(park => park.currency === 'USD')
                        .map((park) => (
                        <tr key={park.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div>
                              <div className="font-medium text-sm">{park.productName}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {park.parkName} • {park.category} • {park.entryType}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-medium">
                            {park.pax}
                          </td>
                          <td className="py-3 px-3 text-center font-medium">
                            {park.duration}
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            ${calculateParkTotal(park).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editParkSelection(park.id)}
                                className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeParkSelection(park.id)}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Total USD Products:</span>
                    <span className="text-lg font-bold">
                      ${quoteData.selectedParks
                        .filter(park => park.currency === 'USD')
                        .reduce((sum, park) => sum + calculateParkTotal(park), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TZS Products Table */}
          {quoteData.selectedParks.filter(park => park.currency === 'TZS').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>TZS Products</span>
                  <Badge variant="outline">
                    {quoteData.selectedParks.filter(park => park.currency === 'TZS').length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Product Name</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">PAX</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Duration</th>
                        <th className="text-right py-2 px-3 font-medium text-sm text-gray-700">Amount (TZS)</th>
                        <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData.selectedParks
                        .filter(park => park.currency === 'TZS')
                        .map((park) => (
                        <tr key={park.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div>
                              <div className="font-medium text-sm">{park.productName}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {park.parkName} • {park.category} • {park.entryType}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-medium">
                            {park.pax}
                          </td>
                          <td className="py-3 px-3 text-center font-medium">
                            {park.duration}
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            TZS {calculateParkTotal(park).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editParkSelection(park.id)}
                                className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeParkSelection(park.id)}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Total TZS Products:</span>
                    <span className="text-lg font-bold">
                      TZS {quoteData.selectedParks
                        .filter(park => park.currency === 'TZS')
                        .reduce((sum, park) => sum + calculateParkTotal(park), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {errors.parks && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.parks}
        </div>
      )}
    </div>
  );
}