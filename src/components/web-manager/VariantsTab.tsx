import { useState, useEffect } from 'react';
import { useWebManager, WebVariant, WebCategory, VariantImage } from '@/hooks/useWebManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CreateVariantModal } from './CreateVariantModal';
import { EditVariantModal } from './EditVariantModal';
import { VariantImagesModal } from './VariantImagesModal';

export const VariantsTab = () => {
  const [variants, setVariants] = useState<WebVariant[]>([]);
  const [categories, setCategories] = useState<WebCategory[]>([]);
  const [variantImages, setVariantImages] = useState<Record<string, VariantImage[]>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVariant, setSelectedVariant] = useState<WebVariant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVariantForImages, setSelectedVariantForImages] = useState<WebVariant | null>(null);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const {
    fetchVariants,
    fetchCategories,
    fetchVariantImages,
    deleteVariant,
    toggleVariantStatus,
    loading,
  } = useWebManager();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const cats = await fetchCategories();
    setCategories(cats);
    const vars = await fetchVariants();
    setVariants(vars);
    await loadImagesForVariants(vars);
  };

  const loadVariants = async () => {
    const categoryId = selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined;
    const data = await fetchVariants(categoryId, search || undefined);
    setVariants(data);
    await loadImagesForVariants(data);
  };

  const loadImagesForVariants = async (vars: WebVariant[]) => {
    if (vars.length === 0) {
      setVariantImages({});
      return;
    }

    try {
      // Parallelize image fetches using Promise.all instead of sequential awaits
      const imagePromises = vars.map(variant =>
        fetchVariantImages(variant.id)
          .then(images => ({ variantId: variant.id, images }))
          .catch(error => {
            console.warn(`Failed to load images for variant ${variant.id}:`, error);
            return { variantId: variant.id, images: [] };
          })
      );

      const results = await Promise.all(imagePromises);
      const imagesMap: Record<string, VariantImage[]> = {};

      results.forEach(({ variantId, images }) => {
        imagesMap[variantId] = images;
      });

      setVariantImages(imagesMap);
    } catch (error) {
      console.error('Error loading images for variants:', error);
      // Gracefully handle overall error by setting empty map
      setVariantImages({});
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  useEffect(() => {
    loadVariants();
  }, [search, selectedCategory]);

  const handleCreate = async () => {
    setShowCreateModal(false);
    await loadVariants();
  };

  const handleEdit = (variant: WebVariant) => {
    setSelectedVariant(variant);
    setShowEditModal(true);
  };

  const handleEditComplete = async () => {
    setShowEditModal(false);
    setSelectedVariant(null);
    await loadVariants();
  };

  const handleDelete = async (id: string) => {
    await deleteVariant(id);
    await loadVariants();
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleVariantStatus(id, !currentStatus);
    await loadVariants();
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus size={16} /> Add Variant
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No variants found
                </TableCell>
              </TableRow>
            ) : (
              variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.sku}</TableCell>
                  <TableCell>{variant.name}</TableCell>
                  <TableCell>{getCategoryName(variant.category_id)}</TableCell>
                  <TableCell>{variant.display_order}</TableCell>
                  <TableCell>
                    {variantImages[variant.id] && variantImages[variant.id].length > 0 ? (
                      <div className="flex gap-2 items-center">
                        {variantImages[variant.id].slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={img.altText || `Image ${idx + 1}`}
                            className="h-8 w-8 object-cover rounded"
                            title={img.altText || `Image ${idx + 1}`}
                          />
                        ))}
                        {variantImages[variant.id].length > 3 && (
                          <button
                            onClick={() => {
                              setSelectedVariantForImages(variant);
                              setShowImagesModal(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer px-1 font-semibold hover:bg-blue-50 rounded transition-colors"
                            title="Click to view all images"
                          >
                            +{variantImages[variant.id].length - 3}
                          </button>
                        )}
                      </div>
                    ) : variant.image_path ? (
                      <img
                        src={variant.image_path}
                        alt={variant.name}
                        className="h-8 w-8 object-cover rounded"
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variant.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {variant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(variant.id, variant.is_active)}
                        title={variant.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {variant.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(variant)}
                      >
                        <Edit size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle>Delete Variant</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{variant.name}"?
                          </AlertDialogDescription>
                          <div className="flex gap-3 justify-end">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(variant.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateVariantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        categories={categories}
        onSuccess={handleCreate}
      />

      {selectedVariant && (
        <EditVariantModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          variant={selectedVariant}
          categories={categories}
          onSuccess={handleEditComplete}
        />
      )}

      {selectedVariantForImages && (
        <VariantImagesModal
          open={showImagesModal}
          onOpenChange={setShowImagesModal}
          variant={selectedVariantForImages}
          images={variantImages[selectedVariantForImages.id] || []}
        />
      )}
    </div>
  );
};
