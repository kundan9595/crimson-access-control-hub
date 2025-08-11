import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, Upload } from 'lucide-react';
import { BaseProductFormData } from '@/lib/validation/schemas';
import ImageUpload from '@/components/ui/ImageUpload';

interface MediaStepProps {
  form: UseFormReturn<BaseProductFormData>;
}

export const MediaStep: React.FC<MediaStepProps> = ({ form }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Media & Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Image */}
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Upload product image"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Base Icon */}
        <FormField
          control={form.control}
          name="base_icon_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Icon</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Upload base icon"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="status-active"
                    value="active"
                    checked={field.value === 'active'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="status-active" className="text-sm font-medium">
                    Active
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
