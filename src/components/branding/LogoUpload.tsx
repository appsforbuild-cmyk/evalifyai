import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LogoUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  organizationId: string;
  type: 'logo' | 'icon' | 'email';
  maxSize?: number; // in KB
  recommendedSize?: string;
}

const LogoUpload = ({ 
  label, 
  value, 
  onChange, 
  organizationId, 
  type,
  maxSize = 2048,
  recommendedSize 
}: LogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSize * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum size is ${maxSize}KB`,
        variant: 'destructive',
      });
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PNG, JPG, SVG, or ICO',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${organizationId}/${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({ title: 'Logo uploaded successfully' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setPreview(value);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    
    try {
      // Extract path from URL
      const urlParts = value.split('/branding/');
      if (urlParts[1]) {
        await supabase.storage.from('branding').remove([urlParts[1]]);
      }
      onChange(null);
      setPreview(null);
      toast({ title: 'Logo removed' });
    } catch (error: any) {
      toast({
        title: 'Failed to remove',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="border-2 border-dashed border-border rounded-lg p-4">
        {preview ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={preview} 
                alt="Logo preview" 
                className="max-h-16 max-w-[200px] object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Logo uploaded</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  Replace
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG up to {maxSize}KB
              </p>
              {recommendedSize && (
                <p className="text-xs text-muted-foreground">
                  Recommended: {recommendedSize}
                </p>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/x-icon"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/x-icon"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default LogoUpload;
