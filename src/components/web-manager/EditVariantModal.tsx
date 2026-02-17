import { useState, useEffect } from 'react';
import { useWebManager, VariantFormData, WebVariant, WebCategory, VariantImage } from '@/hooks/useWebManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { MultiImageUploadField } from './MultiImageUploadField';

interface EditVariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: WebVariant;
  categories: WebCategory[];
  onSuccess: () => void;
}

export const EditVariantModal = ({
  open,
  onOpenChange,
  variant,
  categories,
  onSuccess,
}: EditVariantModalProps) => {
  const [formData, setFormData] = useState<VariantFormData>({
    category_id: '',
    name: '',
    sku: '',
    slug: '',
    description: '',
    image_path: '',
    display_order: 0,
    is_active: true,
  });
  const [variantImages, setVariantImages] = useState<VariantImage[]>([]);
  const { updateVariant, fetchVariantImages, saveVariantImages, loading } = useWebManager();

  useEffect(() => {
    if (variant && open) {
      setFormData({
        category_id: variant.category_id,
        name: variant.name,
        sku: variant.sku,
        slug: variant.slug,
        description: variant.description || '',
        image_path: variant.image_path || '',
        display_order: variant.display_order,
        is_active: variant.is_active,
      });

      // Load existing variant images
      loadVariantImages(variant.id);
    }
  }, [variant, open]);

  const loadVariantImages = async (variantId: string) => {
    const images = await fetchVariantImages(variantId);
    setVariantImages(images);
  };

  const handleImagesChange = (images: VariantImage[]) => {
    setVariantImages(images);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateVariant(variant.id, formData);

      // Save images
      try {
        await saveVariantImages(variant.id, variantImages);
      } catch (imageError) {
        console.error('Failed to save variant images:', imageError);
        // Images save error is already handled by saveVariantImages which shows a toast
        // Don't fail the entire operation - variant was updated successfully
        // The user will see a warning toast about the images
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      let errorMessage = 'Failed to update variant';

      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else {
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = String(error);
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error('Failed to update variant:', errorMessage, error);
      // Error is already handled by the hooks (updateVariant, saveVariantImages)
      // which show toast notifications
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogDescription>Update variant details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category_id || ''} onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value }))
              }>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(cat => cat?.id).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Variant Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Surgical Gloves - Box of 100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Stock Keeping Unit) *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="e.g., SG-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="manual edit allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Variant description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Product Images</Label>
            <MultiImageUploadField
              value={variantImages}
              onChange={handleImagesChange}
              variantName={formData.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  display_order: parseInt(e.target.value, 10),
                }))
              }
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.category_id || !formData.name || !formData.sku}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Variant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
