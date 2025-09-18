"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  searchQuery?: string;
  title?: string;
  description?: string;
  searchFields?: string[];
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  bulkActions?: Array<{
    label: string;
    value: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
  onAddNew?: () => void;
  addNewLabel?: string;
  itemsPerPage?: number;
  showPagination?: boolean;
  showBulkSelection?: boolean;
}

export function DataTable({ 
  columns, 
  data, 
  searchQuery = '', 
  title, 
  description, 
  searchFields = [],
  onBulkAction,
  bulkActions = [],
  onAddNew,
  addNewLabel = "Add New",
  itemsPerPage: customItemsPerPage = 10,
  showPagination = true,
  showBulkSelection = true
}: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = customItemsPerPage;

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (!searchQuery || searchQuery.trim() === '') return data;
    
    return data.filter((row) => {
      if (searchFields.length === 0) {
        // Search in all string fields
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return searchFields.some(field => 
        String(row[field]).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!filteredData || !Array.isArray(filteredData)) return [];
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!sortedData || !Array.isArray(sortedData)) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);

  // Reset to first page when itemsPerPage changes
  useEffect(() => {
    console.log('DataTable itemsPerPage changed to:', itemsPerPage);
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedRows.size > 0) {
      onBulkAction(action, Array.from(selectedRows));
      setSelectedRows(new Set()); // Clear selection after action
    }
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-900" />
      : <ChevronDown className="h-4 w-4 text-gray-900" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
              {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>
            <div className="flex space-x-3">
              {onAddNew && (
                <Button 
                  onClick={onAddNew}
                  className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addNewLabel}
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedRows.size > 0 && bulkActions.length > 0 && (
        <div className="px-6 py-3 bg-[var(--theme-green)]/10 border border-[var(--theme-green)]/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-[var(--theme-green)]">
                {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.value}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => handleBulkAction(action.value)}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRows(new Set())}
                className="text-xs text-[var(--theme-green)] hover:text-[var(--theme-green-dark)]"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--gray)]">
          <thead className="bg-[var(--bg-fade)]">
            <tr>
              {showBulkSelection && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-[var(--gray)] text-[var(--theme-green)] focus:ring-[var(--theme-green)] focus:ring-2 focus:ring-offset-2"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                                     className={`px-6 py-3 text-left text-xs font-medium text-[var(--gray2)] uppercase tracking-wider ${
                     column.sortable ? 'cursor-pointer hover:bg-[var(--bg-fade)]' : ''
                   }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
                     <tbody className="bg-white divide-y divide-[var(--gray)]">
             {paginatedData.map((row) => (
               <tr key={row.id} className="hover:bg-[var(--bg-fade)]">
                 {showBulkSelection && (
                   <td className="px-6 py-4 whitespace-nowrap">
                     <input
                       type="checkbox"
                       checked={selectedRows.has(row.id)}
                       onChange={() => handleSelectRow(row.id)}
                       className="rounded border-[var(--gray)] text-[var(--theme-green)] focus:ring-[var(--theme-green)] focus:ring-2 focus:ring-offset-2"
                     />
                   </td>
                 )}
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      {showPagination && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">
                  {sortedData.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}
                </span>
                {sortedData.length > 0 && (
                  <>
                    <span className="mx-1">to</span>
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span>
                    <span className="mx-1">of</span>
                    <span className="font-medium">{sortedData.length}</span>
                    <span className="ml-1">results</span>
                  </>
                )}
              </div>
              {totalPages > 1 && (
                <div className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
                {/* First Page Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Go to first page"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <ChevronLeft className="h-3 w-3 -ml-1" />
                </Button>

                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(current => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Go to previous page"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Prev
                </Button>
                
                {/* Page Numbers with Ellipsis */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5; // Show max 5 page numbers
                    
                    if (totalPages <= maxVisiblePages) {
                      // If total pages is small, show all pages
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show first page
                      pages.push(1);
                      
                      if (currentPage <= 3) {
                        // Show pages 2, 3, 4, 5, ..., last
                        for (let i = 2; i <= 5; i++) {
                          pages.push(i);
                        }
                        pages.push('...');
                        pages.push(totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        // Show first, ..., last-4, last-3, last-2, last-1, last
                        pages.push('...');
                        for (let i = totalPages - 4; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Show first, ..., current-1, current, current+1, ..., last
                        pages.push('...');
                        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                          pages.push(i);
                        }
                        pages.push('...');
                        pages.push(totalPages);
                      }
                    }
                    
                    return pages.map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500 text-sm">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === page 
                              ? "bg-[var(--theme-green)] text-white hover:bg-[var(--theme-green-dark)]" 
                              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                          title={`Go to page ${page}`}
                        >
                          {page}
                        </Button>
                      )
                    ));
                  })()}
                </div>
                
                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(current => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Go to next page"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>

                {/* Last Page Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Go to last page"
                >
                  <ChevronRight className="h-3 w-3" />
                  <ChevronRight className="h-3 w-3 -mr-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      
    </div>
  );
} 