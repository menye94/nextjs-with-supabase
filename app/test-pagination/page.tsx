"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";

// Generate test data
const generateTestData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    category: `Category ${Math.floor(i / 10) + 1}`,
    price: Math.floor(Math.random() * 1000) + 10,
    status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Inactive' : 'Pending'
  }));
};

const testData = generateTestData(150);

const columns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    render: (value: number) => `$${value}`,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value === 'Active' ? 'bg-green-100 text-green-800' :
        value === 'Inactive' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {value}
      </span>
    ),
  },
];

export default function TestPaginationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pagination Test Page</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Items per page:
        </label>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-64"
        />
      </div>

      <DataTable
        columns={columns}
        data={testData}
        searchQuery={searchQuery}
        searchFields={['name', 'category', 'status']}
        itemsPerPage={itemsPerPage}
        showPagination={true}
      />
    </div>
  );
}

