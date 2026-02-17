import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    url: string;
    altText?: string;
  }>;
  fallbackImage?: string;
  fallbackAlt?: string;
}

export const ImageGallery = ({
  images,
  fallbackImage,
  fallbackAlt = 'Product image',
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use images array if available, otherwise use fallback
  const displayImages = images && images.length > 0
    ? images
    : fallbackImage
      ? [{ url: fallbackImage, altText: fallbackAlt }]
      : [];

  const goToPrevious = useCallback(() => {
    setIsTransitioning(prev => {
      if (prev) return true;
      setCurrentIndex(current =>
        current === 0 ? displayImages.length - 1 : current - 1
      );
      setTimeout(() => setIsTransitioning(false), 300);
      return true;
    });
  }, [displayImages.length]);

  const goToNext = useCallback(() => {
    setIsTransitioning(prev => {
      if (prev) return true;
      setCurrentIndex(current =>
        current === displayImages.length - 1 ? 0 : current + 1
      );
      setTimeout(() => setIsTransitioning(false), 300);
      return true;
    });
  }, [displayImages.length]);

  const goToSlide = useCallback((index: number) => {
    setIsTransitioning(prev => {
      if (prev) return true;
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 300);
      return true;
    });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (displayImages.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  const currentImage = displayImages[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 group">
        <div className="relative h-96 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
          <img
            src={currentImage.url}
            alt={currentImage.altText || 'Product image'}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>

        {/* Navigation Arrows - Only show if more than 1 image */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={isTransitioning}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={goToNext}
              disabled={isTransitioning}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {currentIndex + 1} / {displayImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Navigation - Only show if more than 1 image */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all overflow-hidden ${
                currentIndex === index
                  ? 'border-primary ring-2 ring-primary/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`Go to image ${index + 1}`}
              disabled={isTransitioning}
            >
              <img
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
