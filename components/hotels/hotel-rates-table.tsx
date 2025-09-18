"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { AddHotelRateModal } from "@/components/hotels/add-hotel-rate-modal";
import { ChevronDownIcon, ChevronRightIcon, Plus, Download, Search, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capitalizeWords } from "@/lib/utils/string-utils";

interface HotelRate {
  id: number;
  hotel_id: number;
  hotel_room_id: number;
  rate: number;
  meal_plan_id: number;
  tax_behavior: number;
  hotel_season_id: number;
  hotel_rates_option_id: number;
  currency_id: number;
  entry_type_id?: number;
  hotel_pricing_type_id: number;
  hotel?: { hotel_name: string };
  hotel_room?: { room: { room_name: string } };
  meal_plan?: { name: string };
  tax_behavior_data?: { name: string };
  hotel_season?: { season_name: string; start_date?: string; end_date?: string };
  hotel_rates_option?: { option_name: string };
  currency?: { currency_name: string };
  entry_type?: { entry_name: string };
  hotel_pricing_type?: { name: string };
}

interface GroupedRate {
  key: string;
  hotel: string;
  room: string;
  season: string;
  mealPlan: string;
  pricingType: string;
  currency: string;
  rates: HotelRate[];
  isExpanded: boolean;
}

type SortField = 'hotel' | 'room' | 'rate' | 'mealPlan' | 'pricingType' | 'currency';
type SortDirection = 'asc' | 'desc';

