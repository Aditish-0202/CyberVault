import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortKey?: string;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  // Filtering & Searching
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No results found',
  className,
  sortBy,
  sortOrder,
  onSort,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  page,
  totalPages,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Table Toolbar */}
      {(onSearchChange !== undefined || filters) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          {onSearchChange !== undefined && (
            <div className="relative w-full sm:max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-black/20 border border-primary/10 rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all font-mono"
              />
            </div>
          )}
          {filters && (
            <div className="flex items-center gap-2">
              <div className="p-2 bg-black/20 border border-primary/10 rounded-xl text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/20 border-b border-primary/10">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    onClick={() => {
                      if (!col.sortable || !onSort) return;
                      const key = col.sortKey ?? (typeof col.accessor === 'string' ? col.accessor as string : undefined);
                      if (key) onSort(key);
                    }}
                    className={cn(
                      "px-6 py-4 font-semibold tracking-wider",
                      col.sortable && "cursor-pointer hover:text-white transition-colors select-none group",
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {col.sortable && (() => {
                        const key = col.sortKey ?? (typeof col.accessor === 'string' ? col.accessor as string : undefined);
                        if (!key) return null;
                        return sortBy === key
                          ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />)
                          : <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
                      })()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-primary/5">
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="px-6 py-4">
                        <div className="h-4 bg-primary/10 rounded animate-pulse w-2/3"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground font-mono">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className={cn("px-6 py-4 whitespace-nowrap", col.className)}>
                        {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground font-mono">
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, (page || 1) - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-primary/20 bg-black/20 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(totalPages, (page || 1) + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-primary/20 bg-black/20 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}