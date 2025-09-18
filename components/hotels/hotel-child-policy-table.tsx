"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";

interface HotelChildPolicy {
  id: number;
  hotel_id: number;
  min_age: number;
  max_age: number;
  fee_percentage: number;
  adult_sharing: boolean;
  hotel?: {
    hotel_name: string;
  };
}

interface Hotel {
  id: number;
  hotel_name: string;
}

export function HotelChildPolicyTable({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (query: string) => void }) {
  const [policies, setPolicies] = useState<HotelChildPolicy[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<HotelChildPolicy | null>(null);
  const [formData, setFormData] = useState({
    hotel_id: "",
    min_age: "",
    max_age: "",
    fee_percentage: "",
    adult_sharing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPolicies();
    fetchHotels();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hotel_child_policy")
        .select(`
          *,
          hotel:hotels(hotel_name)
        `)
        .order("hotel_id");

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, hotel_name")
        .order("hotel_name");

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  const filteredPolicies = policies.filter((policy) =>
    policy.hotel?.hotel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.min_age.toString().includes(searchQuery) ||
    policy.max_age.toString().includes(searchQuery)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const policyData = {
        hotel_id: parseInt(formData.hotel_id),
        min_age: parseInt(formData.min_age),
        max_age: parseInt(formData.max_age),
        fee_percentage: parseFloat(formData.fee_percentage),
        adult_sharing: formData.adult_sharing,
      };

      if (editingPolicy) {
        const { error } = await supabase
          .from("hotel_child_policy")
          .update(policyData)
          .eq("id", editingPolicy.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hotel_child_policy")
          .insert([policyData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingPolicy(null);
      setFormData({
        hotel_id: "",
        min_age: "",
        max_age: "",
        fee_percentage: "",
        adult_sharing: false,
      });
      fetchPolicies();
    } catch (error) {
      console.error("Error saving policy:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (policy: HotelChildPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      hotel_id: policy.hotel_id.toString(),
      min_age: policy.min_age.toString(),
      max_age: policy.max_age.toString(),
      fee_percentage: policy.fee_percentage.toString(),
      adult_sharing: policy.adult_sharing,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this child policy?")) {
      try {
        const { error } = await supabase
          .from("hotel_child_policy")
          .delete()
          .eq("id", id);

        if (error) throw error;
        fetchPolicies();
      } catch (error) {
        console.error("Error deleting policy:", error);
      }
    }
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      if (action === "delete") {
        if (confirm(`Are you sure you want to delete ${selectedIds.length} policies?`)) {
          const { error } = await supabase
            .from("hotel_child_policy")
            .delete()
            .in("id", selectedIds);

          if (error) throw error;
        }
      }

      fetchPolicies();
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const columns = [
    {
      key: "hotel_name",
      label: "Hotel",
      sortable: true,
      render: (value: any, row: HotelChildPolicy) => row.hotel?.hotel_name || "Unknown Hotel",
    },
    {
      key: "age_range",
      label: "Age Range",
      sortable: true,
      render: (value: any, row: HotelChildPolicy) => `${row.min_age} - ${row.max_age} years`,
    },
    {
      key: "fee_percentage",
      label: "Fee Percentage",
      sortable: true,
      render: (value: number) => `${value}%`,
    },
    {
      key: "adult_sharing",
      label: "Adult Sharing",
      sortable: true,
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800"
        }`}>
          {value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (value: any, row: HotelChildPolicy) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredPolicies}
        searchQuery={searchQuery}
        title="Hotel Child Policies"
        searchFields={["hotel_name", "min_age", "max_age"]}
        onBulkAction={handleBulkAction}
        bulkActions={[
          { label: "Delete", value: "delete", variant: "destructive" },
        ]}
        onAddNew={() => setIsModalOpen(true)}
        addNewLabel="Add Child Policy"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPolicy(null);
          setFormData({
            hotel_id: "",
            min_age: "",
            max_age: "",
            fee_percentage: "",
            adult_sharing: false,
          });
        }}
        title={editingPolicy ? "Edit Child Policy" : "Add Child Policy"}
      >
        <div className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="hotel_id" className="block text-sm font-medium text-gray-700 mb-2">
                Hotel
              </label>
              <select
                id="hotel_id"
                value={formData.hotel_id}
                onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
              >
                <option value="">Select a hotel</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.hotel_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="min_age" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Age
                </label>
                <input
                  id="min_age"
                  type="number"
                  min="0"
                  max="18"
                  value={formData.min_age}
                  onChange={(e) => setFormData({ ...formData, min_age: e.target.value })}
                  placeholder="0"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="max_age" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Age
                </label>
                <input
                  id="max_age"
                  type="number"
                  min="0"
                  max="18"
                  value={formData.max_age}
                  onChange={(e) => setFormData({ ...formData, max_age: e.target.value })}
                  placeholder="12"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="fee_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                Fee Percentage
              </label>
              <div className="relative">
                <input
                  id="fee_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData({ ...formData, fee_percentage: e.target.value })}
                  placeholder="50.00"
                  required
                  className="block w-full px-3 py-2 pr-8 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                id="adult_sharing"
                type="checkbox"
                checked={formData.adult_sharing}
                onChange={(e) => setFormData({ ...formData, adult_sharing: e.target.checked })}
                className="h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300 rounded"
              />
              <label htmlFor="adult_sharing" className="block text-sm font-medium text-gray-700">
                Adult Sharing (applies when child shares room with adults)
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPolicy(null);
                setFormData({
                  hotel_id: "",
                  min_age: "",
                  max_age: "",
                  fee_percentage: "",
                  adult_sharing: false,
                });
              }}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[var(--theme-green)] text-white rounded-md text-sm font-medium hover:bg-[var(--theme-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? (editingPolicy ? "Updating..." : "Creating...") 
                : (editingPolicy ? "Update" : "Add")
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 