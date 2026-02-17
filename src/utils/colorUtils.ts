/**
 * Color utility for converting and managing company primary colors
 * Supports conversion between HEX, RGB, and HSL formats
 */

export interface ColorValues {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  rgbString: string;
  hslString: string;
}

/**
 * Convert HEX color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Convert RGB to HEX
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

/**
 * Convert HEX to HSL
 */
export const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

/**
 * Convert HSL to HEX
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
};

/**
 * Get comprehensive color values from HEX
 */
export const getColorValues = (hex: string): ColorValues => {
  const rgb = hexToRgb(hex) || { r: 255, g: 140, b: 66 }; // Default to orange
  const hsl = hexToHsl(hex) || { h: 20, s: 100, l: 63 };

  return {
    hex: hex,
    rgb,
    hsl,
    rgbString: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    hslString: `${hsl.h} ${hsl.s}% ${hsl.l}%`
  };
};

/**
 * Generate color variants from base color
 */
export const generateColorVariants = (baseHex: string) => {
  const hsl = hexToHsl(baseHex) || { h: 20, s: 100, l: 63 };

  return {
    primary: baseHex,
    primaryHover: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 10, 0)),
    primaryLight: hslToHex(hsl.h, Math.max(hsl.s - 30, 0), Math.min(hsl.l + 25, 100)),
    primaryForeground: '#ffffff',
    rgbArray: [
      hexToRgb(baseHex)?.r || 255,
      hexToRgb(baseHex)?.g || 140,
      hexToRgb(baseHex)?.b || 66
    ] as [number, number, number]
  };
};

/**
 * Format color as CSS variable value (HSL string)
 */
export const getColorAsHslVar = (hex: string): string => {
  const hsl = hexToHsl(hex) || { h: 20, s: 100, l: 63 };
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
};

/**
 * Format color as RGB array for PDFs (jsPDF expects [R, G, B])
 */
export const getColorAsRgbArray = (hex: string): [number, number, number] => {
  const rgb = hexToRgb(hex) || { r: 255, g: 140, b: 66 };
  return [rgb.r, rgb.g, rgb.b];
};

/**
 * Lighten a hex color
 */
export const lightenColor = (hex: string, percent: number): string => {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  
  const newL = Math.min(hsl.l + percent, 100);
  return hslToHex(hsl.h, hsl.s, newL);
};

/**
 * Darken a hex color
 */
export const darkenColor = (hex: string, percent: number): string => {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  
  const newL = Math.max(hsl.l - percent, 0);
  return hslToHex(hsl.h, hsl.s, newL);
};

/**
 * Get contrasting text color (black or white)
 */
export const getContrastColor = (hex: string): '#000000' | '#ffffff' => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};
