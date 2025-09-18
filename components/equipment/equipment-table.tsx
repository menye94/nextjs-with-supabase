'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Plus, Edit, Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { capitalizeWords } from '@/lib/utils/string-utils';

interface Equipment {
  id: number;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_id: number;
  owner_id: string; // UUID
  currency_id: number;
  pricing_type_id: number;
}

interface EnrichedEquipment extends Equipment {
  category_name: string;
  company_name: string;
  currency_code: string;
  currency_symbol: string;
  pricing_type_name: string;
  equipment_owner_name: string;
}

interface EquipmentCategory {
  id: number;
  name: string;
}

interface EquipmentCompany {
  id: number; // Integer ID from equipment_company table
  name: string;
  owner_id: string; // UUID from equipment_company table
}

interface Currency {
  id: number;
  name: string;
  symbol: string;
}

interface PricingType {
  id: number;
  pricing_type_name: string;
}

export default function EquipmentTable() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [enrichedEquipment, setEnrichedEquipment] = useState<EnrichedEquipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [equipmentCompanies, setEquipmentCompanies] = useState<EquipmentCompany[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [pricingTypes, setPricingTypes] = useState<PricingType[]>([]);
     const [loading, setLoading] = useState(true);
   const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EnrichedEquipment | null>(null);
     const [formData, setFormData] = useState({
     name: '',
     category_id: 0,
     owner_id: '', // Changed back to string for UUID
     currency_id: 0,
     price: 0,
     pricing_type_id: 0
   });
   const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

     useEffect(() => {
     fetchData();
   }, []);

   // Separate useEffect to handle data enrichment when all data is loaded
   useEffect(() => {
     console.log('useEffect triggered with:', {
       equipmentLength: equipment.length,
       categoriesLength: categories.length,
       equipmentCompaniesLength: equipmentCompanies.length,
       currenciesLength: currencies.length,
       pricingTypesLength: pricingTypes.length
     });
     
     if (equipment.length > 0) {
       setEnrichmentLoading(true);
       
       const enrichedData = equipment.map(equip => {
         const category = categories.find(cat => cat.id === equip.category_id);
         const company = equipmentCompanies.find(comp => comp.owner_id === equip.owner_id);
         const currency = currencies.find(curr => curr.id === equip.currency_id);
         const pricingType = pricingTypes.find(pt => pt.id === equip.pricing_type_id);

         return {
           ...equip,
           category_name: category?.name || 'Unknown Category',
           company_name: company?.name || 'Unknown Company',
           currency_code: currency?.name || 'Unknown',
           currency_symbol: currency?.symbol || '',
           pricing_type_name: pricingType?.pricing_type_name || 'Unknown',
           equipment_owner_name: company?.name || 'Unknown Company'
         } as EnrichedEquipment;
       });

       console.log('Enriched data from useEffect:', enrichedData);
       setEnrichedEquipment(enrichedData);
       setEnrichmentLoading(false);
     } else {
       console.log('No equipment data available for enrichment');
       setEnrichedEquipment([]);
     }
   }, [equipment, categories, equipmentCompanies, currencies, pricingTypes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
             // Fetch equipment data directly from the equipments table
       const { data: equipmentData, error: equipmentError } = await supabase
         .from('equipments')
         .select('*')
         .order('created_at', { ascending: false });

       if (equipmentError) {
         console.error('Equipment error:', equipmentError);
         throw equipmentError;
       }

       // Debug: Log the equipment data structure
       console.log('Equipment data:', equipmentData);
       if (equipmentData && equipmentData.length > 0) {
         console.log('First equipment item keys:', Object.keys(equipmentData[0]));
         console.log('First equipment item:', equipmentData[0]);
       }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('equipment_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw categoriesError;
      }

             // Fetch equipment companies with their owner_id (UUID)
       const { data: equipmentCompaniesData, error: equipmentCompaniesError } = await supabase
         .from('equipment_company')
         .select('id, name, owner_id')
         .order('name');

      if (equipmentCompaniesError) {
        console.error('Equipment companies error:', equipmentCompaniesError);
        throw equipmentCompaniesError;
      }

      // Fetch currencies
      const { data: currenciesData, error: currenciesError } = await supabase
        .from('currency')
        .select('*')
        .order('id');

      if (currenciesError) {
        console.error('Currencies error:', currenciesError);
        throw currenciesError;
      }

      // Fetch pricing types
      const { data: pricingTypesData, error: pricingTypesError } = await supabase
        .from('pricing_type')
        .select('id, pricing_type_name')
        .order('pricing_type_name');

      if (pricingTypesError) {
        console.error('Pricing types error:', pricingTypesError);
        throw pricingTypesError;
      }

             

             // Set the base data - enrichment will be handled by useEffect
       setEquipment(equipmentData || []);
       setCategories(categoriesData || []);
       setEquipmentCompanies(equipmentCompaniesData || []);
       setCurrencies(currenciesData || []);
       setPricingTypes(pricingTypesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
             // Set empty arrays on error to prevent undefined issues
       setEquipment([]);
       setCategories([]);
       setEquipmentCompanies([]);
       setCurrencies([]);
       setPricingTypes([]);
    } finally {
      setLoading(false);
    }
  };

     const filteredEquipment = (enrichedEquipment || []).filter(item => {
     // Ensure item has all required properties before filtering
     if (!item || typeof item !== 'object') return false;
     
     const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
           const matchesCategory = !selectedCategory || item.category_id === parseInt(selectedCategory);
     const matchesCompany = !selectedCompany || item.owner_id === selectedCompany;
     
     return matchesSearch && matchesCategory && matchesCompany;
   });

  const handleAddNew = () => {
    setEditingEquipment(null);
    setFormData({
      name: '',
      category_id: 0,
      owner_id: '', // Changed back to string for UUID
      currency_id: 0,
      price: 0,
      pricing_type_id: 0
    });
    setShowModal(true);
  };

     const handleEdit = (item: EnrichedEquipment) => {
     setEditingEquipment(item);
     
     setFormData({
       name: item.name || '',
       category_id: item.category_id || 0,
       owner_id: item.owner_id || '', // Use the UUID from equipment
       currency_id: item.currency_id || 0,
       price: item.price || 0,
       pricing_type_id: item.pricing_type_id || 0
     });
     setShowModal(true);
   };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    try {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

     const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!formData.name || !formData.category_id || !formData.owner_id || 
         !formData.currency_id || !formData.price || !formData.pricing_type_id) {
       alert('Please fill in all required fields');
       return;
     }

     try {
       setIsSubmitting(true);
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('User not authenticated');

       const equipmentData = {
         name: formData.name,
         category_id: formData.category_id,
         owner_id: formData.owner_id,
         currency_id: formData.currency_id,
         price: formData.price,
         pricing_type_id: formData.pricing_type_id
       };

       if (editingEquipment) {
         const { error } = await supabase
           .from('equipments')
           .update(equipmentData)
           .eq('id', editingEquipment.id);

         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('equipments')
           .insert(equipmentData);

         if (error) throw error;
       }

       setShowModal(false);
       await fetchData();
     } catch (error) {
       console.error('Error saving equipment:', error);
       alert('Error saving equipment. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
   };

  const formatCurrency = (price: number, currencyCode: string, currencySymbol: string) => {
    return `${currencySymbol}${price.toLocaleString()}`;
  };

     const columns = [
     {
       key: 'name',
       label: 'Equipment Name',
       render: (value: any, row: EnrichedEquipment) => (
         <div className="font-medium">{capitalizeWords(row.name)}</div>
       )
     },
          {
        key: 'category',
        label: 'Category',
        render: (value: any, row: EnrichedEquipment) => (
          <Badge variant="secondary">{row.category_name || 'Unknown Category'}</Badge>
        )
      },
          {
        key: 'company',
        label: 'Owner Company',
        render: (value: any, row: EnrichedEquipment) => (
          <div>{capitalizeWords(row.equipment_owner_name || row.company_name || 'Unknown Company')}</div>
        )
      },
          {
        key: 'price',
        label: 'Price',
        render: (value: any, row: EnrichedEquipment) => (
          <div className="font-medium">
            {formatCurrency(row.price, row.currency_code || '', row.currency_symbol || '')}
            <span className="text-sm text-gray-500 ml-1">/{row.pricing_type_name || 'Unknown'}</span>
          </div>
        )
      },
     {
       key: 'status',
       label: 'Status',
       render: (value: any, row: EnrichedEquipment) => (
         <Badge variant={row.is_active ? 'default' : 'destructive'}>
           {row.is_active ? 'Active' : 'Inactive'}
         </Badge>
       )
     },
     {
       key: 'actions',
       label: 'Actions',
       render: (value: any, row: EnrichedEquipment) => (
         <div className="flex gap-2">
           <Button
             size="sm"
             variant="outline"
             onClick={() => handleEdit(row)}
           >
             <Edit className="h-4 w-4" />
           </Button>
           <Button
             size="sm"
             variant="destructive"
             onClick={() => handleDelete(row.id)}
           >
             <Trash2 className="h-4 w-4" />
           </Button>
         </div>
       )
     }
   ];

     if (loading || enrichmentLoading) {
     return (
       <div className="flex items-center justify-center h-64">
         <div className="text-lg">Loading equipment...</div>
       </div>
     );
   }

   // Safety check to ensure we have enriched data
   if (!enrichedEquipment || enrichedEquipment.length === 0) {
     return (
       <div className="space-y-6 bg-white">
         <div className="flex justify-between items-center bg-white">
           <h2 className="text-2xl font-bold text-gray-900">Equipments</h2>
           <Button onClick={handleAddNew}>
             <Plus className="h-4 w-4 mr-2" />
             Add Equipment
           </Button>
         </div>
         <div className="flex items-center justify-center h-64">
           <div className="text-lg">No equipment data available</div>
         </div>
       </div>
     );
   }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Equipments</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search equipment, category, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>
        
                                  <SearchableDropdown
            id="category-filter"
            label="Category Filter"
            options={categories.map(cat => ({ id: cat.id, value: cat.id, label: cat.name }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Filter by category"
            className="w-48"
          />
        
                                  <SearchableDropdown
            id="company-filter"
            label="Company Filter"
            options={equipmentCompanies.map(comp => ({ id: comp.id, value: comp.owner_id, label: comp.name }))}
            value={selectedCompany}
            onChange={setSelectedCompany}
            placeholder="Filter by equipment company"
            className="w-48"
          />
        
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm('');
            setSelectedCategory('');
            setSelectedCompany('');
          }}
        >
          Clear Filters
        </Button>
      </div>

             {/* Equipment Table */}
       {enrichedEquipment && enrichedEquipment.length > 0 && filteredEquipment && filteredEquipment.length > 0 ? (
                 <DataTable
          data={filteredEquipment}
          columns={columns}
          searchQuery={searchTerm}
          searchFields={['name', 'category_name', 'company_name']}
          showBulkSelection={false}
          itemsPerPage={10}
          showPagination={true}
        />
       ) : (
         <div className="flex items-center justify-center h-64">
           <div className="text-lg">
             {enrichedEquipment && enrichedEquipment.length > 0 
               ? 'No equipment matches your filters' 
               : 'No equipment data available'}
           </div>
         </div>
       )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Equipment Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter equipment name"
              required
            />
          </div>

                     <div>
             <Label htmlFor="category">Category *</Label>
                           <SearchableDropdown
                id="form-category"
                label="Category"
                options={categories.map(cat => ({ id: cat.id, value: cat.id, label: cat.name }))}
                value={String(formData.category_id || 0)}
                onChange={(value) => setFormData({ ...formData, category_id: parseInt(value) || 0 })}
                placeholder="Select category"
              />
             {categories.length === 0 && (
               <p className="text-sm text-red-500 mt-1">No categories available</p>
             )}
           </div>

                     <div>
             <Label htmlFor="owner">Equipment Company *</Label>
                                          <SearchableDropdown
                 id="form-owner"
                 label="Equipment Company"
                 options={equipmentCompanies.map(comp => ({ id: comp.id, value: comp.owner_id, label: comp.name }))}
                 value={formData.owner_id}
                 onChange={(value) => setFormData({ ...formData, owner_id: value || '' })}
                 placeholder="Select equipment company"
               />
             {equipmentCompanies.length === 0 && (
               <p className="text-sm text-red-500 mt-1">No equipment companies available</p>
             )}
           </div>

                     <div className="grid grid-cols-2 gap-4">
             <div>
               <Label htmlFor="currency">Currency *</Label>
               <SearchableDropdown
                 id="form-currency"
                 label="Currency"
                 options={currencies.map(curr => {
                   const currencyName = curr.name || `Currency ${curr.id}`;
                   const currencySymbol = curr.symbol || '';
                   
                   return {
                     id: curr.id,
                     value: curr.id,
                     label: currencySymbol ? `${currencyName} (${currencySymbol})` : currencyName
                   };
                 })}
                 value={String(formData.currency_id || 0)}
                 onChange={(value) => setFormData({ ...formData, currency_id: parseInt(value) || 0 })}
                 placeholder="Select currency"
               />
               {currencies.length === 0 && (
                 <p className="text-sm text-red-500 mt-1">No currencies available</p>
               )}
             </div>

             <div>
               <Label htmlFor="pricing_type">Pricing Type *</Label>
               <SearchableDropdown
                 id="form-pricing-type"
                 label="Pricing Type"
                 options={pricingTypes.map(pt => ({ id: pt.id, value: pt.id, label: pt.pricing_type_name }))}
                 value={String(formData.pricing_type_id || 0)}
                 onChange={(value) => setFormData({ ...formData, pricing_type_id: parseInt(value) || 0 })}
                 placeholder="Select pricing type"
               />
               {pricingTypes.length === 0 && (
                 <p className="text-sm text-red-500 mt-1">No pricing types available</p>
               )}
             </div>
           </div>

          <div>
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="Enter price"
              required
            />
          </div>

                     <div className="flex justify-end gap-2 pt-4">
             <Button
               type="button"
               variant="outline"
               onClick={() => setShowModal(false)}
               disabled={isSubmitting}
             >
               Cancel
             </Button>
             <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   {editingEquipment ? 'Updating...' : 'Creating...'}
                 </>
               ) : (
                 editingEquipment ? 'Update Equipment' : 'Add Equipment'
               )}
             </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
} 