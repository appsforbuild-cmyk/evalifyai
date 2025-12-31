import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  errorColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  logoIconUrl: string | null;
  fontHeading: string;
  fontBody: string;
  platformName: string;
  poweredByEnabled: boolean;
}

const DEFAULT_BRANDING: BrandingSettings = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#10b981',
  errorColor: '#ef4444',
  backgroundColor: '#ffffff',
  logoUrl: null,
  logoIconUrl: null,
  fontHeading: 'Inter',
  fontBody: 'Inter',
  platformName: 'EvalifyAI',
  poweredByEnabled: true,
};

interface BrandingContextType {
  branding: BrandingSettings;
  isCustomBranded: boolean;
  updateBranding: (settings: Partial<BrandingSettings>) => void;
  resetToDefaults: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Convert hex to HSL for Tailwind CSS variables
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
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

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Calculate contrast ratio for accessibility
export function getContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string): number => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 0;
    
    const rgb = [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagLevel(ratio: number): 'AAA' | 'AA' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { currentOrganization, organizationSettings } = useOrganization();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  // Load branding from organization settings
  useEffect(() => {
    if (organizationSettings) {
      const customBranding = organizationSettings.custom_branding as Record<string, unknown> || {};
      
      setBranding({
        primaryColor: (customBranding.primary_color as string) || currentOrganization?.primary_color || DEFAULT_BRANDING.primaryColor,
        secondaryColor: (customBranding.secondary_color as string) || currentOrganization?.secondary_color || DEFAULT_BRANDING.secondaryColor,
        accentColor: (customBranding.accent_color as string) || DEFAULT_BRANDING.accentColor,
        errorColor: (customBranding.error_color as string) || DEFAULT_BRANDING.errorColor,
        backgroundColor: (customBranding.background_color as string) || DEFAULT_BRANDING.backgroundColor,
        logoUrl: currentOrganization?.logo_url || null,
        logoIconUrl: (customBranding.logo_icon_url as string) || null,
        fontHeading: (customBranding.font_heading as string) || DEFAULT_BRANDING.fontHeading,
        fontBody: (customBranding.font_body as string) || DEFAULT_BRANDING.fontBody,
        platformName: (customBranding.platform_name as string) || DEFAULT_BRANDING.platformName,
        poweredByEnabled: customBranding.powered_by_enabled !== false,
      });
    }
  }, [organizationSettings, currentOrganization]);

  // Inject CSS variables into document
  useEffect(() => {
    const root = document.documentElement;
    
    // Primary color
    root.style.setProperty('--primary', hexToHsl(branding.primaryColor));
    root.style.setProperty('--brand-primary', branding.primaryColor);
    
    // Secondary color  
    root.style.setProperty('--secondary', hexToHsl(branding.secondaryColor));
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    
    // Accent color
    root.style.setProperty('--brand-accent', branding.accentColor);
    
    // Error color
    root.style.setProperty('--destructive', hexToHsl(branding.errorColor));
    root.style.setProperty('--brand-error', branding.errorColor);
    
    // Fonts
    root.style.setProperty('--font-heading', branding.fontHeading);
    root.style.setProperty('--font-body', branding.fontBody);
    
    // Load Google Font if not system font
    const systemFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'];
    const fontsToLoad = [branding.fontHeading, branding.fontBody].filter(
      f => !systemFonts.includes(f)
    );
    
    fontsToLoad.forEach(font => {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      link.id = `font-${font.replace(' ', '-')}`;
      if (!document.getElementById(link.id)) {
        document.head.appendChild(link);
      }
    });

    // Update favicon if custom
    if (branding.logoIconUrl) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.logoIconUrl;
      }
    }

    // Update page title with platform name
    const baseTitle = document.title.split(' - ').pop() || 'Dashboard';
    document.title = `${branding.platformName} - ${baseTitle}`;
  }, [branding]);

  const updateBranding = (settings: Partial<BrandingSettings>) => {
    setBranding(prev => ({ ...prev, ...settings }));
  };

  const resetToDefaults = () => {
    setBranding(DEFAULT_BRANDING);
  };

  const isCustomBranded = branding.primaryColor !== DEFAULT_BRANDING.primaryColor ||
    branding.logoUrl !== null ||
    branding.platformName !== DEFAULT_BRANDING.platformName;

  return (
    <BrandingContext.Provider value={{ branding, isCustomBranded, updateBranding, resetToDefaults }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
