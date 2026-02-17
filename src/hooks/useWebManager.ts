import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface WebCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  variant_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WebVariant {
  id: string;
  category_id: string;
  name: string;
  sku: string;
  slug: string;
  description?: string;
  image_path?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface VariantImage {
  id?: string;
  url: string;
  altText?: string;
  displayOrder: number;
}

export interface VariantFormData {
  category_id: string;
  name: string;
  sku: string;
  slug: string;
  description?: string;
  image_path?: string;
  display_order: number;
  is_active: boolean;
}

export interface WebVariantWithImages extends WebVariant {
  images?: VariantImage[];
}

export const useWebManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories
  const fetchCategories = useCallback(
    async (search?: string, limit?: number) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('web_categories_with_counts')
          .select('*')
          .order('display_order', { ascending: true });

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return data as WebCategory[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch categories';
        setError(message);
        toast.error(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createCategory = useCallback(async (data: CategoryFormData) => {
    try {
      setLoading(true);
      setError(null);

      const { data: newCategory, error: err } = await supabase
        .from('web_categories')
        .insert(data)
        .select()
        .single();

      if (err) throw err;
      toast.success('Category created successfully');
      return newCategory as WebCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: CategoryFormData) => {
    try {
      setLoading(true);
      setError(null);

      const { data: updated, error: err } = await supabase
        .from('web_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      toast.success('Category updated successfully');
      return updated as WebCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from('web_categories')
        .delete()
        .eq('id', id);

      if (err) throw err;
      toast.success('Category deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCategoryStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      setError(null);

      const { error: err } = await supabase
        .from('web_categories')
        .update({
          is_active: isActive,
        })
        .eq('id', id);

      if (err) throw err;
      toast.success(`Category ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle category status';
      setError(message);
      toast.error(message);
      throw err;
    }
  }, []);

  // Variants
  const fetchVariants = useCallback(async (categoryId?: string, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('web_variants')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      return data as WebVariant[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch variants';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createVariant = useCallback(async (data: VariantFormData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating variant with data:', data);

      const { data: newVariant, error: err } = await supabase
        .from('web_variants')
        .insert(data)
        .select()
        .single();

      if (err) {
        console.error('Supabase error creating variant:', err);
        throw err;
      }

      console.log('Variant created successfully:', newVariant);
      toast.success('Variant created successfully');
      return newVariant as WebVariant;
    } catch (err) {
      let message = 'Failed to create variant';

      // Handle Supabase errors with specific error codes
      if (err && typeof err === 'object') {
        if ('code' in err) {
          const code = err.code;
          if (code === '23505') {
            // Unique constraint violation
            message = 'A variant with this SKU already exists. Please use a unique SKU.';
          } else if (code === '23503') {
            // Foreign key constraint violation
            message = 'The selected category does not exist. Please select a valid category.';
          } else if (code === '42P01') {
            // Table does not exist
            message = 'Database table not found. Please contact support.';
          } else if ('message' in err && typeof err.message === 'string') {
            message = err.message;
          } else {
            message = `Database Error (${code}): Check your input and try again.`;
          }
        } else if ('message' in err && typeof err.message === 'string') {
          message = err.message;
        } else {
          try {
            message = JSON.stringify(err);
          } catch {
            message = String(err);
          }
        }
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        try {
          message = String(err);
        } catch {
          message = 'Failed to create variant';
        }
      }

      console.error('Create variant error:', message, err);
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVariant = useCallback(async (id: string, data: VariantFormData) => {
    try {
      setLoading(true);
      setError(null);

      const { data: updated, error: err } = await supabase
        .from('web_variants')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      toast.success('Variant updated successfully');
      return updated as WebVariant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update variant';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVariant = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from('web_variants')
        .delete()
        .eq('id', id);

      if (err) throw err;
      toast.success('Variant deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete variant';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleVariantStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      setError(null);

      const { error: err } = await supabase
        .from('web_variants')
        .update({
          is_active: isActive,
        })
        .eq('id', id);

      if (err) throw err;
      toast.success(`Variant ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle variant status';
      setError(message);
      toast.error(message);
      throw err;
    }
  }, []);

  // Variant Images
  const fetchVariantImages = useCallback(async (variantId: string) => {
    try {
      setError(null);

      const { data, error: err } = await supabase
        .from('variant_images')
        .select('*')
        .eq('variant_id', variantId)
        .order('display_order', { ascending: true });

      if (err) throw err;
      return (data || []).map((img) => ({
        id: img.id,
        url: img.image_url,
        altText: img.alt_text || '',
        displayOrder: img.display_order,
      })) as VariantImage[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch variant images';
      setError(message);
      return [];
    }
  }, []);

  const saveVariantImages = useCallback(
    async (variantId: string, images: VariantImage[]) => {
      try {
        setError(null);

        // Skip if no images to save
        if (images.length === 0) {
          return true;
        }

        // Delete existing images for this variant
        const { error: deleteErr } = await supabase
          .from('variant_images')
          .delete()
          .eq('variant_id', variantId);

        if (deleteErr) {
          // Check if it's a "table not found" error
          const deleteErrorStr = String(deleteErr);
          if (deleteErrorStr.includes('variant_images') && deleteErrorStr.includes('schema cache')) {
            console.warn('variant_images table not found - images will not be saved. Run the migration first.');
            toast.warning(
              'Images table not set up yet. Please run the database migration and try again.'
            );
            // Don't throw - allow variant to be created without images
            return false;
          }
          console.error('Error deleting existing variant images:', deleteErr);
          throw deleteErr;
        }

        // Insert new images if any
        if (images.length > 0) {
          const imagesToInsert = images.map((img, index) => {
            const data = {
              variant_id: variantId,
              image_url: img.url,
              alt_text: img.altText || '',
              display_order: img.displayOrder ?? index,
            };
            console.log(`Preparing to insert image ${index}:`, data);
            return data;
          });

          console.log('Inserting variant images:', imagesToInsert);
          const { data: insertedData, error: insertErr } = await supabase
            .from('variant_images')
            .insert(imagesToInsert)
            .select();

          if (insertErr) {
            // Check if it's a "table not found" error
            const insertErrorStr = String(insertErr);
            if (insertErrorStr.includes('variant_images') && insertErrorStr.includes('schema cache')) {
              console.warn('variant_images table not found - images will not be saved. Run the migration first.');
              toast.warning(
                'Images table not set up yet. Variant created but images could not be saved.'
              );
              // Don't throw - variant was created successfully
              return false;
            }
            console.error('Error inserting variant images:', insertErr);
            console.error('Attempted to insert:', imagesToInsert);
            throw insertErr;
          }

          console.log('Successfully inserted variant images:', insertedData);
        }

        toast.success('Variant images saved successfully');
        return true;
      } catch (err) {
        let message = 'Failed to save variant images';

        // Handle Supabase errors with specific error codes
        if (err && typeof err === 'object') {
          if ('code' in err) {
            const code = err.code;
            if (code === '23503') {
              // Foreign key constraint violation
              message = 'Variant not found. Please create the variant first.';
            } else if (code === '42P01') {
              // Table does not exist
              message = 'Database table not found. Please run the migration.';
            } else if ('message' in err && typeof err.message === 'string') {
              message = err.message;
            } else {
              message = `Database Error (${code})`;
            }
          } else if ('message' in err && typeof err.message === 'string') {
            message = err.message;
          } else {
            try {
              message = JSON.stringify(err);
            } catch {
              message = String(err);
            }
          }
        } else if (err instanceof Error) {
          message = err.message;
        } else {
          try {
            message = String(err);
          } catch {
            message = 'Failed to save variant images';
          }
        }

        console.error('saveVariantImages error:', message, err);
        setError(message);
        toast.error(message);
        throw err;
      }
    },
    []
  );

  const deleteVariantImage = useCallback(async (imageId: string) => {
    try {
      setError(null);

      const { error: err } = await supabase
        .from('variant_images')
        .delete()
        .eq('id', imageId);

      if (err) throw err;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete image';
      setError(message);
      toast.error(message);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    // Categories
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    // Variants
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    toggleVariantStatus,
    // Variant Images
    fetchVariantImages,
    saveVariantImages,
    deleteVariantImage,
  };
};
