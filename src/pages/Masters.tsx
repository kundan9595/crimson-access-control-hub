
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BrandsList from '@/components/masters/BrandsList';
import CategoriesList from '@/components/masters/CategoriesList';
import ColorsList from '@/components/masters/ColorsList';
import BrandDialog from '@/components/masters/BrandDialog';
import CategoryDialog from '@/components/masters/CategoryDialog';
import ColorDialog from '@/components/masters/ColorDialog';

const Masters = () => {
  const [activeTab, setActiveTab] = useState('brands');
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);

  const handleAddNew = () => {
    switch (activeTab) {
      case 'brands':
        setBrandDialogOpen(true);
        break;
      case 'categories':
        setCategoryDialogOpen(true);
        break;
      case 'colors':
        setColorDialogOpen(true);
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Masters</h1>
          <p className="text-muted-foreground">Manage brands, categories, and colors</p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-4">
          <BrandsList />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoriesList />
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <ColorsList />
        </TabsContent>
      </Tabs>

      <BrandDialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen} />
      <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
      <ColorDialog open={colorDialogOpen} onOpenChange={setColorDialogOpen} />
    </div>
  );
};

export default Masters;
