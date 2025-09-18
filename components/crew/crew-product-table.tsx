"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MoreHorizontal, AlertTriangle, Plus, Download, Search, Filter, Users, Loader2, DollarSign } from "lucide-react";

interface CrewProductTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface CrewProduct {
  id: number;
  category_id: number;
  currency_id: number;
  tax_behavior: number;
  price: number;
  pricing_type_id: number;
  created_at?: string;
  updated_at?: string;
}

interface CrewProductWithRelations extends CrewProduct {
  category?: {
    id: number;
    name: string;
  };
  currency?: {
    id: number;
    currency_name: string;
  };
  tax_behavior_info?: {
    id: number;
    name: string;
  };
  pricing_type?: {
    id: number;
    pricing_type_name: string;
  };
}

export function CrewProductTable({ searchQuery, onSearchChange }: CrewProductTableProps) {
  const [products, setProducts] = useState<CrewProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CrewProductWithRelations | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<CrewProductWithRelations | null>(null);
  
  // Form states
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState("");
  const [selectedTaxBehaviorId, setSelectedTaxBehaviorId] = useState("");
  const [selectedPricingTypeId, setSelectedPricingTypeId] = useState("");
  const [price, setPrice] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Dropdown data
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [currencies, setCurrencies] = useState<{ id: number; currency_name: string }[]>([]);
  const [taxBehaviors, setTaxBehaviors] = useState<{ id: number; name: string }[]>([]);
  const [pricingTypes, setPricingTypes] = useState<{ id: number; pricing_type_name: string }[]>([]);
  
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
    fetchDropdownData();
  }, []);

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

  const fetchDropdownData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('crew_category')
        .select('id, name')
        .order('name');
      
      if (categoriesData) setCategories(categoriesData);

      // Fetch currencies
      const { data: currenciesData } = await supabase
        .from('currency')
        .select('id, currency_name')
        .order('currency_name');
      
      if (currenciesData) setCurrencies(currenciesData);

      // Fetch tax behaviors
      const { data: taxBehaviorsData } = await supabase
        .from('tax_behaviour')
        .select('id, name')
        .order('name');
      
      if (taxBehaviorsData) setTaxBehaviors(taxBehaviorsData);

      // Fetch pricing types
      const { data: pricingTypesData } = await supabase
        .from('pricing_type')
        .select('id, pricing_type_name')
        .order('pricing_type_name');
      
      if (pricingTypesData) setPricingTypes(pricingTypesData);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crew_product')
        .select(`
          *,
          category:crew_category(id, name),
          currency:currency(id, currency_name),
          tax_behavior_info:tax_behaviour(id, name),
          pricing_type:pricing_type(id, pricing_type_name)
        `)
        .order('id');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: any, row: CrewProductWithRelations) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{row.category?.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, row: CrewProductWithRelations) => (
        <div className="flex items-center">
          <span className="font-medium text-gray-900">
            {(row.currency?.currency_name || 'N/A').toUpperCase()} {row.price.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: 'tax_behavior',
      label: 'Tax Behavior',
      sortable: true,
      render: (value: any, row: CrewProductWithRelations) => (
        <Badge variant="outline">{row.tax_behavior_info?.name || 'N/A'}</Badge>
      ),
    },
    {
      key: 'pricing_type',
      label: 'Pricing Type',
      sortable: true,
      render: (value: any, row: CrewProductWithRelations) => (
        <Badge variant="outline">{row.pricing_type?.pricing_type_name || 'N/A'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: CrewProductWithRelations) => (
        <div className="relative" ref={(el) => { 
          if (el) {
            menuRefs.current[row.id] = el;
          }
        }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {openMenuId === row.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

  const handleEdit = (product: CrewProductWithRelations) => {
    setEditingProduct(product);
    setSelectedCategoryId(product.category_id.toString());
    setSelectedCurrencyId(product.currency_id.toString());
    setSelectedTaxBehaviorId(product.tax_behavior.toString());
    setSelectedPricingTypeId(product.pricing_type_id.toString());
    setPrice(product.price.toString());
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (product: CrewProductWithRelations) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId || !selectedCurrencyId || !selectedTaxBehaviorId || !selectedPricingTypeId || !price) {
      setFormError("All fields are required");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setFormError("Price must be a positive number");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const productData = {
        category_id: parseInt(selectedCategoryId),
        currency_id: parseInt(selectedCurrencyId),
        tax_behavior: parseInt(selectedTaxBehaviorId),
        price: priceValue,
        pricing_type_id: parseInt(selectedPricingTypeId),
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('crew_product')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('crew_product')
          .insert(productData);

        if (error) throw error;
      }

      // Reset form and close modal
      resetForm();
      setIsModalOpen(false);
      
      // Refresh data
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setFormError("Failed to save product. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCategoryId("");
    setSelectedCurrencyId("");
    setSelectedTaxBehaviorId("");
    setSelectedPricingTypeId("");
    setPrice("");
    setEditingProduct(null);
    setFormError("");
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('crew_product')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(product =>
    product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.currency?.currency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.tax_behavior_info?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.pricing_type?.pricing_type_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Crew Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage crew product pricing and configurations
          </p>
        </div>
        <Button onClick={openCreateModal} className="btn-pri">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        searchQuery={searchQuery}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Crew Product" : "Add Crew Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              id="category"
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <Label htmlFor="currency">Currency *</Label>
            <Select
              id="currency"
              value={selectedCurrencyId}
              onValueChange={setSelectedCurrencyId}
              required
            >
              <option value="">Select a currency</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.currency_name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="taxBehavior">Tax Behavior *</Label>
            <Select
              id="taxBehavior"
              value={selectedTaxBehaviorId}
              onValueChange={setSelectedTaxBehaviorId}
              required
            >
              <option value="">Select tax behavior</option>
              {taxBehaviors.map((taxBehavior) => (
                <option key={taxBehavior.id} value={taxBehavior.id}>
                  {taxBehavior.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="pricingType">Pricing Type *</Label>
            <Select
              id="pricingType"
              value={selectedPricingTypeId}
              onValueChange={setSelectedPricingTypeId}
              required
            >
              <option value="">Select pricing type</option>
              {pricingTypes.map((pricingType) => (
                <option key={pricingType.id} value={pricingType.id}>
                  {pricingType.pricing_type_name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {formError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {formError}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-pri" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingProduct ? "Update Product" : "Create Product"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Crew Product"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently delete the product "{productToDelete?.category?.name} - {productToDelete?.price}". 
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
