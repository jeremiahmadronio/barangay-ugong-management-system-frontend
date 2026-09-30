import React from "react";
import { Search, Filter, RotateCcw } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  label: string;
  key: string;
  type?: 'select' | 'text';
  options?: FilterOption[];
  value?: string;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export interface DateRangeConfig {
  startLabel?: string;
  endLabel?: string;
  startValue?: string;
  endValue?: string;
  maxDate?: string;
  onStartChange?: (value: string) => void;
  onEndChange?: (value: string) => void;
}

export interface TableFilterProps {
  search?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  bottomFilters?: FilterConfig[];
  onFilterChange?: (key: string, value: string) => void;
  onFilterClick?: () => void;
  onClearClick?: () => void;
  showSearch?: boolean;
  showFilterButton?: boolean;
  showClearButton?: boolean;
  filterButtonText?: string;
  clearButtonText?: string;
  dateRange?: DateRangeConfig;
  dateRangePosition?: 'top' | 'bottom';
  activeFilterCount?: number;
  disabled?: boolean;
  customSelect?: boolean;
  hideSearchLabel?: boolean;
}

export const TableFilter: React.FC<TableFilterProps> = ({
  search,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  bottomFilters = [],
  onFilterChange,
  onFilterClick,
  onClearClick,
  showSearch = true,
  showFilterButton = true,
  showClearButton = true,
  filterButtonText = "Apply Filter",
  clearButtonText = "Clear",
  dateRange,
  activeFilterCount = 0,
  disabled = false,
}) => {
  const currentSearch = searchValue || search || "";
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {showSearch && onSearchChange && (
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={currentSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              disabled={disabled}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
            />
          </div>
        )}

        {filters.map((f) => (
          <div key={f.key} className="min-w-[150px]">
            {f.type === 'text' ? (
              <input
                type="text"
                placeholder={f.placeholder || f.label}
                value={f.value || ""}
                onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                disabled={disabled || f.disabled}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            ) : (
              <select
                value={f.value || ""}
                onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                disabled={disabled || f.disabled}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 cursor-pointer"
              >
                <option value="">All {f.label}</option>
                {f.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        {dateRange && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{dateRange.startLabel || "From"}:</span>
              <input
                type="date"
                value={dateRange.startValue || ""}
                max={dateRange.maxDate}
                onChange={(e) => dateRange.onStartChange && dateRange.onStartChange(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{dateRange.endLabel || "To"}:</span>
              <input
                type="date"
                value={dateRange.endValue || ""}
                max={dateRange.maxDate}
                onChange={(e) => dateRange.onEndChange && dateRange.onEndChange(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {showFilterButton && onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              disabled={disabled}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5" />
              {filterButtonText}
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {showClearButton && onClearClick && (
            <button
              type="button"
              onClick={onClearClick}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {clearButtonText}
            </button>
          )}
        </div>
      </div>

      {bottomFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          {bottomFilters.map((f) => (
            <div key={f.key} className="min-w-[150px]">
              <select
                value={f.value || ""}
                onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                disabled={disabled || f.disabled}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 cursor-pointer"
              >
                <option value="">All {f.label}</option>
                {f.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
