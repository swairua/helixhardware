import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PRODUCTS_BUCKET = 'product-images';

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadProductImage = async (
  file: File,
  variantName: string
): Promise<UploadImageResult> => {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select a valid image file',
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Generate unique file path
    const timestamp = Date.now();
    const slug = variantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const extension = file.type.split('/')[1] || 'jpg';
    const filePath = `variants/${slug}-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Failed to upload image',
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    console.error('Upload error:', error);
    return {
      success: false,
      error: message,
    };
  }
};

export const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split(`${PRODUCTS_BUCKET}/`);
    if (urlParts.length !== 2) {
      console.warn('Could not parse image URL:', imageUrl);
      return false;
    }

    const filePath = decodeURIComponent(urlParts[1].split('?')[0]);

    const { error } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};
