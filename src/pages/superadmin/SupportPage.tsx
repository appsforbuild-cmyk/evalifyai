import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  HeadphonesIcon, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Building2,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface PlatformAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  organization_id: string | null;
  is_resolved: boolean;
  created_at: string;
  organization?: {
    name: string;
  };
}

const SEVERITY_COLORS = {
  info: 'border-blue-500/30 text-blue-500 bg-blue-500/10',
  warning: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
  critical: 'border-red-500/30 text-red-500 bg-red-500/10'
};

export default function SupportPage() {
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('platform_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Fetch organization names
      const alertsWithOrgs = await Promise.all(
        (data || []).map(async (alert) => {
          if (alert.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', alert.organization_id)
              .maybeSingle();
            return { ...alert, organization: org };
          }
          return alert;
        })
      );

      setAlerts(alertsWithOrgs);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('platform_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts => 
        alerts.map(a => a.id === alertId ? { ...a, is_resolved: true } : a)
      );
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Mock support stats
  const supportStats = {
    openTickets: 12,
    avgResponseTime: '2.3h',
    resolvedToday: 8,
    satisfaction: 4.8
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support & Alerts</h1>
        <p className="text-slate-400">Monitor platform alerts and support tickets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Open Tickets</p>
                <p className="text-2xl font-bold text-white">{supportStats.openTickets}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Avg Response</p>
                <p className="text-2xl font-bold text-white">{supportStats.avgResponseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Resolved Today</p>
                <p className="text-2xl font-bold text-white">{supportStats.resolvedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Satisfaction</p>
                <p className="text-2xl font-bold text-white">{supportStats.satisfaction}/5</p>
              </div>
              <HeadphonesIcon className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="alerts" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Platform Alerts
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Support Tickets
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px] bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-white font-medium">All Clear!</p>
                  <p className="text-slate-400">No active alerts at this time</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Severity</TableHead>
                      <TableHead className="text-slate-400">Alert</TableHead>
                      <TableHead className="text-slate-400">Organization</TableHead>
                      <TableHead className="text-slate-400">Time</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell>
                          <Badge className={SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS]}>
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{alert.title}</p>
                            <p className="text-sm text-slate-400 truncate max-w-[300px]">
                              {alert.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.organization ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-300">{alert.organization.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">System</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {format(new Date(alert.created_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {alert.is_resolved ? (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                              Open
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!alert.is_resolved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <HeadphonesIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Support Ticket System</h3>
              <p className="text-slate-400 mb-6">
                Connect your preferred support tool for ticket management
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Zendesk
                </Button>
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Intercom
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
