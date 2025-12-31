import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getContrastRatio, getWcagLevel } from '@/contexts/BrandingContext';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  contrastAgainst?: string;
}

const ColorPicker = ({ label, value, onChange, description, contrastAgainst }: ColorPickerProps) => {
  const contrastRatio = contrastAgainst ? getContrastRatio(value, contrastAgainst) : null;
  const wcagLevel = contrastRatio ? getWcagLevel(contrastRatio) : null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded cursor-pointer border border-border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          className="flex-1 font-mono"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {contrastRatio !== null && wcagLevel && (
        <div className="flex items-center gap-2">
          <Badge 
            variant={wcagLevel === 'Fail' ? 'destructive' : wcagLevel === 'AA' ? 'secondary' : 'default'}
            className="text-xs"
          >
            {wcagLevel === 'AAA' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {wcagLevel === 'AA' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {wcagLevel === 'Fail' && <XCircle className="w-3 h-3 mr-1" />}
            WCAG {wcagLevel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Contrast: {contrastRatio.toFixed(2)}:1
          </span>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
