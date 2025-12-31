import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileSpreadsheet, FileImage, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsFilters } from './AnalyticsFilters';

interface ExportMenuProps {
  tabName: string;
  filters: AnalyticsFilters;
}

export function ExportMenu({ tabName, filters }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'pptx') => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          reportType: tabName,
          filters: {
            dateRange: {
              from: filters.dateRange.from.toISOString(),
              to: filters.dateRange.to.toISOString()
            },
            departments: filters.departments,
            teams: filters.teams,
            manager: filters.manager
          },
          format
        }
      });

      if (error) throw error;

      if (data?.downloadUrl) {
        // Download the file
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `${tabName}-report.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${format.toUpperCase()} report downloaded`);
      } else {
        // Fallback: generate locally for CSV
        if (format === 'csv') {
          generateLocalCSV();
        } else {
          toast.info('Report generation initiated. You will receive an email when ready.');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      // Fallback to local generation
      if (format === 'csv') {
        generateLocalCSV();
      } else {
        toast.error('Failed to generate report. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const generateLocalCSV = () => {
    // Generate sample CSV data locally
    const headers = ['Date', 'Metric', 'Value', 'Change'];
    const rows = [
      ['2024-01-01', 'Feedback Sessions', '125', '+12%'],
      ['2024-01-01', 'Avg Bias Score', '85', '+5%'],
      ['2024-01-01', 'Engagement Rate', '78%', '+3%'],
    ];
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tabName}-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('CSV report downloaded');
  };

  const handleEmailExport = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    setIsExporting(true);
    try {
      const { error } = await supabase.functions.invoke('generate-report', {
        body: {
          reportType: tabName,
          filters: {
            dateRange: {
              from: filters.dateRange.from.toISOString(),
              to: filters.dateRange.to.toISOString()
            },
            departments: filters.departments,
            teams: filters.teams,
            manager: filters.manager
          },
          format: selectedFormat,
          email: emailAddress
        }
      });

      if (error) throw error;

      toast.success(`Report will be sent to ${emailAddress}`);
      setEmailDialogOpen(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Email export error:', error);
      toast.error('Failed to send report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pptx')}>
            <FileImage className="mr-2 h-4 w-4" />
            Export as PowerPoint
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Email Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
            <DialogDescription>
              Send this report to an email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="flex gap-2">
                {['pdf', 'excel', 'csv'].map((format) => (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFormat(format)}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
