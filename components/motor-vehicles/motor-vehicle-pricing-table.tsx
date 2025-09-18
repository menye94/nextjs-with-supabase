"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { MoreHorizontal, Search, Power, PowerOff, Edit, Trash2, DollarSign, Calculator, Globe, Plus } from "lucide-react";

type MotorVehiclePricing = {
  id: number;
  tax_behaviour_id: number;
  motor_vehicle_product_id: number;
  currency_id: number;
  unit_amount: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  park_name?: string;
  vehicle_type_name?: string;
  tax_behaviour_name?: string;
  currency_name?: string;
  weight_range?: string;
  park_id?: number;
};

type MotorVehicleProduct = {
  id: number;
  park_id: number;
  motor_vehicle_entry_type_id: number;
  low_weight: number;
  high_weight: number;
  is_active: boolean;
  park_name?: string;
  vehicle_type_name?: string;
};

type TaxBehaviour = {
  id: number;
  name: string;
};

type Currency = {
  id: number;
  currency_name: string;
};

interface MotorVehiclePricingTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

export function MotorVehiclePricingTable({ searchQuery, onSearchChange }: MotorVehiclePricingTableProps) {
  const [pricing, setPricing] = useState<MotorVehiclePricing[]>([]);
  const [products, setProducts] = useState<MotorVehicleProduct[]>([]);
  const [taxBehaviours, setTaxBehaviours] = useState<TaxBehaviour[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [supabase] = useState(() => createClient());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<MotorVehiclePricing | null>(null);
  const [deletingPricing, setDeletingPricing] = useState<MotorVehiclePricing | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    motor_vehicle_product_id: 0,
    park_ids: [] as number[],
    entry_type_ids: [] as number[], // Changed from single motor_vehicle_entry_type_id to array
    age_group_ids: [] as number[], // Added age group IDs array
    low_weight: 0,
    high_weight: 0,
    tax_behaviour_id: 0,
    currency_id: 0,
    unit_amount: 0
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // State for parks and entry types data for the form
  const [parksData, setParksData] = useState<{ id: number; name: string }[]>([]);
  const [entryTypesData, setEntryTypesData] = useState<{ id: number; name: string }[]>([]);
  const [ageGroups, setAgeGroups] = useState<{ id: number; age_group_name: string; min_age: number; max_age: number }[]>([]);
  
  // Loading state for edit button
  const [editingLoading, setEditingLoading] = useState<number | null>(null);
  
  // Park filter state
  const [selectedParkFilter, setSelectedParkFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchPricing();
    fetchRelatedData();
  }, []);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  // Reset to first page when park filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedParkFilter]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal, showEditModal, showDeleteModal]);

  const fetchRelatedData = async () => {
    try {
      // Fetch products with simpler query
      const { data: productsData, error: productsError } = await supabase
        .from('motor_vehicle_products')
        .select(`
          id,
          park_id,
          motor_vehicle_entry_type_id,
          low_weight,
          high_weight,
          is_active
        `)
        .eq('is_deleted', false)
        .eq('is_active', true);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }

       // Fetch park names separately
       let parksData: Array<{ id: number; name?: string; national_park_name?: string }> = [];
       try {
         // Try national_parks first, then fallback to parks
         let data, error: any;
         
         try {
           const result = await supabase
             .from('national_parks')
             .select('id, national_park_name')
             .is('is_deleted', null);
           data = result.data;
           error = result.error;
         } catch (e) {
           // If national_parks fails, try parks
           try {
             const result = await supabase
               .from('parks')
               .select('id, name')
               .eq('is_deleted', false);
             data = result.data;
             error = result.error;
           } catch (e2) {
             console.error('Both national_parks and parks tables failed:', e2);
             error = e2;
           }
         }

         if (error) {
           console.error('Error fetching parks:', error);
           // Continue with empty parks data instead of throwing
         } else {
           parksData = data || [];
         }
       } catch (error) {
         console.error('Error accessing parks table:', error);
         // Continue with empty parks data
       }

       // Fetch entry type names separately
       let entryTypesData: { id: number; name: string }[] = [];
       try {
         const { data, error: entryTypesError } = await supabase
           .from('motor_vehicle_entry_type')
           .select('id, name')
           .eq('is_deleted', false);

         if (entryTypesError) {
           console.error('Error fetching entry types:', entryTypesError);
           // Continue with empty entry types data instead of throwing
         } else {
           entryTypesData = data || [];
         }
       } catch (error) {
         console.error('Error accessing entry types table:', error);
         // Continue with empty entry types data
       }

       // Transform products with related data
       const transformedProducts = productsData?.map(p => {
         const park = parksData?.find(park => park.id === p.park_id);
         const entryType = entryTypesData?.find(et => et.id === p.motor_vehicle_entry_type_id);
         
         return {
           id: p.id,
           park_id: p.park_id,
           motor_vehicle_entry_type_id: p.motor_vehicle_entry_type_id,
           low_weight: p.low_weight,
           high_weight: p.high_weight,
           is_active: p.is_active,
           park_name: park?.name || 'Unknown Park',
           vehicle_type_name: entryType?.name || 'Unknown Type'
         };
       }) || [];

       setProducts(transformedProducts);

       // Store parks and entry types data for the form
       // Transform parks data to consistent format
       const transformedParksData = parksData.map(park => ({
         id: park.id,
         name: 'national_park_name' in park ? String(park.national_park_name) : String(park.name)
       }));
       setParksData(transformedParksData);

       // Transform entry types data to consistent format
       const transformedEntryTypesData = entryTypesData.map(entryType => ({
         id: entryType.id,
         name: String(entryType.name)
       }));
       setEntryTypesData(transformedEntryTypesData);

      // Fetch age groups
      const { data: ageGroupsData, error: ageGroupsError } = await supabase
        .from('age_group')
        .select('id, age_group_name, min_age, max_age')
        .order('min_age');

      if (ageGroupsError) {
        console.error('Error fetching age groups:', ageGroupsError);
        // Continue with empty age groups data instead of throwing
      } else {
        setAgeGroups(ageGroupsData || []);
      }

      // Fetch tax behaviours
      const { data: taxData, error: taxError } = await supabase
        .from('tax_behaviour')
        .select('id, name');

      if (taxError) {
        console.error('Error fetching tax behaviours:', taxError);
        throw taxError;
      }
      setTaxBehaviours(taxData || []);

      // Fetch currencies
      const { data: currencyData, error: currencyError } = await supabase
        .from('currency')
        .select('id, currency_name');

      if (currencyError) {
        console.error('Error fetching currencies:', currencyError);
        throw currencyError;
      }
      setCurrencies(currencyData || []);

    } catch (error) {
      console.error('Error fetching related data:', error);
      // Set empty arrays to prevent further errors
      setProducts([]);
      setTaxBehaviours([]);
      setCurrencies([]);
    }
  };

  const fetchPricing = async () => {
    try {
      setLoading(true);
      
      // Fetch pricing with related data using the view
      const { data, error } = await supabase
        .from('motor_vehicle_products_with_prices')
        .select('*')
        .order('park_name, vehicle_type_name, unit_amount');

      if (error) {
        console.error('Error fetching pricing data:', error);
        throw error;
      }
      
      console.log('Raw data from view:', data);
      
      // Transform data to include weight range
      const transformedData = data?.map(price => {
        console.log('Processing price record:', price);
        
        const transformed = {
          id: price.price_id, // This is the pricing ID
          tax_behaviour_id: price.tax_behaviour_id,
          motor_vehicle_product_id: price.id, // This is the product ID from the view
          currency_id: price.currency_id,
          unit_amount: parseFloat(price.unit_amount) || 0,
          is_active: price.price_active || false,
          is_deleted: price.price_deleted || false,
          created_at: price.price_created_at || new Date().toISOString(),
          updated_at: price.price_updated_at || new Date().toISOString(),
          park_name: price.park_name || 'Unknown Park',
          vehicle_type_name: price.vehicle_type_name || 'Unknown Type',
          tax_behaviour_name: price.tax_behaviour_name || 'Unknown Tax',
          currency_name: price.currency_name || 'Unknown Currency',
          weight_range: `${price.low_weight || 0}kg - ${price.high_weight || 0}kg`,
          park_id: price.park_id
        };
        
        console.log('Transformed record:', transformed);
        return transformed;
      }) || [];
      
      setPricing(transformedData);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      // Set empty array to prevent further errors
      setPricing([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      setTogglingIds(prev => new Set(prev).add(id));
      
      const { error } = await supabase
        .from('motor_vehicle_products_price')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state immediately for better UX
      setPricing(prev => 
        prev.map(p => 
          p.id === id ? { ...p, is_active: !currentStatus } : p
        )
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      // If toggle failed, refresh the data to ensure consistency
      await fetchPricing();
    } finally {
      setTogglingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleEdit = (pricing: MotorVehiclePricing) => {
    try {
      console.log('=== EDIT START ===');
      console.log('Original pricing record:', pricing);
      
      // Set loading state for this specific pricing record
      setEditingLoading(pricing.id);
      
      // Use the already loaded data instead of making another database query
      // The pricing object already contains all the data we need
      console.log('Using existing pricing data for form population');
      
      // Map the existing pricing data directly to form data
      const formDataToSet = {
        motor_vehicle_product_id: Number(pricing.motor_vehicle_product_id) || 0,
        park_ids: [Number(pricing.park_id) || 0],
        entry_type_ids: [], // Will be populated from product data
        age_group_ids: [], // Will be populated from product data
        low_weight: 0, // Will be populated from product data
        high_weight: 0, // Will be populated from product data
        tax_behaviour_id: Number(pricing.tax_behaviour_id) || 0,
        currency_id: Number(pricing.currency_id) || 0,
        unit_amount: Number(pricing.unit_amount) || 0
      };
      
      // If we have the product data, get the missing fields from there
      if (pricing.motor_vehicle_product_id) {
        const product = products.find(p => p.id === pricing.motor_vehicle_product_id);
        if (product) {
          const updatedFormData = {
            ...formDataToSet,
            entry_type_ids: [Number(product.motor_vehicle_entry_type_id) || 0],
            low_weight: Number(product.low_weight) || 0,
            high_weight: Number(product.high_weight) || 0
          };
          console.log('Found product data:', product);
          
          console.log('Form data to set:', updatedFormData);
          
          // Validate that we have all required data
          const missingFields = [];
          if (updatedFormData.park_ids[0] === 0) missingFields.push('park_id');
          if (updatedFormData.entry_type_ids.length === 0) missingFields.push('entry_type_id');
          if (updatedFormData.low_weight === 0) missingFields.push('low_weight');
          if (updatedFormData.high_weight === 0) missingFields.push('high_weight');
          if (updatedFormData.tax_behaviour_id === 0) missingFields.push('tax_behaviour_id');
          if (updatedFormData.currency_id === 0) missingFields.push('currency_id');
          if (updatedFormData.unit_amount === 0) missingFields.push('unit_amount');
          
          if (missingFields.length > 0) {
            console.warn('Missing or invalid data for fields:', missingFields);
            console.warn('This might cause issues during save');
          }
          
          setFormData(updatedFormData);
          setFormErrors({});
          setEditingPricing(pricing);
          setShowEditModal(true);
          setEditingLoading(null); // Clear loading state
          
          console.log('=== EDIT COMPLETE ===');
          return;
        } else {
          console.log('Product not found in loaded data, will need to fetch');
          // Fallback: fetch just the product data if not in memory
          // This is now async but we'll handle it separately
          fetchMissingProductData(pricing.motor_vehicle_product_id, formDataToSet);
          return; // Exit early, the async function will handle the rest
        }
      }
      
      // If we don't have product data, use the basic form data
      console.log('Form data to set:', formDataToSet);
      
      // Validate that we have all required data
      const missingFields = [];
      if (formDataToSet.park_ids[0] === 0) missingFields.push('park_id');
      if (formDataToSet.entry_type_ids.length === 0) missingFields.push('entry_type_id');
      if (formDataToSet.low_weight === 0) missingFields.push('low_weight');
      if (formDataToSet.high_weight === 0) missingFields.push('high_weight');
      if (formDataToSet.tax_behaviour_id === 0) missingFields.push('tax_behaviour_id');
      if (formDataToSet.currency_id === 0) missingFields.push('currency_id');
      if (formDataToSet.unit_amount === 0) missingFields.push('unit_amount');
      
      if (missingFields.length > 0) {
        console.warn('Missing or invalid data for fields:', missingFields);
        console.warn('This might cause issues during save');
      }
      
      setFormData(formDataToSet);
      setFormErrors({});
      setEditingPricing(pricing);
      setShowEditModal(true);
      setEditingLoading(null); // Clear loading state
      
      console.log('=== EDIT COMPLETE ===');
    } catch (error) {
      console.error('Error preparing edit form:', error);
      setEditingLoading(null); // Clear loading state on error
      alert('An error occurred while preparing the edit form. Please try again.');
    }
  };
  
  // Separate async function for fetching missing product data
  const fetchMissingProductData = async (productId: number, formDataToSet: any) => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('motor_vehicle_products')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (productData && !productError) {
        formDataToSet.entry_type_ids = [Number(productData.motor_vehicle_entry_type_id) || 0];
        formDataToSet.low_weight = Number(productData.low_weight) || 0;
        formDataToSet.high_weight = Number(productData.high_weight) || 0;
        console.log('Fetched product data:', productData);
        
        // Now set the form data and open modal
        setFormData(formDataToSet);
        setFormErrors({});
        setEditingPricing(pricing.find(p => p.motor_vehicle_product_id === productId) || null);
        setShowEditModal(true);
      } else {
        console.error('Failed to fetch product data:', productError);
        alert('Unable to load product data for editing. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching missing product data:', error);
      alert('An error occurred while loading product data. Please try again.');
    } finally {
      setEditingLoading(null); // Clear loading state
    }
  };

  const handleDelete = (pricing: MotorVehiclePricing) => {
    setDeletingPricing(pricing);
    setShowDeleteModal(true);
  };

  const handleAdd = () => {
    setFormData({
      motor_vehicle_product_id: 0,
      park_ids: [],
      entry_type_ids: [],
      age_group_ids: [],
      low_weight: 0,
      high_weight: 0,
      tax_behaviour_id: 0,
      currency_id: 0,
      unit_amount: 0
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const validateForm = () => {
    console.log('=== VALIDATION START ===');
    console.log('Validating form data:', formData);
    console.log('Form data types during validation:', {
      motor_vehicle_product_id: typeof formData.motor_vehicle_product_id,
      park_ids: typeof formData.park_ids,
      entry_type_ids: typeof formData.entry_type_ids,
      age_group_ids: typeof formData.age_group_ids,
      low_weight: typeof formData.low_weight,
      high_weight: typeof formData.high_weight,
      tax_behaviour_id: typeof formData.tax_behaviour_id,
      currency_id: typeof formData.currency_id,
      unit_amount: typeof formData.unit_amount
    });
    console.log('Form data values during validation:', {
      motor_vehicle_product_id: formData.motor_vehicle_product_id,
      park_ids: formData.park_ids,
      entry_type_ids: formData.entry_type_ids,
      age_group_ids: formData.age_group_ids,
      low_weight: formData.low_weight,
      high_weight: formData.high_weight,
      tax_behaviour_id: formData.tax_behaviour_id,
      currency_id: formData.currency_id,
      unit_amount: formData.unit_amount
    });
    
    const errors: { [key: string]: string } = {};
    
    // Check each field individually with detailed logging
    if (!formData.park_ids || formData.park_ids.length === 0) {
      console.log('❌ Park IDs validation failed:', formData.park_ids);
      errors.park_ids = 'Please select at least one park';
    } else {
      console.log('✅ Park IDs validation passed:', formData.park_ids);
    }
    
    if (!formData.entry_type_ids || formData.entry_type_ids.length === 0) {
      console.log('❌ Entry type validation failed:', formData.entry_type_ids);
      errors.entry_type_ids = 'Please select at least one entry type';
    } else {
      console.log('✅ Entry type validation passed:', formData.entry_type_ids);
    }
    
    if (!formData.age_group_ids || formData.age_group_ids.length === 0) {
      console.log('❌ Age group validation failed:', formData.age_group_ids);
      errors.age_group_ids = 'Please select at least one age group';
    } else {
      console.log('✅ Age group validation passed:', formData.age_group_ids);
    }
    
    if (!formData.low_weight || formData.low_weight <= 0) {
      console.log('❌ Low weight validation failed:', formData.low_weight);
      errors.low_weight = 'Low weight must be greater than 0';
    } else {
      console.log('✅ Low weight validation passed:', formData.low_weight);
    }
    
    if (!formData.high_weight || formData.high_weight <= 0) {
      console.log('❌ High weight validation failed:', formData.high_weight);
      errors.high_weight = 'High weight must be greater than 0';
    } else {
      console.log('✅ High weight validation passed:', formData.high_weight);
    }
    
    if (!formData.tax_behaviour_id || formData.tax_behaviour_id === 0) {
      console.log('❌ Tax behaviour validation failed:', formData.tax_behaviour_id);
      errors.tax_behaviour_id = 'Please select a tax behaviour';
    } else {
      console.log('✅ Tax behaviour validation passed:', formData.tax_behaviour_id);
    }
    
    if (!formData.currency_id || formData.currency_id === 0) {
      console.log('❌ Currency validation failed:', formData.currency_id);
      errors.currency_id = 'Please select a currency';
    } else {
      console.log('✅ Currency validation passed:', formData.currency_id);
    }
    
    if (!formData.unit_amount || formData.unit_amount <= 0) {
      console.log('❌ Unit amount validation failed:', formData.unit_amount);
      errors.unit_amount = 'Unit amount must be greater than 0';
    } else {
      console.log('✅ Unit amount validation passed:', formData.unit_amount);
    }
    
    console.log('Validation errors:', errors);
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('Form validation result:', isValid);
    console.log('=== VALIDATION END ===');
    return isValid;
  };

  const handleSubmit = async () => {
    console.log('=== SUBMIT START ===');
    console.log('Form data before validation:', formData);
    console.log('Form errors before validation:', formErrors);
    console.log('Editing pricing:', editingPricing);
    console.log('Form data types:', {
      motor_vehicle_product_id: typeof formData.motor_vehicle_product_id,
      park_ids: typeof formData.park_ids,
      entry_type_ids: typeof formData.entry_type_ids,
      age_group_ids: typeof formData.age_group_ids,
      low_weight: typeof formData.low_weight,
      high_weight: typeof formData.high_weight,
      tax_behaviour_id: typeof formData.tax_behaviour_id,
      currency_id: typeof formData.currency_id,
      unit_amount: typeof formData.unit_amount
    });
    console.log('Form data values:', {
      motor_vehicle_product_id: formData.motor_vehicle_product_id,
      park_ids: formData.park_ids,
      entry_type_ids: formData.entry_type_ids,
      age_group_ids: formData.age_group_ids,
      low_weight: formData.low_weight,
      high_weight: formData.high_weight,
      tax_behaviour_id: formData.tax_behaviour_id,
      currency_id: formData.currency_id,
      unit_amount: formData.unit_amount
    });
    
    if (!validateForm()) {
      console.log('Form validation failed, stopping submit');
      return;
    }
    
    console.log('Form validation passed, proceeding with submit');

    try {
      setSubmitting(true);
      
      // Sanitize form data to ensure no undefined values
      const sanitizedFormData = {
        motor_vehicle_product_id: Number(formData.motor_vehicle_product_id) || 0,
        park_ids: formData.park_ids.filter(id => id && id > 0),
        entry_type_ids: formData.entry_type_ids.filter(id => id && id > 0),
        age_group_ids: formData.age_group_ids.filter(id => id && id > 0),
        low_weight: Number(formData.low_weight) || 0,
        high_weight: Number(formData.high_weight) || 0,
        tax_behaviour_id: Number(formData.tax_behaviour_id) || 0,
        currency_id: Number(formData.currency_id) || 0,
        unit_amount: Number(formData.unit_amount) || 0
      };
      
      console.log('Sanitized form data:', sanitizedFormData);
      console.log('Sanitized data types:', {
        motor_vehicle_product_id: typeof sanitizedFormData.motor_vehicle_product_id,
        park_ids: typeof sanitizedFormData.park_ids,
        entry_type_ids: typeof sanitizedFormData.entry_type_ids,
        age_group_ids: typeof sanitizedFormData.age_group_ids,
        low_weight: typeof sanitizedFormData.low_weight,
        high_weight: typeof sanitizedFormData.high_weight,
        tax_behaviour_id: typeof sanitizedFormData.tax_behaviour_id,
        currency_id: typeof sanitizedFormData.currency_id,
        unit_amount: typeof sanitizedFormData.unit_amount
      });
      
      // Double-check that all required fields have valid values
      if (sanitizedFormData.park_ids.length === 0) {
        throw new Error('No valid park selected');
      }
      if (sanitizedFormData.entry_type_ids.length === 0) {
        throw new Error('No valid entry type selected');
      }
      if (sanitizedFormData.age_group_ids.length === 0) {
        throw new Error('No valid age group selected');
      }
      if (sanitizedFormData.low_weight === 0) {
        throw new Error('Low weight must be greater than 0');
      }
      if (sanitizedFormData.high_weight === 0) {
        throw new Error('High weight must be greater than 0');
      }
      if (sanitizedFormData.tax_behaviour_id === 0) {
        throw new Error('No valid tax behavior selected');
      }
      if (sanitizedFormData.currency_id === 0) {
        throw new Error('No valid currency selected');
      }
      if (sanitizedFormData.unit_amount === 0) {
        throw new Error('Unit amount must be greater than 0');
      }
      
      console.log('Starting submit with sanitized form data:', sanitizedFormData);
      console.log('Editing pricing:', editingPricing);
      
      if (editingPricing) {
        console.log('Editing existing pricing record...');
        console.log('=== EDITING PRICING DEBUG ===');
        console.log('editingPricing object:', editingPricing);
        console.log('editingPricing.motor_vehicle_product_id:', editingPricing.motor_vehicle_product_id);
        console.log('editingPricing.id:', editingPricing.id);
        console.log('editingPricing type:', typeof editingPricing);
        console.log('editingPricing keys:', Object.keys(editingPricing));
        console.log('=== END EDITING PRICING DEBUG ===');
        
        // For editing, we need to update both the product and pricing
        // First update the product (assuming single park for editing)
        console.log('Updating product with ID:', editingPricing.motor_vehicle_product_id);
        
        // Check if motor_vehicle_product_id is valid
        if (!editingPricing.motor_vehicle_product_id) {
          console.error('❌ CRITICAL ERROR: motor_vehicle_product_id is undefined/null');
          console.error('editingPricing object:', editingPricing);
          throw new Error('Cannot update product: motor_vehicle_product_id is missing');
        }
        
        console.log('Product update data:', {
          park_id: sanitizedFormData.park_ids[0],
          motor_vehicle_entry_type_id: sanitizedFormData.entry_type_ids[0], // Assuming single entry type for product update
          low_weight: sanitizedFormData.low_weight,
          high_weight: sanitizedFormData.high_weight
        });
        
        // Log the exact data being sent to the database
        const productUpdateData = {
          park_id: sanitizedFormData.park_ids[0],
          motor_vehicle_entry_type_id: sanitizedFormData.entry_type_ids[0], // Assuming single entry type for product update
          low_weight: sanitizedFormData.low_weight,
          high_weight: sanitizedFormData.high_weight,
          updated_at: new Date().toISOString()
        };
        
        console.log('Product update data being sent to database:', productUpdateData);
        console.log('Product update data types:', {
          park_id: typeof productUpdateData.park_id,
          motor_vehicle_entry_type_id: typeof productUpdateData.motor_vehicle_entry_type_id,
          low_weight: typeof productUpdateData.low_weight,
          high_weight: typeof productUpdateData.high_weight,
          updated_at: typeof productUpdateData.updated_at
        });
        
        console.log('About to execute Supabase update with:');
        console.log('- Table: motor_vehicle_products');
        console.log('- ID to update: editingPricing.motor_vehicle_product_id =', editingPricing.motor_vehicle_product_id);
        console.log('- Update data:', productUpdateData);
        
        const { error: productError } = await supabase
          .from('motor_vehicle_products')
          .update(productUpdateData)
          .eq('id', editingPricing.motor_vehicle_product_id);

        if (productError) {
          console.error('Product update error:', productError);
          console.error('Product update error details:', {
            message: productError.message,
            details: productError.details,
            hint: productError.hint,
            code: productError.code
          });
          throw new Error(`Failed to update product: ${productError.message}`);
        }
        
        console.log('Product updated successfully');

        // Then update the pricing
        console.log('Updating pricing with ID:', editingPricing.id);
        console.log('Pricing update data:', {
          tax_behaviour_id: sanitizedFormData.tax_behaviour_id,
          currency_id: sanitizedFormData.currency_id,
          unit_amount: sanitizedFormData.unit_amount
        });
        
        // Log the exact data being sent to the database
        const pricingUpdateData = {
          tax_behaviour_id: sanitizedFormData.tax_behaviour_id,
          currency_id: sanitizedFormData.currency_id,
          unit_amount: sanitizedFormData.unit_amount,
          updated_at: new Date().toISOString()
        };
        
        console.log('Pricing update data being sent to database:', pricingUpdateData);
        console.log('Pricing update data types:', {
          tax_behaviour_id: typeof pricingUpdateData.tax_behaviour_id,
          currency_id: typeof pricingUpdateData.currency_id,
          unit_amount: typeof pricingUpdateData.unit_amount,
          updated_at: typeof pricingUpdateData.updated_at
        });
        
        const { error: pricingError } = await supabase
          .from('motor_vehicle_products_price')
          .update(pricingUpdateData)
          .eq('id', editingPricing.id);

        if (pricingError) {
          console.error('Pricing update error:', pricingError);
          console.error('Pricing update error details:', {
            message: pricingError.message,
            details: pricingError.details,
            hint: pricingError.hint,
            code: pricingError.code
          });
          throw new Error(`Failed to update pricing: ${pricingError.message}`);
        }
        
        console.log('Pricing updated successfully');

        // Refresh data to get updated information
        await fetchPricing();
      } else {
        console.log('Creating new pricing records...');
        
        // Create new products and pricing for each selected park, entry type, and age group combination
        for (const parkId of sanitizedFormData.park_ids) {
          for (const entryTypeId of sanitizedFormData.entry_type_ids) {
            for (const ageGroupId of sanitizedFormData.age_group_ids) {
              console.log('Creating product for park ID:', parkId, 'entry type ID:', entryTypeId, 'age group ID:', ageGroupId);
              
              // Create new product for this combination
              const { data: productData, error: productError } = await supabase
                .from('motor_vehicle_products')
                .insert({
                  park_id: parkId,
                  motor_vehicle_entry_type_id: entryTypeId,
                  low_weight: sanitizedFormData.low_weight,
                  high_weight: sanitizedFormData.high_weight,
                  is_active: true
                })
                .select()
                .single();

              if (productError) {
                console.error('Product creation error for combination:', { parkId, entryTypeId, ageGroupId }, ':', productError);
                throw new Error(`Failed to create product for combination: ${productError.message}`);
              }

              console.log('Product created successfully:', productData);

              // Then create the pricing record for this product
              const { error: pricingError } = await supabase
                .from('motor_vehicle_products_price')
                .insert({
                  motor_vehicle_product_id: productData.id,
                  tax_behaviour_id: sanitizedFormData.tax_behaviour_id,
                  currency_id: sanitizedFormData.currency_id,
                  unit_amount: sanitizedFormData.unit_amount,
                  is_active: true
                });

              if (pricingError) {
                console.error('Pricing creation error for product', productData.id, ':', pricingError);
                throw new Error(`Failed to create pricing for product ${productData.id}: ${pricingError.message}`);
              }
              
              console.log('Pricing created successfully for product:', productData.id);
            }
          }
        }

        // Refresh data to get the new pricing with related info
        await fetchPricing();
      }

      console.log('Submit completed successfully');

      // Close modal and reset form
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingPricing(null);
      setFormData({
        motor_vehicle_product_id: 0,
        park_ids: [],
        entry_type_ids: [],
        age_group_ids: [],
        low_weight: 0,
        high_weight: 0,
        tax_behaviour_id: 0,
        currency_id: 0,
        unit_amount: 0
      });
      setFormErrors({});
    } catch (error) {
      console.error('Error saving pricing:', error);
      
      // Show more specific error message to user
      if (error instanceof Error) {
        alert(`Error saving pricing: ${error.message}`);
      } else {
        alert('An unexpected error occurred while saving pricing. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPricing) return;

    try {
      setDeletingIds(prev => new Set(prev).add(deletingPricing.id));
      
      const { error } = await supabase
        .from('motor_vehicle_products_price')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', deletingPricing.id);

      if (error) throw error;

      // Remove from local state immediately for better UX
      setPricing(prev => prev.filter(p => p.id !== deletingPricing.id));
      
      // Close modal
      setShowDeleteModal(false);
      setDeletingPricing(null);
    } catch (error) {
      console.error('Error deleting pricing:', error);
      // If deletion failed, refresh the data to ensure consistency
      await fetchPricing();
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletingPricing.id);
        return newSet;
      });
    }
  };

  // Filter pricing data based on search query and park filter
  const filteredPricing = useMemo(() => {
    let filtered = pricing;
    
    // Apply park filter
    if (selectedParkFilter !== 'all') {
      filtered = filtered.filter(price => price.park_id === selectedParkFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(price => 
        price.park_name?.toLowerCase().includes(query) ||
        price.vehicle_type_name?.toLowerCase().includes(query) ||
        price.tax_behaviour_name?.toLowerCase().includes(query) ||
        price.currency_name?.toLowerCase().includes(query) ||
        price.weight_range?.toLowerCase().includes(query) ||
        price.unit_amount.toString().includes(query)
      );
    }
    
    return filtered;
  }, [pricing, searchQuery, selectedParkFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPricing.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPricing = filteredPricing.slice(startIndex, endIndex);

  // Update total items when filtered data changes
  useEffect(() => {
    setTotalItems(filteredPricing.length);
  }, [filteredPricing]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);
  const goToNextPage = () => handlePageChange(Math.min(currentPage + 1, totalPages));
  const goToPreviousPage = () => handlePageChange(Math.max(currentPage - 1, 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search pricing..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Park Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="park-filter" className="text-sm font-medium text-gray-700">
              Filter by Park:
            </label>
            <select
              id="park-filter"
              value={selectedParkFilter}
              onChange={(e) => setSelectedParkFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] text-sm"
            >
              <option value="all">All Parks</option>
              {parksData.map((park) => (
                <option key={park.id} value={park.id}>
                  {park.name}
                </option>
              ))}
            </select>
            
            {/* Reset Filter Button */}
            {selectedParkFilter !== 'all' && (
              <Button
                onClick={() => setSelectedParkFilter('all')}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800 border-gray-300"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>
        
        <Button onClick={handleAdd} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
          Add Pricing
        </Button>
      </div>

      {/* Filter Summary */}
      {(selectedParkFilter !== 'all' || searchQuery.trim()) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <span>Filtered Results:</span>
              {selectedParkFilter !== 'all' && (
                <span className="bg-blue-100 px-2 py-1 rounded">
                  Park: {parksData.find(p => p.id === selectedParkFilter)?.name}
                </span>
              )}
              {searchQuery.trim() && (
                <span className="bg-blue-100 px-2 py-1 rounded">
                  Search: "{searchQuery}"
                </span>
              )}
              <span className="text-blue-600">
                Showing {filteredPricing.length} of {pricing.length} results
              </span>
            </div>
            <Button
              onClick={() => {
                setSelectedParkFilter('all');
                onSearchChange?.('');
              }}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Motor Vehicle Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Park</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Weight Range</TableHead>
                <TableHead>Unit Amount</TableHead>
                <TableHead>Tax Behavior</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPricing.length > 0 ? (
                currentPricing.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{price.park_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{price.vehicle_type_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{price.weight_range}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{price.currency_name?.toUpperCase()} {price.unit_amount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{price.tax_behaviour_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        price.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {price.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="h-8 w-8 p-0 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48 bg-gray-800 border-gray-700 shadow-xl rounded-lg py-2"
                        >
                          <div className="px-3 py-2 border-b border-gray-600 mb-2">
                            <span className="text-sm font-medium text-gray-200">Options</span>
                          </div>
                          
                          <DropdownMenuItem 
                            onClick={() => handleEdit(price)}
                            disabled={editingLoading === price.id}
                            className="px-3 py-2 text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer"
                          >
                            {editingLoading === price.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Loading...
                              </div>
                            ) : (
                              <>
                                <Edit className="mr-3 h-4 w-4" />
                                Edit
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-gray-600" />
                          
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(price.id, price.is_active)}
                            disabled={togglingIds.has(price.id)}
                            className="px-3 py-2 text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer"
                          >
                            {price.is_active ? (
                              <>
                                <PowerOff className="mr-3 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="mr-3 h-4 w-4" />
                                Activate
                              </>
                            )}
                            {togglingIds.has(price.id) && "..."}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-gray-600" />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(price)}
                            className="px-3 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 focus:bg-red-900/20 focus:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No pricing found matching your search." : "No pricing found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>

              {/* Pagination info */}
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              </div>

              {/* Pagination navigation */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="px-2 py-1"
                >
                  <span className="sr-only">First page</span>
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-2 py-1"
                >
                  <span className="sr-only">Previous page</span>
                  ‹
                </Button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  <div key={`pagination-${page}-${index}`}>
                    {page === '...' ? (
                      <span className="px-3 py-1 text-gray-500">...</span>
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="px-3 py-1 min-w-[40px]"
                      >
                        {page}
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1"
                >
                  <span className="sr-only">Next page</span>
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1"
                >
                  <span className="sr-only">Last page</span>
                  »
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
          style={{ 
            zIndex: 2147483645,
            isolation: 'isolate',
            transform: 'translateZ(0)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setFormData({
                motor_vehicle_product_id: 0,
                park_ids: [],
                entry_type_ids: [],
                age_group_ids: [],
                low_weight: 0,
                high_weight: 0,
                tax_behaviour_id: 0,
                currency_id: 0,
                unit_amount: 0
              });
              setFormErrors({});
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                id="modal-title"
                className="text-lg font-semibold"
              >
                Add Pricing
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    motor_vehicle_product_id: 0,
                    park_ids: [],
                    entry_type_ids: [],
                    age_group_ids: [],
                    low_weight: 0,
                    high_weight: 0,
                    tax_behaviour_id: 0,
                    currency_id: 0,
                    unit_amount: 0
                  });
                  setFormErrors({});
                }}
                className="hover:bg-gray-100 rounded-full p-2"
                aria-label="Close modal"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {/* Summary of combinations to be created */}
              {formData.park_ids.length > 0 && formData.entry_type_ids.length > 0 && formData.age_group_ids.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <strong>Summary:</strong> This will create pricing for{' '}
                    <strong>{formData.park_ids.length}</strong> park(s) ×{' '}
                    <strong>{formData.entry_type_ids.length}</strong> entry type(s) ×{' '}
                    <strong>{formData.age_group_ids.length}</strong> age group(s) ={' '}
                    <strong>{formData.park_ids.length * formData.entry_type_ids.length * formData.age_group_ids.length}</strong> total pricing records
                  </div>
                </div>
              )}
              
               <div>
                 <label className="block text-sm font-medium mb-1">National Parks</label>
                 <MultiSelectDropdown
                   id="parks-select"
                   label=""
                   value={formData.park_ids.map(String)}
                   onChange={(values) => setFormData({ ...formData, park_ids: values.map(v => Number(v)) })}
                   options={parksData.map(park => ({ 
                     id: park.id, 
                     value: park.id.toString(), 
                     label: park.name 
                   }))}
                   placeholder="Select parks..."
                   className="w-full"
                 />
                 {formErrors.park_ids && (
                   <p className="text-red-500 text-sm mt-1">{formErrors.park_ids}</p>
                 )}
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Entry Types</label>
                 <MultiSelectDropdown
                   id="entry-types-select"
                   label=""
                   value={formData.entry_type_ids.map(String)}
                   onChange={(values) => setFormData({ ...formData, entry_type_ids: values.map(v => Number(v)) })}
                   options={entryTypesData.map(entryType => ({ 
                     id: entryType.id, 
                     value: entryType.id.toString(), 
                     label: entryType.name 
                   }))}
                   placeholder="Select entry type..."
                   className="w-full"
                 />
                 {formErrors.entry_type_ids && (
                   <p className="text-red-500 text-sm mt-1">{formErrors.entry_type_ids}</p>
                 )}
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Age Groups</label>
                 <MultiSelectDropdown
                   id="age-groups-select"
                   label=""
                   value={formData.age_group_ids.map(String)}
                   onChange={(values) => setFormData({ ...formData, age_group_ids: values.map(v => Number(v)) })}
                   options={ageGroups.map(ageGroup => ({ 
                     id: ageGroup.id, 
                     value: ageGroup.id.toString(), 
                     label: ageGroup.age_group_name 
                   }))}
                   placeholder="Select age groups..."
                   className="w-full"
                 />
                 {formErrors.age_group_ids && (
                   <p className="text-red-500 text-sm mt-1">{formErrors.age_group_ids}</p>
                 )}
               </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Low Weight (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.low_weight}
                    onChange={(e) => setFormData({ ...formData, low_weight: parseInt(e.target.value) || 0 })}
                    placeholder="Enter low weight"
                    className={formErrors.low_weight ? "border-red-500" : ""}
                  />
                  {formErrors.low_weight && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.low_weight}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">High Weight (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.high_weight}
                    onChange={(e) => setFormData({ ...formData, high_weight: parseInt(e.target.value) || 0 })}
                    placeholder="Enter high weight"
                    className={formErrors.high_weight ? "border-red-500" : ""}
                />
                  {formErrors.high_weight && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.high_weight}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Behavior</label>
                <select
                  value={formData.tax_behaviour_id}
                  onChange={(e) => setFormData({ ...formData, tax_behaviour_id: Number(e.target.value) })}
                  className={`w-full p-2 border rounded-md ${formErrors.tax_behaviour_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value={0}>Select tax behavior</option>
                  {taxBehaviours.map(tax => (
                    <option key={tax.id} value={tax.id}>{tax.name}</option>
                  ))}
                </select>
                {formErrors.tax_behaviour_id && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.tax_behaviour_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={formData.currency_id}
                  onChange={(e) => setFormData({ ...formData, currency_id: Number(e.target.value) })}
                  className={`w-full p-2 border rounded-md ${formErrors.currency_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value={0}>Select currency</option>
                  {currencies.map(currency => (
                    <option key={currency.id} value={currency.id}>{currency.currency_name}</option>
                  ))}
                </select>
                {formErrors.currency_id && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.currency_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Unit Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_amount}
                  onChange={(e) => setFormData({ ...formData, unit_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter unit amount"
                  className={formErrors.unit_amount ? "border-red-500" : ""}
                />
                {formErrors.unit_amount && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.unit_amount}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Saving..." : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      motor_vehicle_product_id: 0,
                      park_ids: [],
                      entry_type_ids: [],
                      age_group_ids: [],
                      low_weight: 0,
                      high_weight: 0,
                      tax_behaviour_id: 0,
                      currency_id: 0,
                      unit_amount: 0
                    });
                    setFormErrors({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
          style={{ 
            zIndex: 2147483645,
            isolation: 'isolate',
            transform: 'translateZ(0)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditingPricing(null);
              setFormData({
                motor_vehicle_product_id: 0,
                park_ids: [],
                entry_type_ids: [],
                age_group_ids: [],
                low_weight: 0,
                high_weight: 0,
                tax_behaviour_id: 0,
                currency_id: 0,
                unit_amount: 0
              });
              setFormErrors({});
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                id="modal-title"
                className="text-lg font-semibold"
              >
                Edit Pricing
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPricing(null);
                  setFormData({
                    motor_vehicle_product_id: 0,
                    park_ids: [],
                    entry_type_ids: [],
                    age_group_ids: [],
                    low_weight: 0,
                    high_weight: 0,
                    tax_behaviour_id: 0,
                    currency_id: 0,
                    unit_amount: 0
                  });
                  setFormErrors({});
                }}
                className="hover:bg-gray-100 rounded-full p-2"
                aria-label="Close modal"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium mb-1">National Park</label>
                 <select
                   value={formData.park_ids[0] || 0}
                   onChange={(e) => setFormData({ ...formData, park_ids: [Number(e.target.value)] })}
                   className={`w-full p-2 border rounded-md ${formErrors.park_ids ? "border-red-500" : "border-gray-300"}`}
                 >
                   <option value={0}>Select park</option>
                   {parksData.map(park => (
                     <option key={park.id} value={park.id}>{park.name}</option>
                   ))}
                 </select>
                 {formErrors.park_ids && (
                   <p className="text-red-500 text-sm mt-1">{formErrors.park_ids}</p>
                 )}
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Entry Types</label>
                 <MultiSelectDropdown
                   id="entry-types-select"
                   label=""
                   value={formData.entry_type_ids.map(String)}
                   onChange={(values) => setFormData({ ...formData, entry_type_ids: values.map(v => Number(v)) })}
                   options={entryTypesData.map(entryType => ({ 
                     id: entryType.id, 
                     value: entryType.id.toString(), 
                     label: entryType.name 
                   }))}
                   placeholder="Select entry type..."
                   className="w-full"
                 />
                 {formErrors.entry_type_ids && (
                   <p className="text-red-500 text-sm mt-1">{formErrors.entry_type_ids}</p>
                 )}
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Age Groups</label>
                 <MultiSelectDropdown
                   id="age-groups-select"
                   label=""
                   value={formData.age_group_ids.map(String)}
                   onChange={(values) => setFormData({ ...formData, age_group_ids: values.map(v => Number(v)) })}
                   options={ageGroups.map(ageGroup => ({ 
                     id: ageGroup.id, 
                     value: ageGroup.id.toString(), 
                     label: ageGroup.age_group_name 
                   }))}
                   placeholder="Select age groups..."
                   className="w-full"
                 />
                 {formErrors.age_group_ids && (
                   <p className="text-red-500 text-sm mt-1">{formErrors.age_group_ids}</p>
                 )}
               </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Low Weight (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.low_weight}
                    onChange={(e) => setFormData({ ...formData, low_weight: parseInt(e.target.value) || 0 })}
                    placeholder="Enter low weight"
                    className={formErrors.low_weight ? "border-red-500" : ""}
                  />
                  {formErrors.low_weight && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.low_weight}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">High Weight (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.high_weight}
                    onChange={(e) => setFormData({ ...formData, high_weight: parseInt(e.target.value) || 0 })}
                    placeholder="Enter high weight"
                    className={formErrors.high_weight ? "border-red-500" : ""}
                  />
                  {formErrors.high_weight && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.high_weight}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Behavior</label>
                <select
                  value={formData.tax_behaviour_id}
                  onChange={(e) => setFormData({ ...formData, tax_behaviour_id: Number(e.target.value) })}
                  className={`w-full p-2 border rounded-md ${formErrors.tax_behaviour_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value={0}>Select tax behavior</option>
                  {taxBehaviours.map(tax => (
                    <option key={tax.id} value={tax.id}>{tax.name}</option>
                  ))}
                </select>
                {formErrors.tax_behaviour_id && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.tax_behaviour_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={formData.currency_id}
                  onChange={(e) => setFormData({ ...formData, currency_id: Number(e.target.value) })}
                  className={`w-full p-2 border rounded-md ${formErrors.currency_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value={0}>Select currency</option>
                  {currencies.map(currency => (
                    <option key={currency.id} value={currency.id}>{currency.currency_name}</option>
                  ))}
                </select>
                {formErrors.currency_id && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.currency_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Unit Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_amount}
                  onChange={(e) => setFormData({ ...formData, unit_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter unit amount"
                  className={formErrors.unit_amount ? "border-red-500" : ""}
                />
                {formErrors.unit_amount && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.unit_amount}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Saving..." : "Update"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPricing(null);
                    setFormData({
                      motor_vehicle_product_id: 0,
                      park_ids: [],
                      entry_type_ids: [],
                      age_group_ids: [],
                      low_weight: 0,
                      high_weight: 0,
                      tax_behaviour_id: 0,
                      currency_id: 0,
                      unit_amount: 0
                    });
                    setFormErrors({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingPricing && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
          style={{ 
            zIndex: 2147483645,
            isolation: 'isolate',
            transform: 'translateZ(0)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setDeletingPricing(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 
                id="delete-modal-title"
                className="text-lg font-semibold mb-2"
              >
                Delete Pricing
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this pricing record? This action cannot be undone.
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deletingIds.has(deletingPricing.id)}
                  className="flex-1"
                >
                  {deletingIds.has(deletingPricing.id) ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingPricing(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
