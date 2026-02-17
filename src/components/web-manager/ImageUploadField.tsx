import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadProductImage } from '@/utils/imageUploadService';

interface ImageUploadFieldProps {
  value: string;
  onChange: (path: string) => void;
  variantName: string;
}

export const ImageUploadField = ({ value, onChange, variantName }: ImageUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const result = await uploadProductImage(file, variantName);

      if (!result.success) {
        toast.error(result.error || 'Failed to upload image');
        return;
      }

      if (!result.url) {
        toast.error('No URL returned from upload');
        return;
      }

      // Update preview and value
      setPreview(result.url);
      onChange(result.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center gap-3">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="h-32 w-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
              </div>
            </>
          )}
        </div>
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            className="w-full mt-4 cursor-pointer"
            disabled={uploading}
            asChild
          >
            <span className="flex items-center justify-center gap-2">
              {uploading && <Loader2 size={16} className="animate-spin" />}
              {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
            </span>
          </Button>
        </label>
      </div>
      {value && !preview && (
        <div className="text-sm text-muted-foreground break-all">
          Uploaded: {(() => {
            try {
              const url = new URL(value);
              return url.pathname.split('/').pop() || value;
            } catch {
              return value;
            }
          })()}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Images are securely stored in cloud storage (max 5MB)
      </p>
    </div>
  );
};
