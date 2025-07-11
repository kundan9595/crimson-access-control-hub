
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchFilterProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  totalCount?: number;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder,
  value,
  onChange,
  resultCount,
  totalCount,
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {resultCount !== undefined && totalCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultCount} of {totalCount} items
        </div>
      )}
    </div>
  );
};
