import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MultipleImageUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  disabled?: boolean;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  onImagesUploaded,
  placeholder = "Upload multiple images",
  accept = "image/*",
  maxSize = 5,
  maxFiles = 10,
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select valid image files only';
    }

    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const handleFiles = async (files: File[]) => {
    if (files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images at once`);
      return;
    }

    // Validate all files first
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    
    const uploadedUrls: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Generate a unique filename
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${i}.${fileExt}`;
          
          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from('master-images')
            .upload(fileName, file);

          if (error) {
            console.error('Upload error for', file.name, ':', error);
            errorCount++;
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('master-images')
            .getPublicUrl(data.path);

          uploadedUrls.push(urlData.publicUrl);
          successCount++;
          
          // Update progress
          setUploadProgress(((i + 1) / files.length) * 100);
          
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          errorCount++;
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (successCount > 0) {
        onImagesUploaded(uploadedUrls);
        toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`);
      }

      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''}`);
      }

    } catch (error) {
      console.error('Error in batch upload:', error);
      toast.error('An error occurred during upload');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Clear the file input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors
          ${dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{placeholder}</p>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to select multiple images
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files, {maxSize}MB each
            </p>
          </div>
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
            <p className="text-sm text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultipleImageUpload; 