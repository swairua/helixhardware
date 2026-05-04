import { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { AddInventoryItemModal } from '@/components/inventory/AddInventoryItemModal';
import { EditInventoryItemModal } from '@/components/inventory/EditInventoryItemModal';
import { ViewInventoryItemModal } from '@/components/inventory/ViewInventoryItemModal';
import { RestockItemModal } from '@/components/inventory/RestockItemModal';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';
import { useProducts, useCompanies, useDeleteProduct } from '@/hooks/useDatabase';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lock,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InventoryItem {
  id: string;
  product_code: string;
  name: string;
  category_id?: string;
  product_categories?: {
    name: string;
  } | null;
  stock_quantity: number;
  minimum_stock_level: number;
  selling_price: number;
  cost_price?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  description?: string;
  unit_of_measure?: string;
}

// Helper function to determine stock status
const getStockStatus = (currentStock: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  if (currentStock === 0) return 'out_of_stock';
  if (currentStock <= minStock) return 'low_stock';
  return 'in_stock';
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

function getStatusColor(status: InventoryItem['status']) {
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
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Fetch products from database
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];
  const { data: products, isLoading: loadingProducts, error: productsError, refetch: retryProducts, loadingTimeout } = useProducts(currentCompany?.id);
  const deleteProduct = useDeleteProduct();
  const { canView, canCreate, canEdit, loading: permissionsLoading, role } = usePermissions();

  useEffect(() => {
    if (!permissionsLoading) {
      const hasAccess = canView('inventory');
      console.log('🔐 Inventory access check:', {
        hasAccess,
        userRole: role?.name,
        permissions: role?.permissions,
      });
      if (!hasAccess) {
        toast.error('You do not have permission to view inventory');
      }
    }
  }, [permissionsLoading, canView, role]);

  const handleAddItem = () => {
    if (!canCreate('inventory')) {
      toast.error('You do not have permission to create inventory items');
      return;
    }
    setShowAddModal(true);
  };

  const handleStockAdjustment = (item?: InventoryItem) => {
    if (!canEdit('inventory')) {
      toast.error('You do not have permission to adjust inventory');
      return;
    }
    if (item) {
      setSelectedItem(item);
      setShowAdjustmentModal(true);
    } else {
      toast.info('Please select an item for stock adjustment');
    }
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    if (!canEdit('inventory')) {
      toast.error('You do not have permission to edit inventory items');
      return;
    }
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleRestockItem = (item: InventoryItem) => {
    if (!canEdit('inventory')) {
      toast.error('You do not have permission to restock items');
      return;
    }
    setSelectedItem(item);
    setShowRestockModal(true);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (!canEdit('inventory')) {
      toast.error('You do not have permission to delete inventory items');
      return;
    }
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        await deleteProduct.mutateAsync(selectedItem.id);
        setShowDeleteModal(false);
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleModalSuccess = () => {
    // Refetch products after successful creation
    retryProducts();
    toast.success('Operation completed successfully!');
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedItem(null);
    // Refetch products to show updated data
    retryProducts();
    toast.success('Item updated successfully!');
  };

  const handleAdjustmentSuccess = () => {
    setShowAdjustmentModal(false);
    setSelectedItem(null);
    // Refetch products to show updated data
    retryProducts();
    toast.success('Stock adjustment completed successfully!');
  };

  // Transform products data to inventory items - memoized to prevent recalculation
  const inventory: InventoryItem[] = useMemo(() => {
    return products?.map(product => ({
      ...product,
      status: getStockStatus(product.stock_quantity || 0, product.minimum_stock_level || 0)
    })) || [];
  }, [products]);

  // Filter inventory based on search term - memoized
  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.product_categories?.name && item.product_categories.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [inventory, searchTerm]);

  // Calculate total inventory value - memoized
  const totalValue = useMemo(() => {
    return inventory.reduce((sum, item) => {
      return sum + ((item.stock_quantity || 0) * (item.selling_price || 0));
    }, 0);
  }, [inventory]);

  // Calculate stock statistics - memoized
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.status === 'low_stock').length;
  }, [inventory]);

  const outOfStockItems = useMemo(() => {
    return inventory.filter(item => item.status === 'out_of_stock').length;
  }, [inventory]);

  // Handle timeout state - if loading is taking too long, show helpful message
  if (loadingTimeout && !productsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Product items</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center max-w-md">
                <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Loading is taking longer than expected</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  The inventory is still loading. This may indicate a slow connection or large dataset.
                  You can wait or retry the request.
                </p>
                <Button
                  onClick={() => retryProducts()}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading and error states
  if (loadingProducts) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Loading product items...</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading products...</p>
                <p className="text-muted-foreground text-sm mt-2">This should only take a moment...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Error loading products</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center max-w-md">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-destructive mb-2">Failed to Load Inventory</h2>
                <p className="text-muted-foreground text-sm mb-6">{productsError.message}</p>
                <Button
                  onClick={() => retryProducts()}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canView('inventory')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage stock levels and product items</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view inventory.</p>
                <p className="text-sm text-muted-foreground mt-2">Contact your administrator if you believe this is an error.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Products</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage stock levels and product items
          </p>
        </div>
        <div className="flex flex-col w-full sm:w-auto sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
          <Button variant="outline" onClick={() => handleStockAdjustment()} disabled={!canEdit('inventory')} className="w-full sm:w-auto">
            <Package className="h-4 w-4 mr-2" />
            Stock Adjustment
          </Button>
          <Button className="gradient-primary text-primary-foreground hover:opacity-90 shadow-card w-full sm:w-auto" size="lg" onClick={handleAddItem} disabled={!canCreate('inventory')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-lg font-bold text-primary">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-lg font-bold text-success">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-lg font-bold text-warning">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-lg font-bold text-destructive">{outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              <span className="sm:inline">Filter</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Table - Responsive with mobile card view */}
      <Card className="shadow-card overflow-x-auto">
        <CardHeader>
          <CardTitle>Product Items</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden lg:table-cell">Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead className="hidden md:table-cell">Min Stock</TableHead>
                  <TableHead className="hidden md:table-cell">Unit Price</TableHead>
                  <TableHead className="hidden xl:table-cell">Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm ? 'No products found matching your search.' : 'No products in inventory yet.'}
                        </p>
                        {!searchTerm && (
                          <Button onClick={handleAddItem} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Product
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium hidden lg:table-cell">{item.product_code}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden lg:table-cell">{item.product_categories?.name || '-'}</TableCell>
                      <TableCell className={`font-semibold ${(item.stock_quantity || 0) <= (item.minimum_stock_level || 0) ? 'text-warning' : 'text-foreground'}`}>
                        {item.stock_quantity || 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{item.minimum_stock_level || 0}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatCurrency(item.selling_price || 0)}</TableCell>
                      <TableCell className="font-semibold text-success hidden xl:table-cell">{formatCurrency((item.stock_quantity || 0) * (item.selling_price || 0))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(item.status || 'out_of_stock')}>
                          {(item.status || 'out_of_stock').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewItem(item)}
                            title="View item details"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditItem(item)}
                            title="Edit item"
                            disabled={!canEdit('inventory')}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStockAdjustment(item)}
                            title="Stock Adjustment"
                            disabled={!canEdit('inventory')}
                            className="h-8 w-8"
                          >
                            <TrendingUp className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item)}
                            title="Delete item"
                            disabled={!canEdit('inventory')}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {item.status === 'low_stock' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestockItem(item)}
                              disabled={!canEdit('inventory')}
                              className="bg-warning-light text-warning border-warning/20 hover:bg-warning hover:text-warning-foreground text-xs hidden md:inline-flex"
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Restock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center space-y-2 py-8">
                <Package className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'No products found matching your search.' : 'No products in inventory yet.'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleAddItem} className="mt-2 w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            ) : (
              filteredInventory.map((item) => (
                <Card key={item.id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.product_code}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(item.status || 'out_of_stock')}>
                        {(item.status || 'out_of_stock').replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Stock</p>
                        <p className={`font-semibold ${(item.stock_quantity || 0) <= (item.minimum_stock_level || 0) ? 'text-warning' : 'text-foreground'}`}>
                          {item.stock_quantity || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Unit Price</p>
                        <p className="font-semibold">{formatCurrency(item.selling_price || 0)}</p>
                      </div>
                    </div>

                    {item.product_categories?.name && (
                      <div className="text-xs">
                        <p className="text-muted-foreground">Category: {item.product_categories.name}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewItem(item)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        disabled={!canEdit('inventory')}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {item.status === 'low_stock' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestockItem(item)}
                          disabled={!canEdit('inventory')}
                          className="flex-1 bg-warning-light text-warning border-warning/20"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Restock
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStockAdjustment(item)}
                        disabled={!canEdit('inventory')}
                        className="flex-1 text-xs h-8"
                      >
                        <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                        Adjust Stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item)}
                        disabled={!canEdit('inventory')}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 text-xs h-8"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Modals */}
      <AddInventoryItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleModalSuccess}
      />

      {selectedItem && (
        <ViewInventoryItemModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          item={selectedItem}
          onEdit={() => {
            setShowViewModal(false);
            handleEditItem(selectedItem);
          }}
          onRestock={() => {
            setShowViewModal(false);
            setShowRestockModal(true);
          }}
        />
      )}

      {selectedItem && (
        <RestockItemModal
          open={showRestockModal}
          onOpenChange={setShowRestockModal}
          onSuccess={handleModalSuccess}
          item={selectedItem}
        />
      )}

      {selectedItem && (
        <EditInventoryItemModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={handleEditSuccess}
          item={selectedItem}
        />
      )}

      {selectedItem && (
        <StockAdjustmentModal
          open={showAdjustmentModal}
          onOpenChange={setShowAdjustmentModal}
          onSuccess={handleAdjustmentSuccess}
          item={selectedItem}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product <span className="font-semibold text-foreground">{selectedItem?.name}</span> and all associated stock movements. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
