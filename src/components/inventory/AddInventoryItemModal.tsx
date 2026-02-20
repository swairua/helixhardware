import { useState } from 'react';
import { useCreateProduct, useDatabase, useUnitsOfMeasure, useCreateUnitOfMeasure } from '@/hooks/useDatabase';
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

interface AddInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (product: any) => void;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

interface UnitOfMeasure {
  id: string;
  name: string;
  code?: string;
  company_id?: string;
  is_active?: boolean;
}

export function AddInventoryItemModal({ open, onOpenChange, onSuccess }: AddInventoryItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '__none__', // Always use string, never null
    unit_of_measure: '',
    cost_price: '' as string | number,
    unit_price: '' as string | number,
    stock_quantity: '' as string | number,
    reorder_level: '' as string | number
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDescription, setNewUnitDescription] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);

  const createProduct = useCreateProduct();
  const createUnitMutation = useCreateUnitOfMeasure();
  const { currentCompany } = useCurrentCompany();
  const { provider } = useDatabase();

  // Load units of measure from database
  const { data: units, isLoading: unitsLoading, refetch: refetchUnits } = useUnitsOfMeasure();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['product_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, description')
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

  const handleCreateUnit = async () => {
    if (!newUnitName.trim()) {
      toast.error('Unit name is required');
      return;
    }

    if (!currentCompany?.id) {
      toast.error('Company not found. Please refresh and try again.');
      return;
    }

    setIsCreatingUnit(true);
    try {
      const unitData = {
        company_id: currentCompany.id,
        name: newUnitName.trim(),
        code: newUnitName.trim().toUpperCase().slice(0, 10),
        is_active: true
      };

      await createUnitMutation.mutateAsync(unitData);

      // Reset form and close dialog
      setNewUnitName('');
      setNewUnitDescription('');
      setShowCreateUnit(false);

      // Refresh units list and select the newly created unit
      if (refetchUnits) {
        refetchUnits();
      }
      // The newly created unit should be selected automatically when data updates
      handleInputChange('unit_of_measure', newUnitName.trim());
    } catch (error) {
      console.error('Error creating unit of measure:', error);
      let errorMessage = 'Failed to create unit of measure. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsCreatingUnit(false);
    }
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

    if (!formData.unit_of_measure) {
      toast.error('Unit of measure is required');
      return;
    }

    if (Number(formData.unit_price) <= 0) {
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
        cost_price: Number(formData.cost_price || 0),
        unit_price: Number(formData.unit_price || 0),
        stock_quantity: Number(formData.stock_quantity || 0),
        reorder_level: Number(formData.reorder_level || 0),
        status: 'active'
      };

      const createdProduct = await createProduct.mutateAsync(newProduct);

      toast.success(`Product "${formData.name}" added successfully!`);
      onSuccess(createdProduct);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding product:', error);

      let errorMessage = 'Failed to add product. Please try again.';
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

      toast.error(`Error adding product: ${errorMessage}`);
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
      unit_of_measure: '',
      cost_price: '',
      unit_price: '',
      stock_quantity: '',
      reorder_level: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Add New Product Item</span>
          </DialogTitle>
          <DialogDescription>
            Add a new product to your system
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateUnit(true)}
                    className="h-auto p-1 text-xs text-primary hover:text-primary/80"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create New
                  </Button>
                </div>
                <Select value={formData.unit_of_measure || ''} onValueChange={(value) => handleInputChange('unit_of_measure', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit of measure" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsLoading ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading units...</div>
                    ) : units && units.length > 0 ? (
                      (units as UnitOfMeasure[]).map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No units available. Create one first.</div>
                    )}
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
                    onChange={(e) => handleInputChange('cost_price', e.target.value)}
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
                    onChange={(e) => handleInputChange('unit_price', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {Number(formData.cost_price) > 0 && Number(formData.unit_price) > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Margin:</span>
                      <span className="font-medium">
                        KES {(Number(formData.unit_price) - Number(formData.cost_price)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Markup:</span>
                      <span className="font-medium">
                        {Number(formData.cost_price) > 0 ? (((Number(formData.unit_price) - Number(formData.cost_price)) / Number(formData.cost_price)) * 100).toFixed(1) : 0}%
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
                    onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
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
                  onChange={(e) => handleInputChange('reorder_level', e.target.value)}
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
            disabled={isSubmitting || !formData.name.trim() || Number(formData.unit_price) <= 0 || !formData.unit_of_measure}
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

        <Dialog open={showCreateUnit} onOpenChange={setShowCreateUnit}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Unit of Measure</DialogTitle>
              <DialogDescription>
                Add a new unit of measure that you can use for your products
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="unitName">Unit Name *</Label>
                <Input
                  id="unitName"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="e.g., Pieces, Box, Kilogram"
                  disabled={isCreatingUnit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitDescription">Description (Optional)</Label>
                <Textarea
                  id="unitDescription"
                  value={newUnitDescription}
                  onChange={(e) => setNewUnitDescription(e.target.value)}
                  placeholder="e.g., Used for packing items"
                  rows={3}
                  disabled={isCreatingUnit}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateUnit(false)}
                disabled={isCreatingUnit}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUnit}
                disabled={isCreatingUnit || !newUnitName.trim()}
              >
                {isCreatingUnit ? 'Creating...' : 'Create Unit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
