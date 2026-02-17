import { useState, useEffect } from 'react';
import { VariantImage } from '@/hooks/useWebManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VariantImagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: {
    id: string;
    name: string;
  };
  images: VariantImage[];
}

export const VariantImagesModal = ({
  open,
  onOpenChange,
  variant,
  images,
}: VariantImagesModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open]);

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage.url;
      link.download = `${variant.name}-image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{variant.name} - Images</DialogTitle>
          <DialogDescription>
            {currentIndex + 1} of {images.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Image Display */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square max-h-[60vh] flex items-center justify-center">
            <img
              src={currentImage?.url}
              alt={currentImage?.altText || `Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  title="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  title="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Image Info */}
          {currentImage?.altText && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Alt Text:</span> {currentImage.altText}
              </p>
            </div>
          )}

          {/* Thumbnail Grid */}
          {images.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">All Images</h4>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all hover:border-orange-400 ${
                      idx === currentIndex ? 'border-orange-600' : 'border-gray-300'
                    }`}
                    title={img.altText || `Image ${idx + 1}`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || `Image ${idx + 1}`}
                      className="w-full h-full object-cover aspect-square"
                    />
                    {idx === currentIndex && (
                      <div className="absolute inset-0 bg-orange-500/10"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download size={16} />
              Download Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
