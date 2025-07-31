"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal } from "lucide-react";

interface SeasonsTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface Season {
  id: number;
  season_name: string;
  start_date: string | null;
  end_date: string | null;
  is_deleted: string | null;
}

export function SeasonsTable({ searchQuery, onSearchChange }: SeasonsTableProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchSeasons();
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

  const fetchSeasons = async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('season_name');

      if (error) {
        console.error('Error fetching seasons:', error);
        return;
      }

      setSeasons(data || []);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const columns = [
    {
      key: 'season_name',
      label: 'Season Name',
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
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (value: string | null) => (
        <span className="text-gray-700">{formatDate(value)}</span>
      ),
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
      render: (value: string | null) => (
        <span className="text-gray-700">{formatDate(value)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: Season) => (
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
    setEditingSeason(null);
    setSeasonName("");
    setStartDate("");
    setEndDate("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setSeasonName(season.season_name);
    setStartDate(season.start_date ? season.start_date.split('T')[0] : "");
    setEndDate(season.end_date ? season.end_date.split('T')[0] : "");
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (season: Season) => {
    if (window.confirm(`Are you sure you want to delete "${season.season_name}"? This action cannot be undone.`)) {
      try {
        // Use hard delete until database is updated with is_deleted column
        const { error } = await supabase
          .from('seasons')
          .delete()
          .eq('id', season.id);

        if (error) {
          console.error('Error deleting season:', error);
          return;
        }

        fetchSeasons(); // Refresh the data
        setOpenMenuId(null);
      } catch (error) {
        console.error('Error deleting season:', error);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchSeasons(); // Refresh the data
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSeason(null);
    setSeasonName("");
    setStartDate("");
    setEndDate("");
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!seasonName.trim()) {
      setFormError("Season name is required");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setFormError("Start date cannot be after end date");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const seasonData = {
        season_name: seasonName.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
      };

      if (editingSeason) {
        // Check for duplicates when editing (excluding current season)
        const { data: existingSeasons, error: checkError } = await supabase
          .from('seasons')
          .select('id')
          .eq('season_name', seasonName.trim())
          .neq('id', editingSeason.id);

        if (checkError) {
          console.error('Error checking for duplicates:', checkError);
          setFormError('Error checking for duplicates');
          return;
        }

        if (existingSeasons && existingSeasons.length > 0) {
          setFormError("A season with this name already exists");
          return;
        }

        // Update existing season
        const { error } = await supabase
          .from('seasons')
          .update(seasonData)
          .eq('id', editingSeason.id);

        if (error) {
          console.error('Error updating season:', error);
          setFormError(error.message);
          return;
        }
      } else {
        // Check for duplicates when creating new season
        const { data: existingSeasons, error: checkError } = await supabase
          .from('seasons')
          .select('id')
          .eq('season_name', seasonName.trim());

        if (checkError) {
          console.error('Error checking for duplicates:', checkError);
          setFormError('Error checking for duplicates');
          return;
        }

        if (existingSeasons && existingSeasons.length > 0) {
          setFormError("A season with this name already exists");
          return;
        }

        // Create new season
        const { error } = await supabase
          .from('seasons')
          .insert(seasonData);

        if (error) {
          console.error('Error creating season:', error);
          setFormError(error.message);
          return;
        }
      }

      handleAddSuccess();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving season:', error);
      setFormError('An unexpected error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading seasons...</div>
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
                placeholder="Search for seasons..."
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
        data={seasons}
        searchQuery={searchQuery}
        title="Seasons"
        description="Manage seasons for park products and pricing"
        onAddNew={handleAddNew}
        searchFields={['season_name']}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSeason ? "Edit Season" : "Add New Season"}
      >
        <div className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="seasonName" className="block text-sm font-medium text-gray-700 mb-2">
                Season Name
              </label>
              <input
                id="seasonName"
                type="text"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="Enter season name"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
                />
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
              {formLoading ? (editingSeason ? "Updating..." : "Adding...") : (editingSeason ? "Update" : "Add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 