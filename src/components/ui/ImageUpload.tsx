
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  placeholder = "Upload an image",
  accept = "image/*",
  maxSize = 5,
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    
    try {
      // Create a local URL for preview
      const url = URL.createObjectURL(file);
      onChange(url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleRemove = () => {
    if (value && value.startsWith('blob:')) {
      URL.revokeObjectURL(value);
    }
    onRemove();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!value ? (
        <>
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
              onChange={handleChange}
              className="hidden"
              disabled={disabled}
            />
            
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{placeholder}</p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Max size: {maxSize}MB
                </p>
              </div>
            </div>
            
            {uploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Or enter image URL</Label>
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              onChange={handleUrlChange}
              disabled={disabled}
            />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={value}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border"
              onError={() => {
                // If image fails to load, show placeholder
                console.error('Failed to load image:', value);
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              type="url"
              value={value}
              onChange={handleUrlChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
