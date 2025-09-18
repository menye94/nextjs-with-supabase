"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, MoreHorizontal, Edit, Trash2, Loader2, Building2, Search, ChevronUp, ChevronDown, Copy, RotateCcw, CheckSquare, Square } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { capitalizeWords } from "@/lib/utils/string-utils";

interface HotelSeasonsTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface HotelSeason {
  id: number;
  start_date: string;
  end_date: string;
  season_name: string;
  hotel_id: number;
  hotel?: {
    hotel_name: string;
  };
}

interface Hotel {
  id: number;
  hotel_name: string;
}

export function HotelSeasonsTable({ searchQuery, onSearchChange }: HotelSeasonsTableProps) {
  const [seasons, setSeasons] = useState<HotelSeason[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<HotelSeason | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<HotelSeason | null>(null);
  
  // Form states
  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Searchable dropdown states
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");
  const [hotelDropdownOpen, setHotelDropdownOpen] = useState(false);
  const [selectedHotelName, setSelectedHotelName] = useState("");
  
  // Filter states
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>("");
  const [hotelFilterDropdownOpen, setHotelFilterDropdownOpen] = useState(false);
  const [hotelFilterSearchQuery, setHotelFilterSearchQuery] = useState("");
  const [selectedHotelFilterName, setSelectedHotelFilterName] = useState("");
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Bulk operations states
  const [selectedSeasons, setSelectedSeasons] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showCopyToNextYearModal, setShowCopyToNextYearModal] = useState(false);
  const [showRollingYearModal, setShowRollingYearModal] = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 1);
  
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const hotelFilterDropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchSeasons();
    fetchHotels();
  }, []);

  // Refetch seasons when filter changes
  useEffect(() => {
    fetchSeasons();
  }, [selectedHotelFilter]);

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

  // Close hotel dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.hotel-dropdown')) {
        setHotelDropdownOpen(false);
      }
      if (hotelFilterDropdownRef.current && !hotelFilterDropdownRef.current.contains(event.target as Node)) {
        setHotelFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, hotel_name')
        .order('hotel_name');

      if (error) {
        console.error('Error fetching hotels:', error);
        return;
      }

      console.log('Fetched hotels data:', data); // Debug log
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      console.log('Fetching seasons...'); // Debug log
      
      // First, get the seasons
      let seasonsQuery = supabase
        .from('hotels_seasons')
        .select(`
          id,
          start_date,
          end_date,
          season_name,
          hotel_id
        `)
        .order('start_date', { ascending: false });

      if (selectedHotelFilter) {
        seasonsQuery = seasonsQuery.eq('hotel_id', selectedHotelFilter);
      }

      const { data: seasonsData, error: seasonsError } = await seasonsQuery;

      if (seasonsError) {
        console.error('Error fetching seasons:', seasonsError);
        return;
      }

      console.log('Raw seasons data from DB:', seasonsData); // Debug log

      // Then, get the hotels separately to avoid RLS issues
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('id, hotel_name')
        .order('hotel_name');

      if (hotelsError) {
        console.error('Error fetching hotels:', hotelsError);
        return;
      }

      // Combine the data
      const combinedData = seasonsData?.map(season => ({
        ...season,
        hotel: hotelsData?.find(hotel => hotel.id === season.hotel_id) || undefined
      })) || [];

      console.log('Combined seasons data:', combinedData); // Debug log
      console.log('Available hotels:', hotelsData); // Debug log
      
      // Force a state update by creating a new array
      setSeasons([...combinedData]);
      
      console.log('State updated with seasons count:', combinedData.length); // Debug log
    } catch (error) {
      console.error('Error fetching seasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeasonStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'active';
  };

  const isSeasonPast = (startDate: string, endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    return now > end;
  };

  const getSeasonYear = (startDate: string) => {
    return new Date(startDate).getFullYear();
  };

  // Filter hotels based on search query
  const filteredHotels = hotels.filter(hotel =>
    hotel.hotel_name.toLowerCase().includes(hotelSearchQuery.toLowerCase())
  );

  // Filter hotels for the filter dropdown
  const filteredHotelsForFilter = hotels.filter(hotel =>
    hotel.hotel_name.toLowerCase().includes(hotelFilterSearchQuery.toLowerCase())
  );

  // Handle hotel selection
  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotelId(hotel.id.toString());
    setSelectedHotelName(hotel.hotel_name);
    setHotelSearchQuery("");
    setHotelDropdownOpen(false);
  };

  // Handle hotel filter selection
  const handleHotelFilterSelect = (hotel: Hotel) => {
    setSelectedHotelFilter(hotel.id.toString());
    setSelectedHotelFilterName(hotel.hotel_name);
    setHotelFilterSearchQuery("");
    setHotelFilterDropdownOpen(false);
  };

  // Handle hotel filter change
  const handleHotelFilterChange = (hotelId: string) => {
    setSelectedHotelFilter(hotelId);
    if (hotelId) {
      const hotel = hotels.find(h => h.id === parseInt(hotelId));
      setSelectedHotelFilterName(hotel?.hotel_name || "");
    } else {
      setSelectedHotelFilterName("");
    }
  };

  // Clear hotel filter
  const clearHotelFilter = () => {
    setSelectedHotelFilter("");
    setSelectedHotelFilterName("");
    setHotelFilterSearchQuery("");
  };

  // Handle start date change
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    // If end date is before or equal to new start date, clear it
    if (endDate && new Date(endDate) <= new Date(date)) {
      setEndDate("");
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedSeasons.size === seasons.length) {
      setSelectedSeasons(new Set());
    } else {
      setSelectedSeasons(new Set(seasons.map(s => s.id)));
    }
  };

  const handleSelectSeason = (seasonId: number) => {
    const newSelected = new Set(selectedSeasons);
    if (newSelected.has(seasonId)) {
      newSelected.delete(seasonId);
    } else {
      newSelected.add(seasonId);
    }
    setSelectedSeasons(newSelected);
  };

  // Check if a season is being used in hotel pricing
  const checkSeasonUsage = async (seasonId: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('hotel_rates')
        .select('id')
        .eq('hotel_season_id', seasonId)
        .limit(1);

      if (error) {
        console.error('Error checking season usage:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking season usage:', error);
      return false;
    }
  };

  // Copy seasons to next year with smart logic
  const handleCopyToNextYear = async () => {
    if (selectedSeasons.size === 0) return;

    try {
      setBulkActionLoading(true);
      const selectedSeasonData = seasons.filter(s => selectedSeasons.has(s.id));
      
      const seasonsToUpdate: any[] = [];
      const seasonsToCopy: any[] = [];

      // Check each season's usage and categorize them
      for (const season of selectedSeasonData) {
        const isUsed = await checkSeasonUsage(season.id);
        
        const startDate = new Date(season.start_date);
        const endDate = new Date(season.end_date);
        
        // Adjust dates to target year
        startDate.setFullYear(targetYear);
        endDate.setFullYear(targetYear);
        
        if (isUsed) {
          // Season is used in pricing - create a copy
          seasonsToCopy.push({
            season_name: season.season_name,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            hotel_id: season.hotel_id
          });
        } else {
          // Season is not used in pricing - update existing
          seasonsToUpdate.push({
            id: season.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          });
        }
      }

      // Update existing seasons that aren't used in pricing
      for (const update of seasonsToUpdate) {
        const { error } = await supabase
          .from('hotels_seasons')
          .update({
            start_date: update.start_date,
            end_date: update.end_date
          })
          .eq('id', update.id);

        if (error) {
          console.error('Error updating season:', error);
        }
      }

      // Copy seasons that are used in pricing
      if (seasonsToCopy.length > 0) {
        const { error } = await supabase
          .from('hotels_seasons')
          .insert(seasonsToCopy);

        if (error) {
          console.error('Error copying seasons:', error);
          return;
        }
      }

      console.log(`Updated ${seasonsToUpdate.length} seasons, copied ${seasonsToCopy.length} seasons`); // Debug log
      
      // Add a small delay to ensure the database operation completes
      setTimeout(() => {
        fetchSeasons();
      }, 100);
      
      setSelectedSeasons(new Set());
      setShowCopyToNextYearModal(false);
    } catch (error) {
      console.error('Error processing seasons:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Rolling year logic - adjust past seasons to current year
  const handleRollingYear = async () => {
    if (selectedSeasons.size === 0) return;

    try {
      setBulkActionLoading(true);
      const selectedSeasonData = seasons.filter(s => selectedSeasons.has(s.id));
      const currentYear = new Date().getFullYear();
      
      const updates = selectedSeasonData.map(season => {
        const startDate = new Date(season.start_date);
        const endDate = new Date(season.end_date);
        
        // Adjust dates to current year
        startDate.setFullYear(currentYear);
        endDate.setFullYear(currentYear);
        
        return {
          id: season.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        };
      });

      // Update each season
      for (const update of updates) {
        const { error } = await supabase
          .from('hotels_seasons')
          .update({
            start_date: update.start_date,
            end_date: update.end_date
          })
          .eq('id', update.id);

        if (error) {
          console.error('Error updating season:', error);
        }
      }

      fetchSeasons();
      setSelectedSeasons(new Set());
      setShowRollingYearModal(false);
    } catch (error) {
      console.error('Error updating seasons:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'select',
      label: '',
      sortable: false,
      render: (value: any, row: HotelSeason) => (
        <input
          type="checkbox"
          checked={selectedSeasons.has(row.id)}
          onChange={() => handleSelectSeason(row.id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      ),
    },
    {
      key: 'hotel',
      label: 'Hotel',
      sortable: true,
      render: (value: any, row: HotelSeason) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{capitalizeWords(row.hotel?.hotel_name || 'Unknown Hotel')}</span>
        </div>
      ),
    },
    {
      key: 'season_name',
      label: 'Season Name',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900 font-medium">{value}</span>
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900">{formatDate(value)}</span>
      ),
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900">{formatDate(value)}</span>
      ),
    },
    {
      key: 'year',
      label: 'Year',
      sortable: true,
      render: (value: any, row: HotelSeason) => (
        <span className="text-gray-600">{getSeasonYear(row.start_date)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: any, row: HotelSeason) => {
        const status = getSeasonStatus(row.start_date, row.end_date);
        return (
          <Badge 
            variant={status === 'active' ? "default" : status === 'upcoming' ? "secondary" : "outline"}
            className={status === 'past' ? 'text-gray-500 border-gray-300' : ''}
          >
            {status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Past'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: HotelSeason) => (
        <div className="relative" ref={(el) => { menuRefs.current[row.id] = el; }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
          
          {openMenuId === row.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 inline mr-2" />
                  Edit
                </button>
                {isSeasonPast(row.start_date, row.end_date) && (
                  <button
                    onClick={() => handleCopySingleToNextYear(row)}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4 inline mr-2" />
                    Copy to Next Year
                  </button>
                )}
                <button
                  onClick={() => handleDelete(row)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 className="h-4 w-4 inline mr-2" />
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
    setSelectedHotelId("");
    setSelectedHotelName("");
    setHotelSearchQuery("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (season: HotelSeason) => {
    setEditingSeason(season);
    setSeasonName(season.season_name);
    setStartDate(season.start_date.split('T')[0]); // Convert to date input format
    setEndDate(season.end_date.split('T')[0]);
    setSelectedHotelId(season.hotel_id.toString());
    setSelectedHotelName(season.hotel?.hotel_name || "");
    setHotelSearchQuery("");
    setFormError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCopySingleToNextYear = async (season: HotelSeason) => {
    try {
      // Check if season is being used in hotel pricing
      const isUsed = await checkSeasonUsage(season.id);
      
      const startDate = new Date(season.start_date);
      const endDate = new Date(season.end_date);
      
      // Set to next year
      startDate.setFullYear(startDate.getFullYear() + 1);
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      if (isUsed) {
        // Season is used in pricing - create a copy
        const { error } = await supabase
          .from('hotels_seasons')
          .insert({
            season_name: season.season_name,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            hotel_id: season.hotel_id
          });

        if (error) {
          console.error('Error copying season:', error);
          return;
        }

        console.log('Season copied successfully (was used in pricing), refreshing data...'); // Debug log
      } else {
        // Season is not used in pricing - update existing
        const { error } = await supabase
          .from('hotels_seasons')
          .update({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          })
          .eq('id', season.id);

        if (error) {
          console.error('Error updating season:', error);
          return;
        }

        console.log('Season updated successfully (was not used in pricing), refreshing data...'); // Debug log
      }
      
      // Add a small delay to ensure the database operation completes
      setTimeout(() => {
        fetchSeasons();
      }, 100);
      
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error processing season:', error);
    }
  };

  const handleDelete = (season: HotelSeason) => {
    setSeasonToDelete(season);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const performDelete = async (season: HotelSeason) => {
    try {
      setDeleteLoading(true);
      
      const { error } = await supabase
        .from('hotels_seasons')
        .delete()
        .eq('id', season.id);

      if (error) {
        console.error('Error deleting season:', error);
        return;
      }

      fetchSeasons();
      setShowDeleteModal(false);
      setSeasonToDelete(null);
    } catch (error) {
      console.error('Error deleting season:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seasonName.trim() || !startDate || !endDate || !selectedHotelId) {
      setFormError("Please fill in all fields");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setFormError("End date must be after start date");
      return;
    }

    try {
      setFormLoading(true);
      setFormError("");

      const seasonData = {
        season_name: seasonName.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        hotel_id: parseInt(selectedHotelId)
      };

      if (editingSeason) {
        // Update existing season
        const { error } = await supabase
          .from('hotels_seasons')
          .update(seasonData)
          .eq('id', editingSeason.id);

        if (error) {
          console.error('Error updating season:', error);
          setFormError("Error updating season");
          return;
        }
      } else {
        // Create new season
        const { error } = await supabase
          .from('hotels_seasons')
          .insert(seasonData);

        if (error) {
          console.error('Error creating season:', error);
          setFormError("Error creating season");
          return;
        }
      }

      fetchSeasons();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving season:', error);
      setFormError("Error saving season");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSeason(null);
    setSeasonName("");
    setStartDate("");
    setEndDate("");
    setSelectedHotelId("");
    setSelectedHotelName("");
    setHotelSearchQuery("");
    setFormError("");
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('hotels_seasons')
          .delete()
          .in('id', selectedIds);

        if (error) {
          console.error('Error performing bulk delete:', error);
          return;
        }

        fetchSeasons();
        setSelectedSeasons(new Set());
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  // Filter seasons based on search query
  const filteredSeasons = seasons.filter(season =>
    season.season_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    season.hotel?.hotel_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Loading hotel seasons...</h3>
        <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the season data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Hotel Seasons</h3>
            <p className="text-sm text-gray-500">
              Manage seasonal pricing periods for your hotels
            </p>
          </div>
          <Button onClick={handleAddNew} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Season
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          {/* Hotel Filter */}
          <div className="relative">
            <Label htmlFor="hotel-filter" className="text-sm font-medium text-gray-700">
              Filter by Hotel
            </Label>
            <div className="relative mt-1">
              <Input
                id="hotel-filter"
                placeholder="Select hotel..."
                value={selectedHotelFilterName || ""}
                onClick={() => setHotelFilterDropdownOpen(!hotelFilterDropdownOpen)}
                readOnly
                className="w-64 cursor-pointer"
              />
              {selectedHotelFilterName && (
                <button
                  onClick={clearHotelFilter}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              
                             {hotelFilterDropdownOpen && (
                 <div 
                   ref={hotelFilterDropdownRef}
                   className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto hotel-filter-dropdown"
                 >
                   <div className="p-2">
                     <Input
                       placeholder="Search hotels..."
                       value={hotelFilterSearchQuery}
                       onChange={(e) => setHotelFilterSearchQuery(e.target.value)}
                       className="mb-2"
                     />
                   </div>
                   <div className="py-1">
                     <button
                       onClick={() => {
                         setSelectedHotelFilter("");
                         setSelectedHotelFilterName("");
                         setHotelFilterDropdownOpen(false);
                       }}
                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                     >
                       All Hotels
                     </button>
                     {filteredHotelsForFilter.map((hotel) => (
                       <button
                         key={hotel.id}
                         onClick={() => handleHotelFilterSelect(hotel)}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                       >
                         {capitalizeWords(hotel.hotel_name)}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700">
              Search
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search seasons..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSeasons.size > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {selectedSeasons.size} season{selectedSeasons.size !== 1 ? 's' : ''} selected
              </span>
                             <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowCopyToNextYearModal(true)}
                 disabled={bulkActionLoading}
                 className="bulk-action-button"
               >
                 <Copy className="h-4 w-4 mr-2" />
                 Process to Next Year
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowRollingYearModal(true)}
                 disabled={bulkActionLoading}
                 className="bulk-action-button"
               >
                 <RotateCcw className="h-4 w-4 mr-2" />
                 Adjust to Current Year
               </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete', Array.from(selectedSeasons).map(String))}
                disabled={bulkActionLoading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
                         <Button
               variant="ghost"
               size="sm"
               onClick={() => setSelectedSeasons(new Set())}
               className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
             >
               Clear Selection
             </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={filteredSeasons}
        columns={columns}
        searchQuery={searchQuery}
        showBulkSelection={false}
        itemsPerPage={10}
        showPagination={true}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSeason ? "Edit Season" : "Add New Season"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="season-name">Season Name *</Label>
            <Input
              id="season-name"
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              placeholder="e.g., Peak Season, Low Season"
              required
            />
          </div>

          <div>
            <Label htmlFor="hotel">Hotel *</Label>
            <div className="relative mt-1">
              <Input
                id="hotel"
                placeholder="Select hotel..."
                value={selectedHotelName}
                onClick={() => setHotelDropdownOpen(!hotelDropdownOpen)}
                readOnly
                required
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              
                             {hotelDropdownOpen && (
                 <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto hotel-dropdown">
                   <div className="p-2">
                     <Input
                       placeholder="Search hotels..."
                       value={hotelSearchQuery}
                       onChange={(e) => setHotelSearchQuery(e.target.value)}
                       className="mb-2"
                     />
                   </div>
                   <div className="py-1">
                     {filteredHotels.map((hotel) => (
                       <button
                         key={hotel.id}
                         onClick={() => handleHotelSelect(hotel)}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                       >
                         {capitalizeWords(hotel.hotel_name)}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date *</Label>
              <DateInput
                id="start-date"
                value={startDate}
                onChange={handleStartDateChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date *</Label>
              <DateInput
                id="end-date"
                value={endDate}
                onChange={(date) => setEndDate(date)}
                min={startDate}
                required
              />
            </div>
          </div>

          {formError && (
            <div className="text-red-600 text-sm">{formError}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSeason ? "Update Season" : "Add Season"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Season"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the season "{seasonToDelete?.season_name}"? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => seasonToDelete && performDelete(seasonToDelete)}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Copy to Next Year Modal */}
      <Modal
        isOpen={showCopyToNextYearModal}
        onClose={() => setShowCopyToNextYearModal(false)}
        title="Copy Seasons to Next Year"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This will intelligently process seasons for {targetYear}:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• <strong>Update</strong> seasons that haven't been used in hotel pricing</li>
            <li>• <strong>Copy</strong> seasons that are already used in hotel pricing</li>
          </ul>
          <div>
            <Label htmlFor="target-year">Target Year</Label>
            <Input
              id="target-year"
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              min={new Date().getFullYear()}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowCopyToNextYearModal(false)}>
              Cancel
            </Button>
                         <Button onClick={handleCopyToNextYear} disabled={bulkActionLoading}>
               {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Process Seasons
             </Button>
          </div>
        </div>
      </Modal>

      {/* Rolling Year Modal */}
      <Modal
        isOpen={showRollingYearModal}
        onClose={() => setShowRollingYearModal(false)}
        title="Adjust Seasons to Current Year"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This will update the selected seasons to use the current year ({new Date().getFullYear()}) 
            while keeping the same month and day patterns.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowRollingYearModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRollingYear} disabled={bulkActionLoading}>
              {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Seasons
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 