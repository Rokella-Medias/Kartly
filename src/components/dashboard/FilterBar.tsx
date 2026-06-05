import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Marketplace, OrderFilters } from '@/types/orders';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const handleMarketplaceChange = (value: string) => {
    onFiltersChange({
      ...filters,
      marketplace: value as Marketplace | 'all',
    });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        from: range.from,
        to: range.to,
      },
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { from: undefined, to: undefined },
      marketplace: 'all',
      search: '',
    });
  };

  const hasActiveFilters = 
    filters.marketplace !== 'all' || 
    filters.dateRange.from || 
    filters.dateRange.to;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border">
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal w-full sm:w-auto sm:min-w-[240px]',
              !filters.dateRange.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, 'LLL dd, y')} -{' '}
                  {format(filters.dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(filters.dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange.from}
            selected={{
              from: filters.dateRange.from,
              to: filters.dateRange.to,
            }}
            onSelect={(range) => handleDateRangeChange(range || { from: undefined, to: undefined })}
            numberOfMonths={1}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Marketplace Filter */}
      <Select value={filters.marketplace} onValueChange={handleMarketplaceChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Marketplace" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Marketplaces</SelectItem>
          <SelectItem value="amazon">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amazon" />
              Amazon
            </span>
          </SelectItem>
          <SelectItem value="flipkart">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-flipkart" />
              Flipkart
            </span>
          </SelectItem>
          <SelectItem value="meesho">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-meesho" />
              Meesho
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
