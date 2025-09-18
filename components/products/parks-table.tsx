"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddParkForm } from "@/components/products/add-park-form";

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

export default function ParksTable() {
  const [parks, setParks] = useState<Park[]>([]);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPark, setEditingPark] = useState<Park | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCircuit, setSelectedCircuit] = useState<string>("");
  const [circuitsLoading, setCircuitsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchParks();
    fetchCircuits();
  }, []);

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
        .order('national_park_name');

      if (selectedCircuit) {
        query = query.eq('park_circuit_id', selectedCircuit);
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this park?')) return;

    try {
      const { error } = await supabase
        .from('national_parks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchParks();
    } catch (error) {
      console.error('Error deleting park:', error);
      alert('Error deleting park. Please try again.');
    }
  };

  const handleEdit = (park: Park) => {
    console.log('ParksTable: handleEdit called with park:', park);
    setEditingPark(park);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingPark(null);
    setShowModal(true);
  };

  const handleAddSuccess = () => {
    setShowModal(false);
    fetchParks();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPark(null);
  };

  const handleCircuitFilterChange = (circuitId: string) => {
    setSelectedCircuit(circuitId);
    fetchParks();
  };

  const filteredParks = parks.filter(park => 
    park.national_park_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'national_park_name',
      label: 'Park Name',
      render: (value: any, row: Park) => (
        <span className="font-medium text-gray-900">{row.national_park_name}</span>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (value: any, row: Park) => (
        <span className="text-gray-600">
          {row.country?.country_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'circuit',
      label: 'Circuit',
      render: (value: any, row: Park) => (
        <span className="text-gray-600">
          {row.circuit?.national_park_circuit_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: any, row: Park) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Park) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
                         className="text-theme-green hover:text-theme-green-dark"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading parks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900">National Parks</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Park
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center bg-white">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search parks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>
        <div className="w-64">
          <select
            value={selectedCircuit}
            onChange={(e) => handleCircuitFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Circuits</option>
            {circuits.map((circuit) => (
              <option key={circuit.id} value={circuit.id}>
                {circuit.national_park_circuit_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Parks Table */}
      <DataTable
        data={filteredParks}
        columns={columns}
        searchQuery={searchTerm}
        searchFields={['national_park_name']}
        showBulkSelection={false}
        itemsPerPage={10}
        showPagination={true}
      />

      {/* Tailwind CSS Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-all duration-300 ease-in-out backdrop-blur-sm"
            onClick={handleCloseModal}
          ></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all w-full max-w-2xl border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPark ? 'Edit Park' : 'Add New Park'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:ring-offset-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <AddParkForm
                  park={editingPark}
                  onSuccess={handleAddSuccess}
                  onClose={handleCloseModal}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 