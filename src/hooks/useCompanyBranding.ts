import { useEffect } from 'react';
import { useCompanies } from '@/hooks/useDatabase';
import { getColorAsHslVar, lightenColor, darkenColor } from '@/utils/colorUtils';

/**
 * Hook to apply company branding colors to the application
 * Sets CSS variables for the primary color and its variants
 * Uses useCompanies directly to avoid context dependency issues
 */
export const useCompanyBranding = () => {
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];

  useEffect(() => {
    if (!currentCompany?.primary_color) {
      // Apply default orange if no company color is set
      const defaultColor = '#FF8C42';
      const defaultHsl = getColorAsHslVar(defaultColor);
      const hoverColor = darkenColor(defaultColor, 10);
      const hoverHsl = getColorAsHslVar(hoverColor);
      const lightColor = lightenColor(defaultColor, 25);
      const lightHsl = getColorAsHslVar(lightColor);

      const root = document.documentElement;
      root.style.setProperty('--primary', defaultHsl);
      root.style.setProperty('--primary-hover', hoverHsl);
      root.style.setProperty('--primary-light', lightHsl);
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      return;
    }

    const primaryColor = currentCompany.primary_color;

    // Convert hex color to HSL for CSS variables
    const primaryHsl = getColorAsHslVar(primaryColor);
    const hoverColor = darkenColor(primaryColor, 10);
    const hoverHsl = getColorAsHslVar(hoverColor);
    const lightColor = lightenColor(primaryColor, 25);
    const lightHsl = getColorAsHslVar(lightColor);

    // Apply CSS variables to root
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--primary-hover', hoverHsl);
    root.style.setProperty('--primary-light', lightHsl);
    root.style.setProperty('--primary-foreground', '0 0% 100%'); // White

    // Store in localStorage for persistence across sessions
    try {
      localStorage.setItem('companyPrimaryColor', primaryColor);
    } catch (e) {
      console.warn('Failed to save color to localStorage:', e);
    }
  }, [currentCompany?.primary_color]);

  // Apply persisted color on mount if available
  useEffect(() => {
    try {
      const savedColor = localStorage.getItem('companyPrimaryColor');
      if (savedColor && !currentCompany?.primary_color) {
        const primaryHsl = getColorAsHslVar(savedColor);
        const hoverColor = darkenColor(savedColor, 10);
        const hoverHsl = getColorAsHslVar(hoverColor);
        const lightColor = lightenColor(savedColor, 25);
        const lightHsl = getColorAsHslVar(lightColor);

        const root = document.documentElement;
        root.style.setProperty('--primary', primaryHsl);
        root.style.setProperty('--primary-hover', hoverHsl);
        root.style.setProperty('--primary-light', lightHsl);
      }
    } catch (e) {
      console.warn('Failed to load color from localStorage:', e);
    }
  }, []);
};
