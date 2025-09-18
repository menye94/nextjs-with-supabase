"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Search, Filter } from "lucide-react";

interface RoomPriceTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

export function RoomPriceTable({ searchQuery, onSearchChange }: RoomPriceTableProps) {
  const [roomPrices] = useState<any[]>([]);

  const columns = [
    {
      key: 'hotel',
      label: 'Hotel',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'room_type',
      label: 'Room Type',
      sortable: true,
      render: (value: string) => <span>{value}</span>,
    },
    {
      key: 'season',
      label: 'Season',
      sortable: true,
      render: (value: string) => <span>{value}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number) => <span>${value}</span>,
    },
    {
      key: 'currency',
      label: 'Currency',
      sortable: true,
      render: (value: string) => <span>{value}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: () => <span>Actions</span>,
    },
  ];

  return (
    <>
      {/* Header Section with Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Room Prices</h2>
            <p className="text-sm text-gray-500 mt-1">Manage room prices and their configurations</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
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
              placeholder="Search for room prices..."
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                }
              }}
              className="pl-10 w-96 text-gray-900 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
            />
          </div>

          {/* Filters Button */}
          <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={roomPrices}
        searchQuery={searchQuery}
        searchFields={['hotel', 'room_type']}
      />
    </>
  );
} 