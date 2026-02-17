import { useState } from 'react';
import { useCreateProduct, useDatabase } from '@/hooks/useDatabase';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentCompany } from '@/contexts/CompanyContext';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Barcode,
  DollarSign,
  Warehouse,
  Tag,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateCategoryModalBasic } from '@/components/categories/CreateCategoryModalBasic';

// Standard units of measure - no database lookup needed
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

interface AddInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export function AddInventoryItemModal({ open, onOpenChange, onSuccess }: AddInventoryItemModalProps) {
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
  const createProduct = useCreateProduct();
  const { currentCompany } = useCurrentCompany();
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateProductCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PRD-${randomStr}${timestamp}`;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!currentCompany?.id) {
      toast.error('Company not found. Please refresh and try again.');
      return;
    }

    if (!formData.sku.trim()) {
      handleInputChange('sku', generateProductCode());
    }

    if (formData.unit_price <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build product data aligned to schema
      const newProduct = {
        company_id: currentCompany.id,
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id === '__none__' || !formData.category_id ? null : formData.category_id,
        sku: formData.sku || generateProductCode(),
        unit_of_measure: formData.unit_of_measure,
        cost_price: formData.cost_price,
        unit_price: formData.unit_price,
        stock_quantity: formData.stock_quantity,
        reorder_level: formData.reorder_level,
        status: 'active'
      };

      await createProduct.mutateAsync(newProduct);

      toast.success(`Product "${formData.name}" added to inventory successfully!`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding inventory item:', error);

      let errorMessage = 'Failed to add inventory item. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        } else if (supabaseError.code) {
          errorMessage = `Database error (${supabaseError.code}): ${supabaseError.hint || 'Unknown error'}`;
        } else {
          errorMessage = `Error: ${JSON.stringify(error)}`;
        }
      }

      toast.error(`Error adding inventory item: ${errorMessage}`);
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
      sku: '',
      description: '',
      category_id: '__none__', // Always use string, never null
      unit_of_measure: 'pieces',
      cost_price: 0,
      unit_price: 0,
      stock_quantity: 0,
      reorder_level: 10
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Add New Inventory Item</span>
          </DialogTitle>
          <DialogDescription>
            Add a new product to your inventory system
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Product Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Product Code)</Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="Auto-generated"
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('sku', generateProductCode())}
                  >
                    Generate Code
                  </Button>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Select value={formData.unit_of_measure || 'pieces'} onValueChange={(value) => handleInputChange('unit_of_measure', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit of measure" />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Pricing & Stock</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price (KES)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Selling Price (KES) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formData.cost_price > 0 && formData.unit_price > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Margin:</span>
                      <span className="font-medium">
                        KES {(formData.unit_price - formData.cost_price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Markup:</span>
                      <span className="font-medium">
                        {formData.cost_price > 0 ? (((formData.unit_price - formData.cost_price) / formData.cost_price) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Initial Stock Quantity</Label>
                <div className="relative">
                  <Warehouse className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                    min="0"
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level (Minimum Stock)</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => handleInputChange('reorder_level', parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  You'll be notified when stock falls below this level
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || formData.unit_price <= 0}
          >
            <Package className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Product'}
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
