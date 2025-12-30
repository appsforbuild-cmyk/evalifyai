import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, Edit3, Code } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import CSVImportTab from '@/components/import/CSVImportTab';
import ManualEntryTab from '@/components/import/ManualEntryTab';
import APIIntegrationTab from '@/components/import/APIIntegrationTab';

export default function ImportUsers() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Import Users</h1>
          <p className="text-muted-foreground mt-1">
            Bulk import users via CSV, manual entry, or API
          </p>
        </div>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" /> CSV/Excel Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Edit3 className="w-4 h-4" /> Manual Entry
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Code className="w-4 h-4" /> API Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-6">
            <CSVImportTab key={`csv-${refreshKey}`} onImportComplete={handleImportComplete} />
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <ManualEntryTab key={`manual-${refreshKey}`} onImportComplete={handleImportComplete} />
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <APIIntegrationTab key={`api-${refreshKey}`} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
