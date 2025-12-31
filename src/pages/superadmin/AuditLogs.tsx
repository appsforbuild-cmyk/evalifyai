import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Building2,
  Settings,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
  super_admin?: {
    email: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  login: 'border-green-500/30 text-green-500 bg-green-500/10',
  logout: 'border-slate-500/30 text-slate-500 bg-slate-500/10',
  start_impersonation: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
  end_impersonation: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
  suspend_organization: 'border-red-500/30 text-red-500 bg-red-500/10',
  add_note: 'border-blue-500/30 text-blue-500 bg-blue-500/10'
};

const TARGET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  organization: Building2,
  system: Settings
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, searchQuery]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' });

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Date', 'Admin', 'Action', 'Target Type', 'Target ID', 'IP Address', 'Details'],
      ...logs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.super_admin?.email || 'Unknown',
        log.action,
        log.target_type,
        log.target_id || '',
        log.ip_address || '',
        JSON.stringify(log.details)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400">Track all administrative actions</p>
        </div>
        <Button
          variant="outline"
          className="border-slate-600 text-slate-300"
          onClick={handleExportCSV}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px] bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="start_impersonation">Start Impersonation</SelectItem>
                <SelectItem value="end_impersonation">End Impersonation</SelectItem>
                <SelectItem value="suspend_organization">Suspend Organization</SelectItem>
                <SelectItem value="add_note">Add Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Timestamp</TableHead>
                  <TableHead className="text-slate-400">Admin</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                  <TableHead className="text-slate-400">Target</TableHead>
                  <TableHead className="text-slate-400">Details</TableHead>
                  <TableHead className="text-slate-400">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const TargetIcon = TARGET_ICONS[log.target_type] || Shield;
                  return (
                    <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-slate-400 text-sm">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-white">
                        {log.super_admin?.email || 'System'}
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action] || 'border-slate-500/30 text-slate-500'}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TargetIcon className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{log.target_type}</span>
                          {log.target_id && (
                            <span className="text-xs text-slate-500 truncate max-w-[100px]">
                              {log.target_id}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-[200px] truncate">
                        {Object.keys(log.details || {}).length > 0 
                          ? JSON.stringify(log.details).substring(0, 50) + '...'
                          : '-'}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {log.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
