import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageCellProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  showPlaceholder?: boolean;
  placeholderIcon?: React.ReactNode;
  className?: string;
  enablePreview?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export const ImageCell: React.FC<ImageCellProps> = ({
  src,
  alt = '',
  size = 'md',
  showPlaceholder = true,
  placeholderIcon,
  className = '',
  enablePreview = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    if (!showPlaceholder) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }

    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded-md border text-muted-foreground ${className}`}
      >
        {placeholderIcon || (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onError={() => setHasError(true)}
        onClick={() => enablePreview && setIsOpen(true)}
      />

      {enablePreview && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none">
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-contain max-h-[80vh]"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

interface MultiImageCellProps {
  images: (string | undefined)[];
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const MultiImageCell: React.FC<MultiImageCellProps> = ({
  images,
  alt = '',
  size = 'md',
  showCount = true,
  className = '',
}) => {
  const validImages = images.filter((img): img is string => Boolean(img));
  const primaryImage = validImages[0];
  const additionalCount = validImages.length - 1;

  if (!primaryImage) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ImageCell src={primaryImage} alt={alt} size={size} enablePreview={true} />
      {showCount && additionalCount > 0 && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          +{additionalCount} more
        </span>
      )}
    </div>
  );
};
