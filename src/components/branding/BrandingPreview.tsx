import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandingSettings } from '@/contexts/BrandingContext';

interface BrandingPreviewProps {
  branding: BrandingSettings;
}

const BrandingPreview = ({ branding }: BrandingPreviewProps) => {
  return (
    <div 
      className="rounded-lg border p-4 space-y-4"
      style={{ 
        backgroundColor: branding.backgroundColor,
        fontFamily: branding.fontBody 
      }}
    >
      <div className="flex items-center gap-3 pb-3 border-b">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="h-8" />
        ) : (
          <div 
            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.platformName.charAt(0)}
          </div>
        )}
        <span 
          className="font-semibold"
          style={{ fontFamily: branding.fontHeading }}
        >
          {branding.platformName}
        </span>
      </div>

      <div className="space-y-3">
        <h3 
          className="font-semibold text-lg"
          style={{ fontFamily: branding.fontHeading }}
        >
          Sample Heading
        </h3>
        
        <p className="text-sm text-muted-foreground">
          This is sample body text to preview your typography choices.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button style={{ backgroundColor: branding.primaryColor }}>
            Primary Button
          </Button>
          <Button 
            variant="outline"
            style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}
          >
            Outline
          </Button>
          <Button 
            variant="secondary"
            style={{ backgroundColor: branding.secondaryColor, color: 'white' }}
          >
            Secondary
          </Button>
        </div>

        <div className="flex gap-2">
          <Badge style={{ backgroundColor: branding.primaryColor }}>Primary</Badge>
          <Badge style={{ backgroundColor: branding.accentColor }}>Success</Badge>
          <Badge style={{ backgroundColor: branding.errorColor }}>Error</Badge>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ fontFamily: branding.fontHeading }}>
              Sample Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Sample input field" />
          </CardContent>
        </Card>

        {branding.poweredByEnabled && (
          <p className="text-xs text-center text-muted-foreground pt-2 border-t">
            Powered by EvalifyAI
          </p>
        )}
      </div>
    </div>
  );
};

export default BrandingPreview;