export function HotelRatesTable({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (query: string) => void }) {
  const [rates, setRates] = useState<HotelRate[]>([]);
  const [groupedRates, setGroupedRates] = useState<GroupedRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<HotelRate | null>(null);
  const [sortField, setSortField] = useState<SortField>('hotel');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const supabase = createClient();

  const fetchRates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('hotel_rates')
        .select(`
          *,
          hotel:hotels(hotel_name),
          hotel_room:hotel_rooms(
            id,
            room:rooms(room_name)
          ),
          meal_plan:hotel_meal_plans(name),
          tax_behavior_data:tax_behaviour(name),
          hotel_season:hotels_seasons(season_name, start_date, end_date),
          hotel_rates_option:hotel_rates_option(option_name),
          currency:currency(currency_name),
          entry_type:entry_type(entry_name),
          hotel_pricing_type:hotel_pricing_type(name)
        `)
        .order('id', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setRates(data || []);
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Group rates by hotel, room, meal plan, pricing type, and currency (excluding season)
  useEffect(() => {
    const grouped = rates.reduce((acc: GroupedRate[], rate) => {
      if (!rate.hotel?.hotel_name || !rate.hotel_room?.room?.room_name) {
        return acc;
      }

      const key = `${rate.hotel.hotel_name}-${rate.hotel_room.room.room_name}-${rate.meal_plan?.name}-${rate.hotel_rates_option?.option_name}-${rate.currency?.currency_name}`;
      
      const existingGroup = acc.find(group => group.key === key);
      
      if (existingGroup) {
        existingGroup.rates.push(rate);
      } else {
        acc.push({
          key,
          hotel: rate.hotel.hotel_name,
          room: rate.hotel_room.room.room_name,
          season: 'Multiple Seasons', // Placeholder since we're grouping by hotel/room combination
          mealPlan: rate.meal_plan?.name || 'N/A',
          pricingType: rate.hotel_rates_option?.option_name || 'N/A',
          currency: rate.currency?.currency_name || 'N/A',
          rates: [rate],
          isExpanded: false
        });
      }
      
      return acc;
    }, []);

    setGroupedRates(grouped);
  }, [rates]);

  // Sort function
  const sortGroupedRates = (data: GroupedRate[], field: SortField, direction: SortDirection): GroupedRate[] => {
    return [...data].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (field) {
        case 'hotel':
          aValue = a.hotel.toLowerCase();
          bValue = b.hotel.toLowerCase();
          break;
        case 'room':
          aValue = a.room.toLowerCase();
          bValue = b.room.toLowerCase();
          break;
        case 'rate':
          // Use the minimum rate for sorting
          aValue = Math.min(...a.rates.map(r => r.rate));
          bValue = Math.min(...b.rates.map(r => r.rate));
          break;
        case 'mealPlan':
          aValue = a.mealPlan.toLowerCase();
          bValue = b.mealPlan.toLowerCase();
          break;
        case 'pricingType':
          aValue = a.pricingType.toLowerCase();
          bValue = b.pricingType.toLowerCase();
          break;
        case 'currency':
          aValue = a.currency.toLowerCase();
          bValue = b.currency.toLowerCase();
          break;
        default:
          aValue = a.hotel.toLowerCase();
          bValue = b.hotel.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } else {
        if (direction === 'asc') {
          return (aValue as number) - (bValue as number);
        } else {
          return (bValue as number) - (aValue as number);
        }
      }
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUpIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-gray-600" />
      : <ChevronDownIcon className="w-4 h-4 text-gray-600" />;
  };

  const filteredGroupedRates = groupedRates.filter((group) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      group.hotel.toLowerCase().includes(searchLower) ||
      group.room.toLowerCase().includes(searchLower) ||
      group.season.toLowerCase().includes(searchLower) ||
      group.mealPlan.toLowerCase().includes(searchLower)
    );
  });

  // Apply sorting to filtered results
  const sortedGroupedRates = sortGroupedRates(filteredGroupedRates, sortField, sortDirection);

  const toggleExpanded = (key: string) => {
    setGroupedRates(prev => 
      prev.map(group => 
        group.key === key 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to get pricing type abbreviation
  const getPricingTypeAbbreviation = (pricingTypeName: string): string => {
    switch (pricingTypeName?.toLowerCase()) {
      case 'special tour rate':
      case 'special tour operator rate':
        return 'STO';
      case 'rack rate':
        return 'RR';
      default:
        return pricingTypeName || 'N/A';
    }
  };

  const handleAddNew = () => {
    setEditingRate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rate: HotelRate) => {
    setEditingRate(rate);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('hotel_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Rate deleted successfully');
      fetchRates();
    } catch (error) {
      console.error('Error deleting rate:', error);
      alert('Error deleting rate');
    }
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    // Implementation for bulk actions
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading hotel rates...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Hotel Rates</h2>
            <p className="text-sm text-gray-500 mt-1">Manage hotel rates and pricing configurations</p>
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
              placeholder="Search for hotel rates..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-96 bg-white text-gray-900 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Expand column */}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('hotel')}
              >
                <div className="flex items-center space-x-1">
                  <span>Hotel</span>
                  {getSortIcon('hotel')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('room')}
              >
                <div className="flex items-center space-x-1">
                  <span>Room</span>
                  {getSortIcon('room')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('rate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Rate</span>
                  {getSortIcon('rate')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('mealPlan')}
              >
                <div className="flex items-center space-x-1">
                  <span>Meal Plan</span>
                  {getSortIcon('mealPlan')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('pricingType')}
              >
                <div className="flex items-center space-x-1">
                  <span>Pricing Type</span>
                  {getSortIcon('pricingType')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('currency')}
              >
                <div className="flex items-center space-x-1">
                  <span>Currency</span>
                  {getSortIcon('currency')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                         {sortedGroupedRates.map((group) => (
               <React.Fragment key={group.key}>
                 <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => toggleExpanded(group.key)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {group.isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {capitalizeWords(group.hotel)}
                   </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {group.room}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const uniqueRates = [...new Set(group.rates.map(r => r.rate))];
                      if (uniqueRates.length === 1) {
                        return `$${uniqueRates[0].toFixed(2)}`;
                      } else {
                        const minRate = Math.min(...uniqueRates);
                        const maxRate = Math.max(...uniqueRates);
                        return `$${minRate.toFixed(2)} - $${maxRate.toFixed(2)}`;
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.mealPlan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span title={group.pricingType}>
                      {getPricingTypeAbbreviation(group.pricingType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingRate(group.rates[0]);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        title="Edit first rate in this group"
                      >
                        Edit First
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete all ${group.rates.length} rate(s) for this combination?`)) {
                            group.rates.forEach(rate => handleDelete(rate.id));
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete All
                      </button>
                    </div>
                  </td>
                </tr>
                                                  {group.isExpanded && (
                   <tr>
                     <td colSpan={8} className="px-6 py-4 bg-gray-50">
                       <div className="space-y-6">
                         <div className="flex items-center justify-between">
                           <h4 className="font-medium text-gray-900">All Seasons & Pricing</h4>
                           <span className="text-sm text-gray-500">
                             {group.rates.length} total rate{group.rates.length !== 1 ? 's' : ''}
                           </span>
                         </div>
                         <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                           💡 Click "Edit" on any season card below to modify individual pricing for that specific date range.
                         </div>
                         
                         {/* Group rates by season name */}
                         {(() => {
                           const seasonGroups = group.rates.reduce((acc, rate) => {
                             const seasonName = rate.hotel_season?.season_name || 'Unknown Season';
                             if (!acc[seasonName]) {
                               acc[seasonName] = [];
                             }
                             acc[seasonName].push(rate);
                             return acc;
                           }, {} as Record<string, typeof group.rates>);

                           return Object.entries(seasonGroups).map(([seasonName, seasonRates]) => (
                             <div key={seasonName} className="space-y-3">
                               <h5 className="font-medium text-gray-800 text-sm border-b border-gray-200 pb-2">
                                 {seasonName} ({seasonRates.length} date range{seasonRates.length !== 1 ? 's' : ''})
                               </h5>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {seasonRates.map((rate) => (
                                   <div key={rate.id} className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
                                     <div className="space-y-2">
                                       <div>
                                         <div className="text-sm font-medium text-gray-900">
                                           {formatDate(rate.hotel_season?.start_date || '')} - {formatDate(rate.hotel_season?.end_date || '')}
                                         </div>
                                         <div className="text-lg font-semibold text-green-600">
                                           ${rate.rate.toFixed(2)}
                                         </div>
                                                                                                                             <div className="text-xs text-gray-500 mt-1">
                                            {getPricingTypeAbbreviation(rate.hotel_rates_option?.option_name || '')} • {rate.currency?.currency_name}
                                          </div>
                                       </div>
                                       <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                                         <button
                                           onClick={() => handleEdit(rate)}
                                           className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                                         >
                                           Edit
                                         </button>
                                         <button
                                           onClick={() => {
                                             if (confirm(`Delete this rate for ${formatDate(rate.hotel_season?.start_date || '')} - ${formatDate(rate.hotel_season?.end_date || '')}?`)) {
                                               handleDelete(rate.id);
                                             }
                                           }}
                                           className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                                         >
                                           Delete
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           ));
                         })()}
                       </div>
                     </td>
                   </tr>
                 )}
               </React.Fragment>
             ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sortedGroupedRates.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hotel rates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No hotel rates match your search for "${searchQuery}". Try adjusting your search terms.`
              : "Get started by adding your first hotel rate to the system."
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

      <AddHotelRateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRate(null);
        }}
        onSuccess={() => {
          fetchRates();
        }}
        editingRate={editingRate}
      />
    </>
  );
}