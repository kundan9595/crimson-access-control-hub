import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchColors,
  createColor,
  updateColor,
  deleteColor,
  fetchSizeGroups,
  createSizeGroup,
  updateSizeGroup,
  deleteSizeGroup,
  fetchSizes,
  createSize,
  updateSize,
  deleteSize,
  fetchZones,
  createZone,
  updateZone,
  deleteZone,
  fetchPriceTypes,
  createPriceType,
  updatePriceType,
  deletePriceType,
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  Brand,
  Category,
  Color,
  SizeGroup,
  Size,
  Zone,
  PriceType,
  Vendor,
} from '@/services/mastersService';

// Brand hooks
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Success",
        description: "Brand created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating brand:', error);
      toast({
        title: "Error",
        description: "Failed to create brand",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Brand> }) =>
      updateBrand(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Success",
        description: "Brand updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating brand:', error);
      toast({
        title: "Error",
        description: "Failed to update brand",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Success",
        description: "Brand deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting brand:', error);
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      });
    },
  });
};

// Category hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Category> }) =>
      updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });
};

// Color hooks
export const useColors = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: fetchColors,
  });
};

export const useCreateColor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast({
        title: "Success",
        description: "Color created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating color:', error);
      toast({
        title: "Error",
        description: "Failed to create color",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateColor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Color> }) =>
      updateColor(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast({
        title: "Success",
        description: "Color updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating color:', error);
      toast({
        title: "Error",
        description: "Failed to update color",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteColor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast({
        title: "Success",
        description: "Color deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting color:', error);
      toast({
        title: "Error",
        description: "Failed to delete color",
        variant: "destructive",
      });
    },
  });
};

// Size Group hooks
export const useSizeGroups = () => {
  return useQuery({
    queryKey: ['sizeGroups'],
    queryFn: fetchSizeGroups,
  });
};

export const useCreateSizeGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createSizeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizeGroups'] });
      toast({
        title: "Success",
        description: "Size group created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating size group:', error);
      toast({
        title: "Error",
        description: "Failed to create size group",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSizeGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SizeGroup> }) =>
      updateSizeGroup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizeGroups'] });
      toast({
        title: "Success",
        description: "Size group updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating size group:', error);
      toast({
        title: "Error",
        description: "Failed to update size group",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSizeGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteSizeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizeGroups'] });
      toast({
        title: "Success",
        description: "Size group deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting size group:', error);
      toast({
        title: "Error",
        description: "Failed to delete size group",
        variant: "destructive",
      });
    },
  });
};

// Size hooks
export const useSizes = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: fetchSizes,
  });
};

export const useCreateSize = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createSize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast({
        title: "Success",
        description: "Size created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating size:', error);
      toast({
        title: "Error",
        description: "Failed to create size",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSize = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Size> }) =>
      updateSize(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast({
        title: "Success",
        description: "Size updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating size:', error);
      toast({
        title: "Error",
        description: "Failed to update size",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSize = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteSize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast({
        title: "Success",
        description: "Size deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting size:', error);
      toast({
        title: "Error",
        description: "Failed to delete size",
        variant: "destructive",
      });
    },
  });
};

// Zone hooks
export const useZones = () => {
  return useQuery({
    queryKey: ['zones'],
    queryFn: fetchZones,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Success",
        description: "Zone created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating zone:', error);
      toast({
        title: "Error",
        description: "Failed to create zone",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateZone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Zone> }) =>
      updateZone(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Success",
        description: "Zone updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating zone:', error);
      toast({
        title: "Error",
        description: "Failed to update zone",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Success",
        description: "Zone deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting zone:', error);
      toast({
        title: "Error",
        description: "Failed to delete zone",
        variant: "destructive",
      });
    },
  });
};

// Price Type hooks
export const usePriceTypes = () => {
  return useQuery({
    queryKey: ['priceTypes'],
    queryFn: fetchPriceTypes,
  });
};

export const useCreatePriceType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createPriceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating price type:', error);
      toast({
        title: "Error",
        description: "Failed to create price type",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePriceType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PriceType> }) =>
      updatePriceType(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating price type:', error);
      toast({
        title: "Error",
        description: "Failed to update price type",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePriceType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deletePriceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting price type:', error);
      toast({
        title: "Error",
        description: "Failed to delete price type",
        variant: "destructive",
      });
    },
  });
};

// Vendor hooks
export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to create vendor",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Vendor> }) =>
      updateVendor(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });
};
