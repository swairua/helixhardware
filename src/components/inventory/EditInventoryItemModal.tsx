import { useState, useEffect } from 'react';
import { useUpdateProduct, useDatabase } from '@/hooks/useDatabase';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, Edit, Plus } from 'lucide-react';
import { CreateCategoryModalBasic } from '@/components/categories/CreateCategoryModalBasic';

const STANDARD_UNITS = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'box', label: 'Box' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'cm', label: 'Centimeter (cm)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'pack', label: 'Pack' },
  { value: 'carton', label: 'Carton' },
  { value: 'unit', label: 'Unit' },
];

interface InventoryItem {
  id: string;
  name: string;
  product_code?: string;
  sku?: string;
  description?: string;
  category_id?: string;
  unit_of_measure?: string;
  cost_price?: number;
  selling_price?: number;
  unit_price?: number;
  stock_quantity?: number;
  reorder_level?: number;
  minimum_stock_level?: number;
  min_stock_level?: number;
  maximum_stock_level?: number;
  max_stock_level?: number;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

interface EditInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item: InventoryItem | null;
}

export function EditInventoryItemModal({ open, onOpenChange, onSuccess, item }: EditInventoryItemModalProps) {
  const [productId, setProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '__none__', // Always use string, never null
    unit_of_measure: 'pieces',
    cost_price: 0,
    unit_price: 0,
    stock_quantity: 0,
    reorder_level: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const updateProduct = useUpdateProduct();
  const { provider } = useDatabase();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['product_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ProductCategory[];
    },
  });

  useEffect(() => {
    if (item && open) {
      // Capture the ID so we have it available for submission
      console.log('EditInventoryItemModal - item received:', item);
      setProductId(item.id);
      setFormData({
        name: item.name || '',
        sku: item.sku || item.product_code || '',
        description: item.description || '',
        category_id: item.category_id || '__none__',
        unit_of_measure: item.unit_of_measure || 'pieces',
        cost_price: Number(item.cost_price || 0),
        unit_price: Number(item.unit_price || item.selling_price || 0),
        stock_quantity: Number(item.stock_quantity || 0),
        reorder_level: Number(item.reorder_level || item.minimum_stock_level || item.min_stock_level || 10)
      });
    }
  }, [item, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.sku.trim()) {
      toast.error('SKU is required');
      return;
    }

    if (formData.unit_price <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    if (formData.reorder_level < 0) {
      toast.error('Reorder level cannot be negative');
      return;
    }

    if (!productId) {
      toast.error('Error: Product ID is missing. Cannot update product.');
      console.error('EditInventoryItemModal - productId is missing', { productId, formData });
      return;
    }

    setIsSubmitting(true);

    try {

      // Build update data with fields appropriate for the database provider
      const baseData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id === '__none__' ? null : formData.category_id,
        unit_of_measure: formData.unit_of_measure,
        cost_price: Number(formData.cost_price),
        stock_quantity: Number(formData.stock_quantity)
      };

      const updatedData = {
        ...baseData,
        sku: formData.sku,
        unit_price: Number(formData.unit_price),
        reorder_level: Number(formData.reorder_level),
        status: 'active'
      };

      await updateProduct.mutateAsync({ id: productId, data: updatedData });
      toast.success(`${formData.name} updated successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating product:', error);

      let errorMessage = 'Failed to update product. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryCreated = (categoryId: string) => {
    handleInputChange('category_id', categoryId);
    setShowCreateCategory(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      product_code: '',
      description: '',
      category_id: '__none__',
      unit_of_measure: 'pieces',
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      min_stock_level: 10,
      max_stock_level: 100
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Inventory Item
          </DialogTitle>
          <DialogDescription>
            Update the details for {item?.name || 'this product'}
          </DialogDescription>
        </DialogHeader>

        {/* Debug: Display Product ID */}
        <div className="mb-4 p-3 bg-muted rounded text-sm">
          <span className="text-muted-foreground">Product ID: </span>
          <span className="font-mono font-semibold">{productId || 'NOT SET'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Product Code) *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Enter SKU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Category</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateCategory(true)}
                  className="h-auto p-1 text-xs text-primary hover:text-primary/80"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create New
                </Button>
              </div>
              <Select value={formData.category_id || '__none__'} onValueChange={(value) => handleInputChange('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Category</SelectItem>
                  {categoriesLoading ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading categories...</div>
                  ) : categories && categories.length > 0 ? (
                    categories.filter(cat => cat?.id).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No other categories available</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Select value={formData.unit_of_measure} onValueChange={(value) => handleInputChange('unit_of_measure', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price</Label>
                <Input
                  id="cost_price"
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Selling Price *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Current Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level (Minimum Stock)</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => handleInputChange('reorder_level', parseInt(e.target.value) || 0)}
                  placeholder="10"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  You'll be notified when stock falls below this level
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Item'}
          </Button>
        </DialogFooter>

        <CreateCategoryModalBasic
          open={showCreateCategory}
          onOpenChange={setShowCreateCategory}
          onSuccess={handleCategoryCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
