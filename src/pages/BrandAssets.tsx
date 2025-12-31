import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBranding } from '@/contexts/BrandingContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { 
  Download, 
  Image, 
  Palette, 
  Type, 
  FileArchive,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

const BrandAssets = () => {
  const { branding } = useBranding();
  const { currentOrganization } = useOrganization();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const colors = [
    { name: 'Primary', value: branding.primaryColor, usage: 'Buttons, links, main accents' },
    { name: 'Secondary', value: branding.secondaryColor, usage: 'Hover states, secondary actions' },
    { name: 'Accent', value: branding.accentColor, usage: 'Success states, highlights' },
    { name: 'Error', value: branding.errorColor, usage: 'Errors, destructive actions' },
    { name: 'Background', value: branding.backgroundColor, usage: 'Page backgrounds' },
  ];

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'N/A';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'N/A';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
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
    
    return `${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  };

  const copyToClipboard = async (text: string, colorName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
    toast.success(`${colorName} copied to clipboard`);
  };

  const generateColorPaletteCSS = () => {
    return `:root {
  /* ${branding.platformName} Brand Colors */
  --primary-color: ${branding.primaryColor};
  --secondary-color: ${branding.secondaryColor};
  --accent-color: ${branding.accentColor};
  --error-color: ${branding.errorColor};
  --background-color: ${branding.backgroundColor};
  
  /* Typography */
  --font-heading: '${branding.fontHeading}', sans-serif;
  --font-body: '${branding.fontBody}', sans-serif;
}`;
  };

  const generateTypographyGuide = () => {
    return `# ${branding.platformName} Typography Guide

## Fonts
- **Heading Font:** ${branding.fontHeading}
- **Body Font:** ${branding.fontBody}

## Usage Guidelines

### Headings
Use ${branding.fontHeading} for all headings (H1-H6).
- H1: 2.25rem (36px) - Bold
- H2: 1.875rem (30px) - Bold
- H3: 1.5rem (24px) - Semibold
- H4: 1.25rem (20px) - Semibold
- H5: 1.125rem (18px) - Medium
- H6: 1rem (16px) - Medium

### Body Text
Use ${branding.fontBody} for all body content.
- Large: 1.125rem (18px)
- Regular: 1rem (16px)
- Small: 0.875rem (14px)
- Extra Small: 0.75rem (12px)

## Loading Fonts
Add to your HTML <head>:
\`\`\`html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${branding.fontHeading.replace(' ', '+')}:wght@400;500;600;700&family=${branding.fontBody.replace(' ', '+')}:wght@400;500;600&display=swap" rel="stylesheet">
\`\`\`
`;
  };

  const generateColorPaletteSVG = () => {
    const swatchWidth = 120;
    const swatchHeight = 100;
    const padding = 10;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${colors.length * (swatchWidth + padding)}" height="${swatchHeight + 60}">
  <style>
    .label { font-family: Arial, sans-serif; font-size: 12px; }
    .value { font-family: monospace; font-size: 10px; }
  </style>
  ${colors.map((color, i) => `
  <g transform="translate(${i * (swatchWidth + padding)}, 0)">
    <rect width="${swatchWidth}" height="${swatchHeight}" fill="${color.value}" rx="8"/>
    <text x="${swatchWidth / 2}" y="${swatchHeight + 20}" text-anchor="middle" class="label">${color.name}</text>
    <text x="${swatchWidth / 2}" y="${swatchHeight + 35}" text-anchor="middle" class="value">${color.value}</text>
  </g>`).join('')}
</svg>`;
  };

  const downloadAssets = async () => {
    setIsDownloading(true);
    
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      
      // Add color palette CSS
      zip.file('colors.css', generateColorPaletteCSS());
      
      // Add typography guide
      zip.file('typography-guide.md', generateTypographyGuide());
      
      // Add color palette SVG
      zip.file('color-palette.svg', generateColorPaletteSVG());
      
      // Add brand info JSON
      zip.file('brand-info.json', JSON.stringify({
        platformName: branding.platformName,
        colors: {
          primary: branding.primaryColor,
          secondary: branding.secondaryColor,
          accent: branding.accentColor,
          error: branding.errorColor,
          background: branding.backgroundColor,
        },
        typography: {
          headingFont: branding.fontHeading,
          bodyFont: branding.fontBody,
        },
        exportedAt: new Date().toISOString(),
      }, null, 2));
      
      // Add README
      zip.file('README.md', `# ${branding.platformName} Brand Assets

This package contains the official brand assets for ${branding.platformName}.

## Contents
- \`colors.css\` - CSS custom properties for brand colors
- \`color-palette.svg\` - Visual color palette
- \`typography-guide.md\` - Typography usage guidelines
- \`brand-info.json\` - Machine-readable brand data

## Color Palette
${colors.map(c => `- **${c.name}:** ${c.value}`).join('\n')}

## Typography
- **Headings:** ${branding.fontHeading}
- **Body:** ${branding.fontBody}

---
Generated by ${branding.platformName} on ${new Date().toLocaleDateString()}
`);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${branding.platformName.toLowerCase().replace(/\s+/g, '-')}-brand-assets.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Brand assets downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download brand assets');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Brand Assets</h1>
            <p className="text-muted-foreground">
              Download your brand assets for use across your organization
            </p>
          </div>
          <Button onClick={downloadAssets} disabled={isDownloading}>
            <FileArchive className="h-4 w-4 mr-2" />
            {isDownloading ? 'Preparing...' : 'Download All Assets'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo Assets
              </CardTitle>
              <CardDescription>
                Your organization's logo files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branding.logoUrl ? (
                <>
                  <div className="border rounded-lg p-6 bg-background flex items-center justify-center">
                    <img src={branding.logoUrl} alt="Logo" className="max-h-16" />
                  </div>
                  <div className="border rounded-lg p-6 bg-slate-900 flex items-center justify-center">
                    <img src={branding.logoUrl} alt="Logo (dark)" className="max-h-16" />
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={branding.logoUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download Logo
                    </a>
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No custom logo uploaded</p>
                  <Button variant="link" asChild className="mt-2">
                    <a href="/settings/branding">Upload Logo</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Typography Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>
                Font families used in your branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2">Heading Font</Badge>
                  <p 
                    className="text-3xl font-bold"
                    style={{ fontFamily: branding.fontHeading }}
                  >
                    {branding.fontHeading}
                  </p>
                  <p 
                    className="text-xl mt-1"
                    style={{ fontFamily: branding.fontHeading }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <Badge variant="outline" className="mb-2">Body Font</Badge>
                  <p 
                    className="text-xl font-medium"
                    style={{ fontFamily: branding.fontBody }}
                  >
                    {branding.fontBody}
                  </p>
                  <p 
                    className="text-base mt-1"
                    style={{ fontFamily: branding.fontBody }}
                  >
                    The quick brown fox jumps over the lazy dog. 
                    Pack my box with five dozen liquor jugs.
                  </p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <a 
                  href={`https://fonts.google.com/specimen/${branding.fontHeading.replace(' ', '+')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Google Fonts
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Palette
            </CardTitle>
            <CardDescription>
              Click on any color value to copy it to your clipboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {colors.map((color) => (
                <div key={color.name} className="space-y-2">
                  <div 
                    className="h-24 rounded-lg border shadow-sm"
                    style={{ backgroundColor: color.value }}
                  />
                  <div>
                    <p className="font-medium">{color.name}</p>
                    <p className="text-xs text-muted-foreground">{color.usage}</p>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => copyToClipboard(color.value, `${color.name} HEX`)}
                      className="w-full flex items-center justify-between p-2 rounded bg-muted hover:bg-muted/80 text-xs font-mono"
                    >
                      <span>HEX</span>
                      <span className="flex items-center gap-1">
                        {color.value}
                        {copiedColor === `${color.name} HEX` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(`rgb(${hexToRgb(color.value)})`, `${color.name} RGB`)}
                      className="w-full flex items-center justify-between p-2 rounded bg-muted hover:bg-muted/80 text-xs font-mono"
                    >
                      <span>RGB</span>
                      <span className="flex items-center gap-1">
                        {hexToRgb(color.value)}
                        {copiedColor === `${color.name} RGB` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(`hsl(${hexToHsl(color.value)})`, `${color.name} HSL`)}
                      className="w-full flex items-center justify-between p-2 rounded bg-muted hover:bg-muted/80 text-xs font-mono"
                    >
                      <span>HSL</span>
                      <span className="flex items-center gap-1">
                        {hexToHsl(color.value)}
                        {copiedColor === `${color.name} HSL` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CSS Variables */}
        <Card>
          <CardHeader>
            <CardTitle>CSS Variables</CardTitle>
            <CardDescription>
              Copy these CSS custom properties to use in your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {generateColorPaletteCSS()}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(generateColorPaletteCSS(), 'CSS')}
              >
                {copiedColor === 'CSS' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BrandAssets;
