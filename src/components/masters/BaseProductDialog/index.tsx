import React, { useState } from 'react';
import { BaseFormDialog } from '../shared/BaseFormDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useBaseProductForm } from './hooks/useBaseProductForm';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PricingStep } from './steps/PricingStep';
import { ConfigurationStep } from './steps/ConfigurationStep';
import { MediaStep } from './steps/MediaStep';
import { useCategories } from '@/hooks/masters/useCategories';
import { useFabrics } from '@/hooks/masters/useFabrics';
import { useSizeGroups } from '@/hooks/masters/useSizes';
import { useParts } from '@/hooks/masters/useParts';
import { useCreateBaseProduct, useUpdateBaseProduct } from '@/hooks/masters/useBaseProducts';
import { BaseProduct } from '@/services/masters/baseProductsService';
import { BaseProductFormData } from '@/lib/validation/schemas';

interface BaseProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseProduct?: BaseProduct;
}

type DialogStep = 'basic' | 'pricing' | 'configuration' | 'media';

const STEPS: { key: DialogStep; label: string; description: string }[] = [
  { key: 'basic', label: 'Basic Info', description: 'Product details' },
  { key: 'pricing', label: 'Pricing', description: 'Costs and pricing' },
  { key: 'configuration', label: 'Configuration', description: 'Size groups, parts, and branding' },
  { key: 'media', label: 'Media', description: 'Images and status' },
];

export const BaseProductDialog: React.FC<BaseProductDialogProps> = ({
  open,
  onOpenChange,
  baseProduct,
}) => {
  const [currentStep, setCurrentStep] = useState<DialogStep>('basic');
  const { form, isEditing } = useBaseProductForm({ baseProduct });

  // Data hooks
  const { data: categories = [] } = useCategories();
  const { data: fabrics = [] } = useFabrics();
  const { data: sizeGroups = [] } = useSizeGroups();
  const { data: parts = [] } = useParts();

  // Mutation hooks
  const createMutation = useCreateBaseProduct();
  const updateMutation = useUpdateBaseProduct();

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);

  const handleSubmit = async (data: BaseProductFormData) => {
    try {
      if (isEditing && baseProduct) {
        await updateMutation.mutateAsync({ id: baseProduct.id, updates: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
      setCurrentStep('basic');
    } catch (error) {
      console.error('Error saving base product:', error);
    }
  };

  const handleNext = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < STEPS.length) {
      setCurrentStep(STEPS[nextStepIndex].key);
    }
  };

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(STEPS[prevStepIndex].key);
    }
  };

  const handleStepChange = (step: DialogStep) => {
    setCurrentStep(step);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Base Product' : 'Create Base Product'}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isEditing={isEditing}
    >
      <div className="space-y-6">
        {/* Step Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {STEPS.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleStepChange(step.key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentStep === step.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {step.label}
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {currentStep === 'basic' && (
              <BasicInfoStep
                form={form}
                categories={categories}
                fabrics={fabrics}
              />
            )}

            {currentStep === 'pricing' && (
              <PricingStep form={form} />
            )}

            {currentStep === 'configuration' && (
              <ConfigurationStep
                form={form}
                sizeGroups={sizeGroups}
                parts={parts}
              />
            )}

            {currentStep === 'media' && (
              <MediaStep form={form} />
            )}
          </CardContent>
        </Card>

        {/* Step Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Step Progress */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </BaseFormDialog>
  );
};
