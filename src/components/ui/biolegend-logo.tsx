import { cn } from "@/lib/utils";

interface BiolegendLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  // Optional props to pass company data directly (useful for public pages like login)
  logoUrl?: string;
  companyName?: string;
}

import { useContext } from 'react';
import { CompanyContext } from '@/contexts/CompanyContext';

export function BiolegendLogo({
  className,
  size = "md",
  showText = true,
  logoUrl: propLogoUrl,
  companyName: propCompanyName
}: BiolegendLogoProps) {
  // Safely try to get company context (won't throw if provider is missing)
  const context = useContext(CompanyContext);
  const currentCompany = context?.currentCompany;

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-20 w-20"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };

  // Use passed-in data first, then fall back to context, then use defaults
  const fallbackLogoUrl = '/fallback-logo.png';
  const fallbackLogoSvgUrl = '/fallback-logo.svg';
  const logoSrc = propLogoUrl || currentCompany?.logo_url || fallbackLogoUrl;
  const companyName = propCompanyName || currentCompany?.name || 'MEDPLUS';

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Company Logo Image (falls back to default) */}
      <div className={cn("relative", sizeClasses[size])}>
        <img
          src={logoSrc}
          alt={`${companyName} Logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            // If the current src is the PNG fallback, try SVG
            if (img.src.includes('/fallback-logo.png')) {
              console.warn(`PNG fallback failed, trying SVG: ${logoSrc}`);
              img.src = fallbackLogoSvgUrl;
            } else {
              // If both PNG and SVG failed, just warn
              console.warn(`Logo failed to load: ${logoSrc}`);
            }
          }}
        />
      </div>

      {/* Company Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-primary", textSizeClasses[size])}>
            {companyName.split(' ')[0].toUpperCase()}
          </span>
          <span className={cn("text-xs text-secondary font-medium -mt-1", size === "sm" && "text-[10px]")}>
            {companyName.split(' ')[1]?.toUpperCase() || ''}
          </span>
        </div>
      )}
    </div>
  );
}
