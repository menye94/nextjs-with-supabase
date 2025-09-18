"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, ChevronRight, X } from "lucide-react";

interface Season {
  id: number;
  season_name: string;
  start_date: string;
  end_date: string;
}

interface GroupedSeason {
  season_name: string;
  seasons: Season[];
  isExpanded: boolean;
}

export function SeasonsTable({ searchQuery = '', onSearchChange }: { searchQuery?: string; onSearchChange: (query: string) => void }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    season_name: "",
    start_date: "",
    end_date: "",
  });
  const supabase = createClient();

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("season_name");

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      console.error("Error fetching seasons:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSeasons = seasons.filter((season) =>
    season.season_name.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  // Group seasons by season name
  const groupedSeasons = useMemo(() => {
    const groups: { [key: string]: Season[] } = {};
    
    filteredSeasons.forEach(season => {
      if (!groups[season.season_name]) {
        groups[season.season_name] = [];
      }
      groups[season.season_name].push(season);
    });

    return Object.entries(groups).map(([season_name, seasons]) => ({
      season_name,
      seasons,
      isExpanded: expandedGroups.has(season_name)
    }));
  }, [filteredSeasons, expandedGroups]);

  const toggleGroup = (seasonName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(seasonName)) {
      newExpanded.delete(seasonName);
    } else {
      newExpanded.add(seasonName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSeason) {
        const { error } = await supabase
          .from("seasons")
          .update(formData)
          .eq("id", editingSeason.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("seasons")
          .insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingSeason(null);
      setFormData({
        season_name: "",
        start_date: "",
        end_date: "",
      });
      fetchSeasons();
    } catch (error) {
      console.error("Error saving season:", error);
    }
  };

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setFormData({
      season_name: season.season_name,
      start_date: season.start_date ? new Date(season.start_date).toISOString().split('T')[0] : "",
      end_date: season.end_date ? new Date(season.end_date).toISOString().split('T')[0] : "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this season?")) {
      try {
        const { error } = await supabase
          .from("seasons")
          .delete()
          .eq("id", id);

        if (error) throw error;
        fetchSeasons();
      } catch (error) {
        console.error("Error deleting season:", error);
      }
    }
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      if (action === "delete") {
        if (confirm(`Are you sure you want to delete ${selectedIds.length} seasons?`)) {
          const { error } = await supabase
            .from("seasons")
            .delete()
            .in("id", selectedIds);

          if (error) throw error;
        }
      }

      fetchSeasons();
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading seasons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Seasons</h2>
            <p className="text-sm text-gray-500">Manage hotel seasons grouped by season name</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]"
              size="sm"
            >
              Add Season
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6">
        <Input
          type="text"
          placeholder="Search seasons..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Grouped Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Season Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedSeasons.map((group) => (
              <React.Fragment key={`group-${group.season_name}`}>
                {/* Group Header Row */}
                <tr className="bg-gray-50 hover:bg-gray-100">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleGroup(group.season_name)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-gray-700"
                      >
                        {group.isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span>{group.season_name}</span>
                        <span className="text-gray-500">({group.seasons.length})</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {group.seasons.length > 0 && new Date(group.seasons[0].start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {group.seasons.length > 0 && new Date(group.seasons[0].end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            season_name: group.season_name,
                            start_date: "",
                            end_date: "",
                          });
                          setEditingSeason(null);
                          setIsModalOpen(true);
                        }}
                      >
                        Add to Group
                      </Button>
                    </div>
                  </td>
                </tr>
                
                {/* Nested Rows */}
                {group.isExpanded && group.seasons.map((season) => (
                  <tr key={season.id} className="bg-white hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4"></div> {/* Indent */}
                        <span className="text-sm text-gray-900">{season.season_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(season.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(season.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(season)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(season.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {groupedSeasons.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No seasons found</div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]"
          >
            Add First Season
          </Button>
        </div>
      )}

      {/* Tailwind CSS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-all duration-300 ease-in-out backdrop-blur-sm"
            onClick={() => {
              setIsModalOpen(false);
              setEditingSeason(null);
              setFormData({
                season_name: "",
                start_date: "",
                end_date: "",
              });
            }}
          ></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all w-full max-w-md border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSeason ? "Edit Season" : "Add Season"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSeason(null);
                    setFormData({
                      season_name: "",
                      start_date: "",
                      end_date: "",
                    });
                  }}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:ring-offset-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="season_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Season Name
                    </label>
                    <input
                      id="season_name"
                      type="text"
                      value={formData.season_name}
                      onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
                      placeholder="Enter season name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingSeason(null);
                      setFormData({
                        season_name: "",
                        start_date: "",
                        end_date: "",
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-green)] transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-[var(--theme-green)] text-white rounded-xl text-sm font-medium hover:bg-[var(--theme-green-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-green)] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingSeason ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 