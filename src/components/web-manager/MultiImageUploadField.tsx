import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { uploadProductImage } from '@/utils/imageUploadService';
import { VariantImage } from '@/hooks/useWebManager';

interface MultiImageUploadFieldProps {
  value: VariantImage[];
  onChange: (images: VariantImage[]) => void;
  variantName: string;
}

export const MultiImageUploadField = ({
  value,
  onChange,
  variantName,
}: MultiImageUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [images, setImages] = useState<VariantImage[]>(value || []);

  useEffect(() => {
    setImages(value || []);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const result = await uploadProductImage(file, variantName);

      if (!result.success) {
        toast.error(result.error || 'Failed to upload image');
        return;
      }

      if (!result.url) {
        toast.error('No URL returned from upload');
        return;
      }

      const newImage: VariantImage = {
        url: result.url,
        altText: '',
        displayOrder: images.length,
      };

      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      onChange(updatedImages);
      toast.success('Image uploaded successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      console.error('Image upload error:', error);
      toast.error(message);
    } finally {
      setUploading(false);
      // Reset the input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const reorderedImages = updatedImages.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    setImages(reorderedImages);
    onChange(reorderedImages);
  };

  const handleAltTextChange = (index: number, altText: string) => {
    const updatedImages = [...images];
    updatedImages[index].altText = altText;
    setImages(updatedImages);
    onChange(updatedImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedImages = [...images];
    const draggedImage = updatedImages[draggedIndex];
    updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(targetIndex, 0, draggedImage);
    updatedImages.forEach((img, idx) => {
      img.displayOrder = idx;
    });

    setImages(updatedImages);
    onChange(updatedImages);
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Existing Images Section - Show First if images exist */}
      {images.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-blue-900 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {images.length}
              </span>
              Current Images
            </h4>
            {images.length > 1 && (
              <p className="text-xs text-blue-600 font-semibold">👆 Drag to reorder</p>
            )}
          </div>

          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex gap-3 p-3 border-2 rounded-lg items-start transition-all ${
                  draggedIndex === index
                    ? 'bg-orange-200 border-orange-400 shadow-md'
                    : 'bg-white border-orange-200 hover:border-orange-300'
                }`}
              >
                {/* Drag Handle */}
                {images.length > 1 && (
                  <button
                    type="button"
                    className="mt-1 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-orange-600 transition-colors"
                    title="Drag to reorder"
                  >
                    <GripVertical size={18} />
                  </button>
                )}

                {/* Image Thumbnail */}
                <div className="relative flex-shrink-0">
                  <img
                    src={image.url}
                    alt={image.altText || `Image ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg border-2 border-blue-200 shadow-sm"
                  />
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                    {index + 1}
                  </span>
                </div>

                {/* Image Details */}
                <div className="flex-1 space-y-2 min-w-0">
                  <Input
                    type="text"
                    placeholder="Alt text for accessibility (optional)"
                    value={image.altText || ''}
                    onChange={(e) => handleAltTextChange(index, e.target.value)}
                    className="text-sm border-blue-200 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-600 break-all truncate line-clamp-2">
                    <span className="font-semibold">File:</span> {image.url.split('/').pop() || 'Image'}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 p-1.5 hover:bg-red-100 rounded-lg transition-colors mt-1"
                  title="Remove this image"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Images Section */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-900">
          {images.length > 0 ? '➕ Add More Images' : 'Upload Product Images'}
        </h4>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
          <div className="flex flex-col items-center justify-center gap-3">
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Click to upload {images.length > 0 ? 'more ' : ''}images
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
            </div>
          </div>

          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="multi-image-upload"
          />

          <label htmlFor="multi-image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 cursor-pointer hover:bg-gray-50"
              disabled={uploading}
              asChild
            >
              <span className="flex items-center justify-center gap-2">
                {uploading && <Loader2 size={16} className="animate-spin" />}
                {uploading ? 'Uploading...' : 'Choose Image'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-3">
        💾 All images are securely stored in cloud storage. You can add, remove, or reorder images at any time.
      </p>
    </div>
  );
};
