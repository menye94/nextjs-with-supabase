"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { AddParkForm } from "@/components/products/add-park-form";
import { MoreHorizontal } from "lucide-react";

interface ParksTableProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
}

interface Park {
  id: number;
  national_park_name: string;
  is_active: boolean;
  country_id: number;
  park_circuit_id: number;
  is_deleted: string | null;
  country?: { country_name: string };
  circuit?: { national_park_circuit_name: string };
}

interface Circuit {
  id: number;
  national_park_circuit_name: string;
}

export function ParksTable({ searchQuery, onSearchChange }: ParksTableProps) {
  const [parks, setParks] = useState<Park[]>([]);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPark, setEditingPark] = useState<Park | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<string>("");
  const [circuitsLoading, setCircuitsLoading] = useState(true);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const supabase = createClient();

  useEffect(() => {
    fetchParks();
    fetchCircuits();
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

  const fetchCircuits = async () => {
    try {
      const { data, error } = await supabase
        .from('national_park_circuit')
        .select('*')
        .order('national_park_circuit_name');

      if (error) {
        console.error('Error fetching circuits:', error);
        return;
      }

      setCircuits(data || []);
    } catch (error) {
      console.error('Error fetching circuits:', error);
    } finally {
      setCircuitsLoading(false);
    }
  };

  const fetchParks = async () => {
    try {
      let query = supabase
        .from('national_parks')
        .select(`
          *,
          country:countries(country_name),
          circuit:national_park_circuit(national_park_circuit_name)
        `)
        .is('is_deleted', null);

      // Apply circuit filter if selected
      if (selectedCircuit) {
        query = query.eq('park_circuit_id', parseInt(selectedCircuit));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching parks:', error);
        return;
      }

      setParks(data || []);
    } catch (error) {
      console.error('Error fetching parks:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'national_park_name',
      label: 'Park Name',
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
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value: any, row: Park) => (
        <div>
          <div className="font-medium">
            {row.country?.country_name 
              ? row.country.country_name.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
              : 'Unknown'
            }
          </div>
          <div className="text-sm text-gray-500">
            {row.circuit?.national_park_circuit_name 
              ? row.circuit.national_park_circuit_name.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
              : 'Unknown Circuit'
            }
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: Park) => (
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
    setEditingPark(null);
    setIsModalOpen(true);
  };

  const handleEdit = (park: Park) => {
    setEditingPark(park);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (park: Park) => {
    if (window.confirm(`Are you sure you want to delete "${park.national_park_name}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('national_parks')
          .update({ is_deleted: new Date().toISOString() })
          .eq('id', park.id);

        if (error) {
          console.error('Error deleting park:', error);
          return;
        }

        fetchParks(); // Refresh the data
        setOpenMenuId(null);
      } catch (error) {
        console.error('Error deleting park:', error);
      }
    }
  };

  const handleCircuitFilterChange = (circuitId: string) => {
    setSelectedCircuit(circuitId);
  };

  const handleAddSuccess = () => {
    fetchParks(); // Refresh the data
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPark(null);
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    try {
      switch (action) {
        case 'delete':
          // Bulk delete selected parks
          for (const id of selectedIds) {
            await handleDelete({ id: parseInt(id) } as Park);
          }
          break;
        case 'activate':
          // Bulk activate selected parks
          const { error: activateError } = await supabase
            .from('national_parks')
            .update({ is_active: true })
            .in('id', selectedIds.map(id => parseInt(id)));
          
          if (activateError) {
            console.error('Error activating parks:', activateError);
          } else {
            fetchParks(); // Refresh the data
          }
          break;
        case 'deactivate':
          // Bulk deactivate selected parks
          const { error: deactivateError } = await supabase
            .from('national_parks')
            .update({ is_active: false })
            .in('id', selectedIds.map(id => parseInt(id)));
          
          if (deactivateError) {
            console.error('Error deactivating parks:', deactivateError);
          } else {
            fetchParks(); // Refresh the data
          }
          break;
        default:
          console.log('Unknown bulk action:', action);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  // Refetch parks when circuit filter changes
  useEffect(() => {
    fetchParks();
  }, [selectedCircuit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading parks...</div>
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
                placeholder="Search for parks..."
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
            {/* Circuit Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedCircuit}
                onChange={(e) => handleCircuitFilterChange(e.target.value)}
                className="block pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm"
              >
                <option value="">All Circuits</option>
                {circuitsLoading ? (
                  <option disabled>Loading circuits...</option>
                ) : (
                                     circuits.map((circuit) => (
                     <option key={circuit.id} value={circuit.id.toString()}>
                       {circuit.national_park_circuit_name.split(' ').map(word => 
                         word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                       ).join(' ')}
                     </option>
                   ))
                )}
              </select>
            </div>

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
        data={parks}
        searchQuery={searchQuery}
        title="Parks"
        description="Manage national parks and their configurations"
        onAddNew={handleAddNew}
        searchFields={['national_park_name']}
        onBulkAction={handleBulkAction}
        bulkActions={[
          { label: 'Activate', value: 'activate', variant: 'default' },
          { label: 'Deactivate', value: 'deactivate', variant: 'secondary' },
          { label: 'Delete', value: 'delete', variant: 'destructive' }
        ]}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPark ? "Edit Park" : "Add New Park"}
      >
        <AddParkForm
          onClose={handleCloseModal}
          onSuccess={handleAddSuccess}
          editPark={editingPark ? {
            id: editingPark.id,
            national_park_name: editingPark.national_park_name,
            country_id: editingPark.country_id,
            park_circuit_id: editingPark.park_circuit_id,
            is_active: editingPark.is_active,
          } : undefined}
        />
      </Modal>
    </>
  );
} 