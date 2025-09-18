"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronDown, Check, Search, Plus, Download, Edit, Trash2 } from "lucide-react";

interface AgeGroup {
  id: number;
  age_group_name: string;
  min_age: number;
  max_age: number;
}

interface AgeGroupsTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

export function AgeGroupsTable({ searchQuery, onSearchChange }: AgeGroupsTableProps) {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Form states
  const [ageGroupName, setAgeGroupName] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchAgeGroups();
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

  const fetchAgeGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('age_group')
        .select('*')
        .order('min_age');

      if (error) {
        console.error('Error fetching age groups:', error);
        return;
      }

      setAgeGroups(data || []);
    } catch (error) {
      console.error('Error fetching age groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingAgeGroup(null);
    setAgeGroupName("");
    setMinAge("");
    setMaxAge("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (ageGroup: AgeGroup) => {
    setEditingAgeGroup(ageGroup);
    setAgeGroupName(ageGroup.age_group_name);
    setMinAge(ageGroup.min_age.toString());
    setMaxAge(ageGroup.max_age.toString());
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (ageGroup: AgeGroup) => {
    if (window.confirm(`Are you sure you want to delete the age group "${ageGroup.age_group_name}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('age_group')
          .delete()
          .eq('id', ageGroup.id);

        if (error) {
          console.error('Error deleting age group:', error);
          return;
        }

        fetchAgeGroups();
        setOpenMenuId(null);
      } catch (error) {
        console.error('Error deleting age group:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgeGroup(null);
    setAgeGroupName("");
    setMinAge("");
    setMaxAge("");
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!ageGroupName.trim() || !minAge || !maxAge) {
      setFormError("Age group name, minimum age, and maximum age are required");
      return;
    }

    const minAgeValue = parseInt(minAge);
    const maxAgeValue = parseInt(maxAge);

    if (isNaN(minAgeValue) || isNaN(maxAgeValue)) {
      setFormError("Please enter valid numbers for ages");
      return;
    }

    if (minAgeValue < 0 || maxAgeValue < 0) {
      setFormError("Ages cannot be negative");
      return;
    }

    if (minAgeValue > maxAgeValue) {
      setFormError("Minimum age cannot be greater than maximum age");
      return;
    }

    // Check for gaps in age ranges (optional validation)
    const sortedAgeGroups = [...ageGroups].sort((a, b) => a.min_age - b.min_age);
    let hasGaps = false;
    let gapInfo = "";
    
    if (sortedAgeGroups.length > 0) {
      // Check if there are gaps in existing ranges
      for (let i = 0; i < sortedAgeGroups.length - 1; i++) {
        const current = sortedAgeGroups[i];
        const next = sortedAgeGroups[i + 1];
        
        if (current.max_age + 1 < next.min_age) {
          hasGaps = true;
          gapInfo = `Gap detected between ${current.max_age + 1} and ${next.min_age - 1}`;
          break;
        }
      }
    }

    // Check for overlapping age ranges with same name only
    const hasDuplicateName = ageGroups.some(existing => {
      if (editingAgeGroup && existing.id === editingAgeGroup.id) return false;
      
      // Only block if the age group name is exactly the same AND there's overlap
      if (existing.age_group_name.toLowerCase().trim() === ageGroupName.toLowerCase().trim()) {
        const newRange = { min: minAgeValue, max: maxAgeValue };
        const existingRange = { min: existing.min_age, max: existing.max_age };
        
        // Check for actual overlap
        const hasActualOverlap = (
          (newRange.min < existingRange.max && newRange.max > existingRange.min) ||
          (existingRange.min < newRange.max && existingRange.max > newRange.min)
        );
        
        return hasActualOverlap;
      }
      
      return false;
    });

    if (hasDuplicateName) {
      setFormError("An age group with the same name already exists for this age range. Please use a different name or adjust the age range.");
      return;
    }

         setFormLoading(true);
     setFormError("");

     // Debug: Log the data being sent
     const ageGroupData = {
       age_group_name: ageGroupName.trim(),
       min_age: minAgeValue,
       max_age: maxAgeValue
     };
     console.log('Attempting to save age group data:', ageGroupData);
     
     // Validate data types
     if (typeof ageGroupData.min_age !== 'number' || typeof ageGroupData.max_age !== 'number') {
       console.error('Invalid data types:', {
         min_age: ageGroupData.min_age,
         max_age: ageGroupData.max_age,
         min_age_type: typeof ageGroupData.min_age,
         max_age_type: typeof ageGroupData.max_age
       });
       setFormError('Invalid age values - please check your input');
       return;
     }

            try {
         if (editingAgeGroup) {
           // Update existing age group
           console.log('Updating age group with ID:', editingAgeGroup.id);
           const { data, error } = await supabase
             .from('age_group')
             .update(ageGroupData)
             .eq('id', editingAgeGroup.id)
             .select();

           if (error) {
             console.error('Error updating age group:', error);
             console.error('Error details:', {
               message: error.message,
               details: error.details,
               hint: error.hint,
               code: error.code
             });
             setFormError(`Error updating age group: ${error.message || 'Unknown error'}`);
             return;
           }

           console.log('Successfully updated age group:', data);
         } else {
           // Create new age group
           console.log('Creating new age group...');
           const { data, error } = await supabase
             .from('age_group')
             .insert(ageGroupData)
             .select();

           if (error) {
             console.error('Error creating age group:', error);
             console.error('Error details:', {
               message: error.message,
               details: error.details,
               hint: error.hint,
               code: error.code
             });
             setFormError(`Error creating age group: ${error.message || 'Unknown error'}`);
             return;
           }

           console.log('Successfully created age group:', data);
         }

         await fetchAgeGroups();
         handleCloseModal();
       } catch (error) {
         console.error('Unexpected error in handleSubmit:', error);
         console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
         setFormError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
       } finally {
         setFormLoading(false);
       }
  };

  const columns = [
    {
      key: 'age_group_name',
      label: 'Age Group Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">
          {value}
        </span>
      ),
    },
    {
      key: 'age_range',
      label: 'Age Range',
      sortable: true,
      render: (value: any, row: AgeGroup) => {
        // Check if this age range overlaps with others
        const hasOverlap = ageGroups.some(other => 
          other.id !== row.id && 
          other.age_group_name.toLowerCase().trim() !== row.age_group_name.toLowerCase().trim() &&
          (
            (row.min_age < other.max_age && row.max_age > other.min_age) ||
            (other.min_age < row.max_age && other.max_age > row.min_age)
          )
        );
        
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {row.min_age === row.max_age 
                ? `${row.min_age} years`
                : `${row.min_age} - ${row.max_age} years`
              }
            </span>
            {hasOverlap && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Overlaps
              </span>
            )}
          </div>
        );
      },
    },

    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: AgeGroup) => (
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
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleDelete(row)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
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
        <div className="text-gray-500">Loading age groups...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Age Groups</h2>
            <p className="text-sm text-gray-500 mt-1">Manage age group definitions for pricing and products</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Age Group
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search age groups..."
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                }
              }}
              className="pl-10 w-96 text-gray-900 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
            />
          </div>
          
          {/* Age Range Info */}
          {ageGroups.length > 0 && (
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Current Coverage:</span>{" "}
                {(() => {
                  const sorted = [...ageGroups].sort((a, b) => a.min_age - b.min_age);
                  const ranges = sorted.map(ag => 
                    ag.min_age === ag.max_age 
                      ? `${ag.min_age}` 
                      : `${ag.min_age}-${ag.max_age}`
                  );
                  return ranges.join(", ");
                })()}
              </div>
              
              {/* Show overlapping ranges info */}
              {(() => {
                const overlappingGroups = ageGroups.filter(ag => 
                  ageGroups.some(other => 
                    other.id !== ag.id && 
                    other.age_group_name.toLowerCase().trim() !== ag.age_group_name.toLowerCase().trim() &&
                    (
                      (ag.min_age < other.max_age && ag.max_age > other.min_age) ||
                      (other.min_age < ag.max_age && other.max_age > ag.min_age)
                    )
                  )
                );
                
                if (overlappingGroups.length > 0) {
                  return (
                    <div className="text-xs text-blue-600">
                      <span className="font-medium">Overlapping Ranges:</span>{" "}
                      {overlappingGroups.map(ag => ag.age_group_name).join(", ")}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={ageGroups}
        searchQuery={searchQuery}
        searchFields={['age_group_name']}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAgeGroup ? "Edit Age Group" : "Add New Age Group"}
      >
        <div className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            {/* Age Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Group Name *
              </label>
              <input
                type="text"
                value={ageGroupName}
                onChange={(e) => setAgeGroupName(e.target.value)}
                placeholder="e.g., Children, Adults, Seniors"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
              />
            </div>

            {/* Age Range */}
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Age *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Age *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                  />
                </div>
              </div>
              
              {/* Helpful hint */}
              <div className="mt-2 text-xs text-gray-500">
                💡 <strong>Tip:</strong> Overlapping age ranges are allowed as long as they have different names. 
                This is useful for different pricing tiers or categories (e.g., "Children Standard" 0-12 and "Children Premium" 0-12).
              </div>
            </div>



            {/* Error Message */}
            {formError && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
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
              {formLoading ? (editingAgeGroup ? "Updating..." : "Adding...") : (editingAgeGroup ? "Update" : "Add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
