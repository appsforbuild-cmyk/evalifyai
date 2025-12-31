import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { AnalyticsFiltersComponent, AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { ExportMenu } from '@/components/analytics/ExportMenu';
import { OverviewTab } from '@/components/analytics/tabs/OverviewTab';
import { FeedbackAnalyticsTab } from '@/components/analytics/tabs/FeedbackAnalyticsTab';
import { EngagementTab } from '@/components/analytics/tabs/EngagementTab';
import { PerformanceTab } from '@/components/analytics/tabs/PerformanceTab';
import { BiasTab } from '@/components/analytics/tabs/BiasTab';
import { RetentionTab } from '@/components/analytics/tabs/RetentionTab';
import { ReportBuilder } from '@/components/analytics/ReportBuilder';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

const Analytics = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    departments: [],
    teams: [],
    manager: null
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        handleRefresh();
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    const channel = supabase
      .channel('analytics-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback_entries' },
        () => {
          if (autoRefresh) {
            handleRefresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLastUpdated(new Date());
    setIsLoading(false);
    toast.success('Data refreshed');
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
    setLastUpdated(new Date());
  };

  if (!hasRole('hr') && !hasRole('admin')) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need HR or Admin permissions to view analytics.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/hr')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
              <p className="text-muted-foreground">Comprehensive insights and custom reports</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <ExportMenu tabName={activeTab} filters={filters} />
          </div>
        </div>

        {/* Filters */}
        <AnalyticsFiltersComponent 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          isLoading={isLoading}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
            <TabsTrigger value="feedback" className="flex-1 sm:flex-none">Feedback</TabsTrigger>
            <TabsTrigger value="engagement" className="flex-1 sm:flex-none">Engagement</TabsTrigger>
            <TabsTrigger value="performance" className="flex-1 sm:flex-none">Performance</TabsTrigger>
            <TabsTrigger value="bias" className="flex-1 sm:flex-none">Bias & Fairness</TabsTrigger>
            <TabsTrigger value="retention" className="flex-1 sm:flex-none">Retention</TabsTrigger>
            <TabsTrigger value="builder" className="flex-1 sm:flex-none">Report Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackAnalyticsTab filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="engagement">
            <EngagementTab filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceTab filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="bias">
            <BiasTab filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="retention">
            <RetentionTab filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="builder">
            <ReportBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
