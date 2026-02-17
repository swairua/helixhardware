import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package,
  Barcode,
  DollarSign,
  Warehouse,
  Tag,
  Edit,
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface InventoryItem {
  id: string;
  product_code?: string;
  sku?: string;
  name: string;
  category?: {
    name: string;
  } | null;
  product_categories?: {
    name: string;
  } | null;
  category_id?: string;
  stock_quantity?: number;
  currentStock?: number;
  minimum_stock_level?: number;
  minStock?: number;
  maximum_stock_level?: number;
  maxStock?: number;
  selling_price?: number;
  unit_price?: number;
  unitPrice?: string;
  cost_price?: number;
  costPrice?: string;
  description?: string;
  unit_of_measure?: string;
  unitOfMeasure?: string;
  lastRestocked?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface ViewInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onEdit: () => void;
  onRestock: () => void;
}

export function ViewInventoryItemModal({ open, onOpenChange, item, onEdit, onRestock }: ViewInventoryItemModalProps) {
  if (!item) return null;

  // Normalize field names from different sources
  const normalizedItem = {
    id: item.id,
    name: item.name,
    sku: item.sku || item.product_code || '',
    category: item.category || item.product_categories,
    category_id: item.category_id,
    currentStock: item.stock_quantity ?? item.currentStock ?? 0,
    minStock: item.minimum_stock_level ?? item.minStock ?? 10,
    maxStock: item.maximum_stock_level ?? item.maxStock,
    unitPrice: String(item.selling_price ?? item.unit_price ?? item.unitPrice ?? 0),
    costPrice: String(item.cost_price ?? item.costPrice ?? 0),
    description: item.description,
    unitOfMeasure: item.unit_of_measure || item.unitOfMeasure || 'pieces',
    lastRestocked: item.lastRestocked,
    status: (item.status || 'in_stock') as 'in_stock' | 'low_stock' | 'out_of_stock'
  };

  // Calculate total value
  const unitPrice = parseFloat(normalizedItem.unitPrice) || 0;
  const totalValue = String((normalizedItem.currentStock || 0) * unitPrice);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-success-light text-success border-success/20';
      case 'low_stock':
        return 'bg-warning-light text-warning border-warning/20';
      case 'out_of_stock':
        return 'bg-destructive-light text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    if (isNaN(num)) return 'Ksh 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const stockPercentage = normalizedItem.maxStock ? (normalizedItem.currentStock / normalizedItem.maxStock) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <div className="flex items-center space-x-2">
                  <span>{normalizedItem.name}</span>
                  <Badge variant="outline" className={getStatusColor(normalizedItem.status)}>
                    {normalizedItem.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  {normalizedItem.sku} • {normalizedItem.category?.name || 'No category'}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {normalizedItem.status === 'low_stock' && (
                <Button size="sm" onClick={onRestock} className="bg-warning hover:bg-warning/90">
                  <Package className="h-4 w-4 mr-2" />
                  Restock
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete product information and stock details
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Product Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Product Code:</span>
                  <div className="font-medium flex items-center space-x-2">
                    <Barcode className="h-4 w-4" />
                    <span>{normalizedItem.sku}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <div className="font-medium">{normalizedItem.category?.name || 'No category'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit of Measure:</span>
                  <div className="font-medium">{normalizedItem.unitOfMeasure || 'pieces'}</div>
                </div>
              </div>

              {normalizedItem.description && (
                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <div className="text-sm mt-1 p-2 bg-muted/50 rounded">
                    {normalizedItem.description}
                  </div>
                </div>
              )}

              {normalizedItem.lastRestocked && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground text-sm">Last Restocked: </span>
                    <span className="font-medium">{new Date(normalizedItem.lastRestocked).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock and Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Warehouse className="h-4 w-4" />
                <span>Stock & Pricing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Levels */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-bold text-2xl">{normalizedItem.currentStock}</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      normalizedItem.status === 'out_of_stock' ? 'bg-destructive' :
                      normalizedItem.status === 'low_stock' ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Min Level:</span>
                    <div className="font-medium">{normalizedItem.minStock}</div>
                  </div>
                  {normalizedItem.maxStock && (
                    <div>
                      <span className="text-muted-foreground">Max Level:</span>
                      <div className="font-medium">{normalizedItem.maxStock}</div>
                    </div>
                  )}
                </div>

                {normalizedItem.currentStock <= normalizedItem.minStock && (
                  <div className="flex items-center space-x-2 p-3 bg-warning-light rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-warning text-sm font-medium">
                      Stock level is below minimum threshold
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {normalizedItem.costPrice && parseFloat(normalizedItem.costPrice) > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm">Cost Price:</span>
                      <div className="font-medium">{formatCurrency(normalizedItem.costPrice)}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground text-sm">Selling Price:</span>
                    <div className="font-medium">{formatCurrency(normalizedItem.unitPrice)}</div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm">Total Value:</span>
                  <div className="font-bold text-xl text-primary flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>{formatCurrency(totalValue)}</span>
                  </div>
                </div>

                {normalizedItem.costPrice && parseFloat(normalizedItem.costPrice) > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Margin per unit:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            parseFloat(normalizedItem.unitPrice.replace(/[^0-9.-]+/g, '')) -
                            parseFloat(normalizedItem.costPrice.replace(/[^0-9.-]+/g, ''))
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Markup:</span>
                        <span className="font-medium">
                          {(((parseFloat(normalizedItem.unitPrice.replace(/[^0-9.-]+/g, '')) -
                             parseFloat(normalizedItem.costPrice.replace(/[^0-9.-]+/g, ''))) /
                             parseFloat(normalizedItem.costPrice.replace(/[^0-9.-]+/g, ''))) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Movement Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Stock Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{normalizedItem.currentStock}</div>
                <div className="text-sm text-muted-foreground">Current Stock</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-success">{formatCurrency(totalValue)}</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-warning">0</div>
                <div className="text-sm text-muted-foreground">Orders Pending</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-muted-foreground">0</div>
                <div className="text-sm text-muted-foreground">Reserved Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {normalizedItem.status === 'low_stock' && (
              <Button variant="outline" onClick={onRestock} className="bg-warning-light text-warning border-warning/20">
                <Package className="h-4 w-4 mr-2" />
                Restock Item
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
