import { useState } from 'react';
import { useWebManager, VariantFormData, WebCategory, VariantImage } from '@/hooks/useWebManager';
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

interface CreateVariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: WebCategory[];
  onSuccess: () => void;
}

export const CreateVariantModal = ({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: CreateVariantModalProps) => {
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
  const { createVariant, saveVariantImages, loading } = useWebManager();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleImagesChange = (images: VariantImage[]) => {
    setVariantImages(images);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newVariant = await createVariant(formData);

      // Save images if any were uploaded
      if (variantImages.length > 0 && newVariant) {
        try {
          await saveVariantImages(newVariant.id, variantImages);
        } catch (imageError) {
          console.error('Failed to save variant images:', imageError);
          // Images save error is already handled by saveVariantImages which shows a toast
          // Don't fail the entire operation - variant was created successfully
          // The user will see a warning toast about the images
        }
      }

      setFormData({
        category_id: '',
        name: '',
        sku: '',
        slug: '',
        description: '',
        image_path: '',
        display_order: 0,
        is_active: true,
      });
      setVariantImages([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      let errorMessage = 'Failed to create variant';

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

      console.error('Failed to create variant:', errorMessage, error);
      // Error is already handled by the hooks (createVariant, saveVariantImages)
      // which show toast notifications
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Variant</DialogTitle>
          <DialogDescription>Add a new product variant</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category_id || ''}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value }))
              }
            >
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
              onChange={handleNameChange}
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
              placeholder="auto-generated from name"
              disabled
              className="text-muted-foreground"
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
            <Button
              type="submit"
              disabled={loading || !formData.category_id || !formData.name || !formData.sku}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Variant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
