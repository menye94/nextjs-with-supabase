"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, AlertTriangle, Plus, Download, Search, Filter, Utensils, Loader2 } from "lucide-react";

interface HotelMealPlansTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface HotelMealPlan {
  id: number;
  name: string;
  meal_plan_abbr: string | null;
}

export function HotelMealPlansTable({ searchQuery, onSearchChange }: HotelMealPlansTableProps) {
  const [mealPlans, setMealPlans] = useState<HotelMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<HotelMealPlan | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealPlanToDelete, setMealPlanToDelete] = useState<HotelMealPlan | null>(null);
  
  // Form states
  const [mealPlanName, setMealPlanName] = useState("");
  const [mealPlanAbbr, setMealPlanAbbr] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchMealPlans();
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

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotel_meal_plans')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching meal plans:', error);
        return;
      }

      setMealPlans(data || []);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Meal Plan Name',
      sortable: true,
      render: (value: string, row: HotelMealPlan) => (
        <div className="flex items-center">
          <Utensils className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'meal_plan_abbr',
      label: 'Abbreviation',
      sortable: true,
      render: (value: string | null) => (
        <span className="text-gray-600">
          {value ? value.toUpperCase() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: HotelMealPlan) => (
        <div className="relative" ref={(el) => { menuRefs.current[row.id] = el; }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
          
          {openMenuId === row.id && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
    setEditingMealPlan(null);
    setMealPlanName("");
    setMealPlanAbbr("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (mealPlan: HotelMealPlan) => {
    setEditingMealPlan(mealPlan);
    setMealPlanName(mealPlan.name);
    setMealPlanAbbr(mealPlan.meal_plan_abbr || "");
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (mealPlan: HotelMealPlan) => {
    setMealPlanToDelete(mealPlan);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const performDelete = async (mealPlan: HotelMealPlan) => {
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('hotel_meal_plans')
        .delete()
        .eq('id', mealPlan.id);

      if (error) {
        console.error('Error deleting meal plan:', error);
        return;
      }

      fetchMealPlans();
      setShowDeleteModal(false);
      setMealPlanToDelete(null);
    } catch (error) {
      console.error('Error deleting meal plan:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!mealPlanName.trim()) {
      setFormError("Meal plan name is required");
      setFormLoading(false);
      return;
    }

    try {
      const mealPlanData = {
        name: mealPlanName.trim(),
        meal_plan_abbr: mealPlanAbbr.trim() || null,
      };

      let result;
      if (editingMealPlan) {
        // Update existing meal plan
        result = await supabase
          .from('hotel_meal_plans')
          .update(mealPlanData)
          .eq('id', editingMealPlan.id)
          .select();
      } else {
        // Create new meal plan
        result = await supabase
          .from('hotel_meal_plans')
          .insert(mealPlanData)
          .select();
      }

      if (result.error) {
        console.error('Error saving meal plan:', result.error);
        
        if (result.error.code === '23505') {
          setFormError('A meal plan with this name already exists.');
        } else {
          setFormError(`Error saving meal plan: ${result.error.message}`);
        }
      } else {
        console.log('Meal plan saved successfully:', result.data);
        fetchMealPlans();
        setIsModalOpen(false);
        setEditingMealPlan(null);
      }
    } catch (error) {
      console.error('Error saving meal plan:', error);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMealPlan(null);
    setMealPlanName("");
    setMealPlanAbbr("");
    setFormError("");
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      if (action === 'delete') {
        for (const id of selectedIds) {
          await supabase.from('hotel_meal_plans').delete().eq('id', parseInt(id));
        }
        fetchMealPlans();
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  return (
    <>
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Hotel Meal Plans</h2>
            <p className="text-sm text-gray-500 mt-1">Manage hotel meal plans and their configurations</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New
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
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search for meal plans..."
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                }
              }}
              className="pl-10 w-96 bg-white text-gray-900 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] placeholder-gray-500"
            />
          </div>

          {/* Filters Button */}
          <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading meal plans...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the meal plan data.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={mealPlans}
          searchQuery={searchQuery}
          searchFields={['name', 'meal_plan_abbr']}
          onBulkAction={handleBulkAction}
          bulkActions={[
            { label: 'Delete', value: 'delete' },
          ]}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMealPlan ? 'Edit Hotel Meal Plan' : 'Add New Hotel Meal Plan'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Meal Plan Name */}
              <div>
                <Label htmlFor="mealPlanName" className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Plan Name *
                </Label>
                <Input
                  id="mealPlanName"
                  type="text"
                  value={mealPlanName}
                  onChange={(e) => setMealPlanName(e.target.value)}
                  placeholder="Enter meal plan name (e.g., Bed & Breakfast, Half Board, Full Board)"
                  className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
                  required
                />
              </div>

              {/* Meal Plan Abbreviation */}
              <div>
                <Label htmlFor="mealPlanAbbr" className="block text-sm font-medium text-gray-700 mb-1">
                  Abbreviation
                </Label>
                <Input
                  id="mealPlanAbbr"
                  type="text"
                  value={mealPlanAbbr}
                  onChange={(e) => setMealPlanAbbr(e.target.value)}
                  placeholder="Enter abbreviation (e.g., BB, HB, FB)"
                  className="w-full text-gray-900 border-gray-300 focus:border-[var(--theme-green)] focus:ring-[var(--theme-green)]"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading || !!formError}
                  className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : (editingMealPlan ? 'Update Meal Plan' : 'Add Meal Plan')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && mealPlanToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Hotel Meal Plan"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Delete Hotel Meal Plan</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{mealPlanToDelete.name}"? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => performDelete(mealPlanToDelete)}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Meal Plan'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Empty State */}
      {mealPlans.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Utensils className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No meal plans found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No meal plans match your search for "${searchQuery}". Try adjusting your search terms.`
              : "Get started by adding your first hotel meal plan to the system."
            }
          </p>
          <div className="mt-6">
            <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
      )}
    </>
  );
} 