import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { BaseProductStepProps } from '../types';

export const CategoriesStep: React.FC<BaseProductStepProps> = ({ 
  form, 
  categories, 
  fabrics, 
  parts, 
  sizeGroups 
}) => {
  const [sizeGroupSearchTerm, setSizeGroupSearchTerm] = useState('');
  const [partSearchTerm, setPartSearchTerm] = useState('');

  const selectedSizeGroups = sizeGroups.filter(sizeGroup =>
    form.getValues('size_group_ids')?.includes(sizeGroup.id)
  );

  const selectedParts = parts.filter(part =>
    form.getValues('parts')?.includes(part.id)
  );

  const filteredSizeGroups = sizeGroups.filter(sizeGroup =>
    sizeGroup.name.toLowerCase().includes(sizeGroupSearchTerm.toLowerCase()) ||
    (sizeGroup.description && sizeGroup.description.toLowerCase().includes(sizeGroupSearchTerm.toLowerCase()))
  );

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  const handleSizeGroupToggle = (sizeGroupId: string, checked: boolean) => {
    const currentSizeGroups = form.getValues('size_group_ids') || [];
    if (checked) {
      form.setValue('size_group_ids', [...currentSizeGroups, sizeGroupId]);
    } else {
      form.setValue('size_group_ids', currentSizeGroups.filter(id => id !== sizeGroupId));
    }
  };

  const removeSizeGroup = (sizeGroupId: string) => {
    const currentSizeGroups = form.getValues('size_group_ids') || [];
    form.setValue('size_group_ids', currentSizeGroups.filter(id => id !== sizeGroupId));
  };

  const addPart = (partId: string) => {
    const currentParts = form.getValues('parts') || [];
    if (!currentParts.includes(partId)) {
      form.setValue('parts', [...currentParts, partId]);
    }
  };

  const removePart = (partId: string) => {
    const currentParts = form.getValues('parts') || [];
    form.setValue('parts', currentParts.filter(id => id !== partId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Categories & Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fabric_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fabric</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fabric" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fabrics.map((fabric) => (
                      <SelectItem key={fabric.id} value={fabric.id}>
                        {fabric.name} ({fabric.fabric_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem>
          <FormLabel>Size Groups</FormLabel>
          <div className="space-y-4">
            {/* Selected Size Groups */}
            {selectedSizeGroups.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Size Groups</label>
                <div className="flex flex-wrap gap-2">
                  {selectedSizeGroups.map((sizeGroup) => (
                    <Badge key={sizeGroup.id} variant="secondary" className="gap-1">
                      {sizeGroup.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeSizeGroup(sizeGroup.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Size Group Selection */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search size groups..."
                  value={sizeGroupSearchTerm}
                  onChange={(e) => setSizeGroupSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredSizeGroups.map((sizeGroup) => (
                  <div key={sizeGroup.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-group-${sizeGroup.id}`}
                      checked={form.getValues('size_group_ids')?.includes(sizeGroup.id)}
                      onCheckedChange={(checked) => handleSizeGroupToggle(sizeGroup.id, checked as boolean)}
                    />
                    <label
                      htmlFor={`size-group-${sizeGroup.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {sizeGroup.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FormItem>

        <FormItem>
          <FormLabel>Parts</FormLabel>
          <div className="space-y-4">
            {/* Selected Parts */}
            {selectedParts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Parts</label>
                <div className="flex flex-wrap gap-2">
                  {selectedParts.map((part) => (
                    <Badge key={part.id} variant="secondary" className="gap-1">
                      {part.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removePart(part.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Part Selection */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts..."
                  value={partSearchTerm}
                  onChange={(e) => setPartSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredParts.map((part) => (
                  <div key={part.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`part-${part.id}`}
                      checked={form.getValues('parts')?.includes(part.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          addPart(part.id);
                        } else {
                          removePart(part.id);
                        }
                      }}
                    />
                    <label
                      htmlFor={`part-${part.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {part.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FormItem>
      </CardContent>
    </Card>
  );
};
