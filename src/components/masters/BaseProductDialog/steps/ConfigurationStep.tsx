import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Settings, Tag } from 'lucide-react';
import { BaseProductFormData } from '@/lib/validation/schemas';
import { SizeGroup, Part } from '@/services/masters/types';

interface ConfigurationStepProps {
  form: UseFormReturn<BaseProductFormData>;
  sizeGroups: SizeGroup[];
  parts: Part[];
}

const BRANDING_SIDE_OPTIONS = [
  'Front Side',
  'Back Side',
  'Left Sleeves',
  'Right Sleeves',
  'Inner Label'
] as const;

export const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  form,
  sizeGroups,
  parts,
}) => {
  const selectedSizeGroups = form.watch('size_group_ids') || [];
  const selectedParts = form.watch('parts') || [];
  const selectedBrandingSides = form.watch('branding_sides') || [];

  const handleSizeGroupToggle = (sizeGroupId: string, checked: boolean) => {
    const currentGroups = form.getValues('size_group_ids') || [];
    const newGroups = checked
      ? [...currentGroups, sizeGroupId]
      : currentGroups.filter(id => id !== sizeGroupId);
    form.setValue('size_group_ids', newGroups);
  };

  const handlePartToggle = (partId: string, checked: boolean) => {
    const currentParts = form.getValues('parts') || [];
    const newParts = checked
      ? [...currentParts, partId]
      : currentParts.filter(id => id !== partId);
    form.setValue('parts', newParts);
  };

  const handleBrandingSideToggle = (side: string, checked: boolean) => {
    const currentSides = form.getValues('branding_sides') || [];
    const newSides = checked
      ? [...currentSides, side]
      : currentSides.filter(s => s !== side);
    form.setValue('branding_sides', newSides);
  };

  const removeSizeGroup = (sizeGroupId: string) => {
    handleSizeGroupToggle(sizeGroupId, false);
  };

  const removePart = (partId: string) => {
    handlePartToggle(partId, false);
  };

  const removeBrandingSide = (side: string) => {
    handleBrandingSideToggle(side, false);
  };

  return (
    <div className="space-y-6">
      {/* Size Groups Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Size Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sizeGroups.map((sizeGroup) => (
              <div key={sizeGroup.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-group-${sizeGroup.id}`}
                  checked={selectedSizeGroups.includes(sizeGroup.id)}
                  onCheckedChange={(checked) => 
                    handleSizeGroupToggle(sizeGroup.id, checked as boolean)
                  }
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

          {selectedSizeGroups.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Size Groups:</label>
              <div className="flex flex-wrap gap-2">
                {selectedSizeGroups.map((groupId) => {
                  const sizeGroup = sizeGroups.find(sg => sg.id === groupId);
                  return (
                    <Badge
                      key={groupId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeSizeGroup(groupId)}
                    >
                      {sizeGroup?.name || groupId}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parts Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Parts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parts.map((part) => (
              <div key={part.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`part-${part.id}`}
                  checked={selectedParts.includes(part.id)}
                  onCheckedChange={(checked) => 
                    handlePartToggle(part.id, checked as boolean)
                  }
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

          {selectedParts.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Parts:</label>
              <div className="flex flex-wrap gap-2">
                {selectedParts.map((partId) => {
                  const part = parts.find(p => p.id === partId);
                  return (
                    <Badge
                      key={partId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removePart(partId)}
                    >
                      {part?.name || partId}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branding Sides Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Branding Sides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRANDING_SIDE_OPTIONS.map((side) => (
              <div key={side} className="flex items-center space-x-2">
                <Checkbox
                  id={`branding-side-${side}`}
                  checked={selectedBrandingSides.includes(side)}
                  onCheckedChange={(checked) => 
                    handleBrandingSideToggle(side, checked as boolean)
                  }
                />
                <label
                  htmlFor={`branding-side-${side}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {side}
                </label>
              </div>
            ))}
          </div>

          {selectedBrandingSides.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Branding Sides:</label>
              <div className="flex flex-wrap gap-2">
                {selectedBrandingSides.map((side) => (
                  <Badge
                    key={side}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeBrandingSide(side)}
                  >
                    {side}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
