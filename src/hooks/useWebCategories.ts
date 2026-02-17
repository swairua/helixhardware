import { useEffect, useState } from 'react';
import {
  getActiveCategories,
  getCategoryBySlugWithVariants,
  getActiveVariants,
  getVariantBySlug,
  WebCategoryForPublic,
  WebVariantForPublic,
} from '@/services/webManagerService';

export const useWebCategories = () => {
  const [categories, setCategories] = useState<WebCategoryForPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getActiveCategories();
        setCategories(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch categories';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export const useWebCategoryBySlug = (slug: string) => {
  const [category, setCategory] = useState<WebCategoryForPublic | undefined>();
  const [variants, setVariants] = useState<WebVariantForPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setCategory(undefined);
      setVariants([]);
      return;
    }

    const fetchCategoryData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCategoryBySlugWithVariants(slug);
        if (result) {
          setCategory(result.category);
          setVariants(result.variants);
        } else {
          setCategory(undefined);
          setVariants([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch category';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

  return { category, variants, loading, error };
};

export const useWebVariants = (categoryId?: string) => {
  const [variants, setVariants] = useState<WebVariantForPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVariants = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getActiveVariants(categoryId);
        setVariants(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch variants';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [categoryId]);

  return { variants, loading, error };
};

export const useWebVariantBySlug = (slug: string) => {
  const [variant, setVariant] = useState<WebVariantForPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setVariant(null);
      return;
    }

    const fetchVariant = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVariantBySlug(slug);
        setVariant(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch variant';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [slug]);

  return { variant, loading, error };
};
