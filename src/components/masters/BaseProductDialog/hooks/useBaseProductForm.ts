import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { baseProductSchema, type BaseProductFormData } from '@/lib/validation/schemas';
import { BaseProduct } from '@/services/masters/baseProductsService';

interface UseBaseProductFormProps {
  baseProduct?: BaseProduct;
}

export const useBaseProductForm = ({ baseProduct }: UseBaseProductFormProps) => {
  const form = useForm<BaseProductFormData>({
    resolver: zodResolver(baseProductSchema),
    defaultValues: {
      name: '',
      sort_order: 0,
      calculator: 0,
      category_id: '',
      fabric_id: '',
      size_group_ids: [],
      parts: [],
      base_price: 0,
      base_sn: undefined,
      trims_cost: 0,
      adult_consumption: 0,
      kids_consumption: 0,
      overhead_percentage: 0,
      sample_rate: 0,
      image_url: '',
      base_icon_url: '',
      branding_sides: [],
      status: 'active',
    },
  });

  // Reset form when baseProduct changes (for editing)
  useEffect(() => {
    if (baseProduct) {
      form.reset({
        name: baseProduct.name,
        sort_order: baseProduct.sort_order,
        calculator: baseProduct.calculator || 0,
        category_id: baseProduct.category_id || '',
        fabric_id: baseProduct.fabric_id || '',
        size_group_ids: baseProduct.size_group_ids || [],
        parts: baseProduct.parts || [],
        base_price: baseProduct.base_price,
        base_sn: baseProduct.base_sn,
        trims_cost: baseProduct.trims_cost,
        adult_consumption: baseProduct.adult_consumption,
        kids_consumption: baseProduct.kids_consumption,
        overhead_percentage: baseProduct.overhead_percentage,
        sample_rate: baseProduct.sample_rate,
        image_url: baseProduct.image_url || '',
        base_icon_url: baseProduct.base_icon_url || '',
        branding_sides: baseProduct.branding_sides || [],
        status: baseProduct.status,
      });
    } else {
      // Reset to default values for new product
      form.reset({
        name: '',
        sort_order: 0,
        calculator: 0,
        category_id: '',
        fabric_id: '',
        size_group_ids: [],
        parts: [],
        base_price: 0,
        base_sn: undefined,
        trims_cost: 0,
        adult_consumption: 0,
        kids_consumption: 0,
        overhead_percentage: 0,
        sample_rate: 0,
        image_url: '',
        base_icon_url: '',
        branding_sides: [],
        status: 'active',
      });
    }
  }, [baseProduct, form]);

  const isEditing = !!baseProduct;

  return {
    form,
    isEditing,
  };
};
