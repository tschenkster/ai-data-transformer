import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { UserFilters as UserFiltersType } from '@/features/user-management/types';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: UserFiltersType) => void;
  availableRoles: string[];
}

export function UserFilters({ filters, onFiltersChange, availableRoles }: UserFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'archived', label: 'Archived' }
  ];

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    ...availableRoles.map(role => ({
      value: role,
      label: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  ];

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      role: 'all'
    });
  };

  const activeFiltersCount = [
    filters.search && 'search',
    filters.status !== 'all' && 'status',
    filters.role !== 'all' && 'role'
  ].filter(Boolean).length;

  const getFilterBadges = () => {
    const badges = [];
    
    if (filters.search) {
      badges.push(
        <Badge key="search" variant="secondary" className="gap-1">
          Search: "{filters.search}"
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => onFiltersChange({ ...filters, search: '' })}
          />
        </Badge>
      );
    }
    
    if (filters.status !== 'all') {
      const statusLabel = statusOptions.find(s => s.value === filters.status)?.label;
      badges.push(
        <Badge key="status" variant="secondary" className="gap-1">
          Status: {statusLabel}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => onFiltersChange({ ...filters, status: 'all' })}
          />
        </Badge>
      );
    }
    
    if (filters.role !== 'all') {
      const roleLabel = roleOptions.find(r => r.value === filters.role)?.label;
      badges.push(
        <Badge key="role" variant="secondary" className="gap-1">
          Role: {roleLabel}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => onFiltersChange({ ...filters, role: 'all' })}
          />
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Primary Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 pr-4 h-11"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.role}
            onValueChange={(value) => onFiltersChange({ ...filters, role: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {getFilterBadges()}
        </div>
      )}
    </div>
  );
}