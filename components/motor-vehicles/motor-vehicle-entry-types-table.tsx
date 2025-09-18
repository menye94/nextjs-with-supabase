"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { MoreHorizontal, Plus, Search, Power, PowerOff, Edit, Trash2 } from "lucide-react";

interface MotorVehicleEntryTypesTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

type MotorVehicleEntryType = {
  id: number;
  name: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export function MotorVehicleEntryTypesTable({ searchQuery, onSearchChange }: MotorVehicleEntryTypesTableProps) {
  const [entryTypes, setEntryTypes] = useState<MotorVehicleEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [supabase] = useState(() => createClient());

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEntryType, setEditingEntryType] = useState<MotorVehicleEntryType | null>(null);
  const [deletingEntryType, setDeletingEntryType] = useState<MotorVehicleEntryType | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: ""
  });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntryTypes();
  }, []);

  const fetchEntryTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('motor_vehicle_entry_type')
        .select('*')
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      setEntryTypes(data || []);
    } catch (error) {
      console.error('Error fetching entry types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      setTogglingIds(prev => new Set(prev).add(id));
      
      const { error } = await supabase
        .from('motor_vehicle_entry_type')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state immediately for better UX
      setEntryTypes(prev => 
        prev.map(et => 
          et.id === id ? { ...et, is_active: !currentStatus } : et
        )
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      // If toggle failed, refresh the data to ensure consistency
      await fetchEntryTypes();
    } finally {
      setTogglingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleAdd = () => {
    setFormData({ name: "" });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEdit = (entryType: MotorVehicleEntryType) => {
    setEditingEntryType(entryType);
    setFormData({ name: entryType.name });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDelete = (entryType: MotorVehicleEntryType) => {
    setDeletingEntryType(entryType);
    setShowDeleteModal(true);
  };

  const validateForm = () => {
    const errors: { name?: string } = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else {
      // Check for duplicate names (case-insensitive)
      const existingEntryType = entryTypes.find(et => 
        et.id !== editingEntryType?.id && 
        et.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (existingEntryType) {
        errors.name = "An entry type with this name already exists";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      if (editingEntryType) {
        // Update existing entry type
        const { error } = await supabase
          .from('motor_vehicle_entry_type')
          .update({
            name: formData.name.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntryType.id);

        if (error) throw error;

        // Update local state
        setEntryTypes(prev => 
          prev.map(et => 
            et.id === editingEntryType.id 
              ? { ...et, name: formData.name.trim() }
              : et
          )
        );
      } else {
        // Create new entry type
        const { data, error } = await supabase
          .from('motor_vehicle_entry_type')
          .insert({
            name: formData.name.trim(),
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        // Add new entry type to local state and maintain order
        if (data) {
          setEntryTypes(prev => {
            const newEntryType = {
              ...data,
              created_at: data.created_at || new Date().toISOString(),
              updated_at: data.updated_at || new Date().toISOString()
            };
            
            // Insert in the correct position to maintain alphabetical order
            const newList = [...prev, newEntryType];
            return newList.sort((a, b) => a.name.localeCompare(b.name));
          });
        }
      }

      // Close modal and reset form
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingEntryType(null);
      setFormData({ name: "" });
      setFormErrors({});
    } catch (error) {
      console.error('Error saving entry type:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntryType) return;

    try {
      setDeletingIds(prev => new Set(prev).add(deletingEntryType.id));
      
      const { error } = await supabase
        .from('motor_vehicle_entry_type')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', deletingEntryType.id);

      if (error) throw error;

      // Remove from local state immediately for better UX
      setEntryTypes(prev => prev.filter(et => et.id !== deletingEntryType.id));
      
      // Close modal
      setShowDeleteModal(false);
      setDeletingEntryType(null);
    } catch (error) {
      console.error('Error deleting entry type:', error);
      // If deletion failed, refresh the data to ensure consistency
      await fetchEntryTypes();
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletingEntryType.id);
        return newSet;
      });
    }
  };

  const filteredEntryTypes = entryTypes.filter(et => {
    const matchesSearch = et.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
      {/* Header with stats and search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entry types..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Entry Type
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Motor Vehicle Entry Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntryTypes.length > 0 ? (
                filteredEntryTypes.map((entryType) => (
                  <TableRow key={entryType.id}>
                    <TableCell className="font-medium">{entryType.name}</TableCell>
                    <TableCell>
                      <Badge variant={entryType.is_active ? "default" : "secondary"}>
                        {entryType.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(entryType.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(entryType.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(entryType)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(entryType.id, entryType.is_active)}
                            disabled={togglingIds.has(entryType.id)}
                          >
                            {entryType.is_active ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                            {togglingIds.has(entryType.id) && "..."}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(entryType)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No entry types found matching your search." : "No entry types found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingEntryType ? "Edit Entry Type" : "Add Entry Type"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingEntryType(null);
                  setFormData({ name: "" });
                  setFormErrors({});
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter entry type name"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Saving..." : (editingEntryType ? "Update" : "Create")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingEntryType(null);
                    setFormData({ name: "" });
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
      {showDeleteModal && deletingEntryType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Delete Entry Type</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deletingEntryType.name}"? This action cannot be undone.
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deletingIds.has(deletingEntryType.id)}
                  className="flex-1"
                >
                  {deletingIds.has(deletingEntryType.id) ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingEntryType(null);
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
