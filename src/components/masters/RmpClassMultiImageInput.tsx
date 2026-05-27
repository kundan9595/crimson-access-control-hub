import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import type { RmpClassImageFiles } from '@/services/masters/rmpClassesService';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';

export const RMP_CLASS_IMAGE_SLOT_COUNT = 5;

const IMAGE_SLOTS = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'] as const;
type ImageSlot = (typeof IMAGE_SLOTS)[number];

export type RmpClassImageSlotUrls = Partial<Record<ImageSlot, string | undefined>>;

interface RmpClassMultiImageInputProps {
  existingUrls?: RmpClassImageSlotUrls;
  value: RmpClassImageFiles;
  onChange: (files: RmpClassImageFiles) => void;
  disabled?: boolean;
}

const RmpClassMultiImageInput: React.FC<RmpClassMultiImageInputProps> = ({
  existingUrls = {},
  value,
  onChange,
  disabled = false,
}) => {
  const inputRefs = useRef<Partial<Record<ImageSlot, HTMLInputElement | null>>>({});
  const [previewUrls, setPreviewUrls] = useState<Partial<Record<ImageSlot, string>>>({});

  const filesKey = useMemo(
    () => IMAGE_SLOTS.map((s) => (value[s] ? `${s}:${value[s]!.name}` : '')).join('|'),
    [value],
  );

  useEffect(() => {
    const next: Partial<Record<ImageSlot, string>> = {};
    const toRevoke: string[] = [];

    for (const slot of IMAGE_SLOTS) {
      const file = value[slot];
      if (file) {
        const url = URL.createObjectURL(file);
        next[slot] = url;
        toRevoke.push(url);
      }
    }

    setPreviewUrls(next);
    return () => {
      for (const url of toRevoke) URL.revokeObjectURL(url);
    };
  }, [filesKey, value]);

  const setSlotFile = (slot: ImageSlot, file: File | undefined) => {
    const next = { ...value };
    if (file) {
      next[slot] = file;
    } else {
      delete next[slot];
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <Label>Images (optional)</Label>
      <p className="text-xs text-muted-foreground">
        Upload up to {RMP_CLASS_IMAGE_SLOT_COUNT} images. Leave a slot empty to keep the current image when editing.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {IMAGE_SLOTS.map((slot, index) => {
          const existing = existingUrls[slot];
          const preview = previewUrls[slot] ?? (existing ? proxifyScottImageUrl(existing) : undefined);
          const hasNewFile = Boolean(value[slot]);

          return (
            <div
              key={slot}
              className="rounded-lg border border-dashed border-muted-foreground/25 p-2 space-y-2"
            >
              <p className="text-xs font-medium text-muted-foreground">Image {index + 1}</p>
              <div className="relative aspect-square rounded-md bg-muted/40 overflow-hidden flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt={`Image ${index + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <input
                ref={(el) => {
                  inputRefs.current[slot] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setSlotFile(slot, file);
                  e.target.value = '';
                }}
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  disabled={disabled}
                  onClick={() => inputRefs.current[slot]?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {hasNewFile ? 'Replace' : 'Upload'}
                </Button>
                {(hasNewFile || preview) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    disabled={disabled}
                    onClick={() => {
                      setSlotFile(slot, undefined);
                      if (inputRefs.current[slot]) inputRefs.current[slot]!.value = '';
                    }}
                    aria-label={`Clear image ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RmpClassMultiImageInput;
