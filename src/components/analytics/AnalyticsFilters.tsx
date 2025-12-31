import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, RotateCcw, RefreshCw, X } from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { cn } from '@/lib/utils';

export interface AnalyticsFilters {
  dateRange: { from: Date; to: Date };
  departments: string[];
  teams: string[];
  manager: string | null;
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onRefresh: () => void;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  isLoading?: boolean;
}

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
const TEAMS = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Omega'];

export function AnalyticsFiltersComponent({
  filters,
  onFiltersChange,
  onRefresh,
  lastUpdated,
  autoRefresh,
  onAutoRefreshChange,
  isLoading = false
}: AnalyticsFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const presetRanges = [
    { label: 'Last 30 days', from: subDays(new Date(), 30), to: new Date() },
    { label: 'Last 90 days', from: subDays(new Date(), 90), to: new Date() },
    { label: 'Last 6 months', from: subMonths(new Date(), 6), to: new Date() },
    { label: 'Last year', from: subYears(new Date(), 1), to: new Date() },
  ];

  const handlePresetClick = (from: Date, to: Date) => {
    onFiltersChange({ ...filters, dateRange: { from, to } });
    setIsDatePickerOpen(false);
  };

  const toggleDepartment = (dept: string) => {
    const newDepts = filters.departments.includes(dept)
      ? filters.departments.filter(d => d !== dept)
      : [...filters.departments, dept];
    onFiltersChange({ ...filters, departments: newDepts });
  };

  const toggleTeam = (team: string) => {
    const newTeams = filters.teams.includes(team)
      ? filters.teams.filter(t => t !== team)
      : [...filters.teams, team];
    onFiltersChange({ ...filters, teams: newTeams });
  };

  const resetFilters = () => {
    onFiltersChange({
      dateRange: { from: subDays(new Date(), 30), to: new Date() },
      departments: [],
      teams: [],
      manager: null
    });
  };

  const hasActiveFilters = filters.departments.length > 0 || filters.teams.length > 0 || filters.manager;

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range Picker */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(filters.dateRange.from, 'MMM d, yyyy')} - {format(filters.dateRange.to, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="border-r p-3 space-y-1">
                {presetRanges.map(({ label, from, to }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handlePresetClick(from, to)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onFiltersChange({ ...filters, dateRange: { from: range.from, to: range.to } });
                  }
                }}
                numberOfMonths={2}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Departments Multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              Departments
              {filters.departments.length > 0 && (
                <Badge variant="secondary" className="ml-2">{filters.departments.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2">
            <div className="space-y-1">
              {DEPARTMENTS.map(dept => (
                <Button
                  key={dept}
                  variant={filters.departments.includes(dept) ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => toggleDepartment(dept)}
                >
                  {dept}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Teams Multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[120px]">
              <Filter className="mr-2 h-4 w-4" />
              Teams
              {filters.teams.length > 0 && (
                <Badge variant="secondary" className="ml-2">{filters.teams.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2">
            <div className="space-y-1">
              {TEAMS.map(team => (
                <Button
                  key={team}
                  variant={filters.teams.includes(team) ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => toggleTeam(team)}
                >
                  {team}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Manager Select */}
        <Select
          value={filters.manager || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, manager: value === 'all' ? null : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            <SelectItem value="manager-1">John Smith</SelectItem>
            <SelectItem value="manager-2">Sarah Johnson</SelectItem>
            <SelectItem value="manager-3">Mike Williams</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        )}

        <div className="flex-1" />

        {/* Auto-refresh Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onAutoRefreshChange(!autoRefresh)}
          >
            <RefreshCw className={cn('h-4 w-4', autoRefresh && 'animate-spin')} />
          </Button>
          <span className="text-xs text-muted-foreground">
            {lastUpdated ? `Updated ${format(lastUpdated, 'h:mm a')}` : 'Loading...'}
          </span>
        </div>

        {/* Manual Refresh */}
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.departments.map(dept => (
            <Badge key={dept} variant="secondary" className="gap-1">
              {dept}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleDepartment(dept)} />
            </Badge>
          ))}
          {filters.teams.map(team => (
            <Badge key={team} variant="secondary" className="gap-1">
              {team}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTeam(team)} />
            </Badge>
          ))}
          {filters.manager && (
            <Badge variant="secondary" className="gap-1">
              Manager: {filters.manager}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, manager: null })} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
