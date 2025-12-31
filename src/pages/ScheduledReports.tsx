import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Plus, Play, Pencil, Trash2, Calendar, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledReport {
  id: string;
  name: string;
  dashboard: string;
  format: 'pdf' | 'excel' | 'csv';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

interface ExecutionHistory {
  id: string;
  reportId: string;
  reportName: string;
  executedAt: Date;
  status: 'success' | 'failed';
  recipients: number;
  error?: string;
}

const ScheduledReports = () => {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Weekly HR Summary',
      dashboard: 'Overview',
      format: 'pdf',
      frequency: 'weekly',
      dayOfWeek: 'monday',
      time: '08:00',
      recipients: ['hr@company.com', 'leadership@company.com'],
      isActive: true,
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Monthly Bias Report',
      dashboard: 'Bias & Fairness',
      format: 'excel',
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '09:00',
      recipients: ['compliance@company.com'],
      isActive: true,
      lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [history, setHistory] = useState<ExecutionHistory[]>([
    {
      id: '1',
      reportId: '1',
      reportName: 'Weekly HR Summary',
      executedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'success',
      recipients: 2
    },
    {
      id: '2',
      reportId: '2',
      reportName: 'Monthly Bias Report',
      executedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'success',
      recipients: 1
    },
    {
      id: '3',
      reportId: '1',
      reportName: 'Weekly HR Summary',
      executedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      status: 'failed',
      recipients: 0,
      error: 'Email delivery failed'
    }
  ]);

  const [formData, setFormData] = useState<{
    name: string;
    dashboard: string;
    format: 'pdf' | 'excel' | 'csv';
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek: string;
    dayOfMonth: number;
    time: string;
    recipients: string;
  }>({
    name: '',
    dashboard: 'overview',
    format: 'pdf',
    frequency: 'weekly',
    dayOfWeek: 'monday',
    dayOfMonth: 1,
    time: '09:00',
    recipients: ''
  });

  const dashboards = [
    { value: 'overview', label: 'Overview' },
    { value: 'feedback', label: 'Feedback Analytics' },
    { value: 'engagement', label: 'Employee Engagement' },
    { value: 'performance', label: 'Performance Insights' },
    { value: 'bias', label: 'Bias & Fairness' },
    { value: 'retention', label: 'Retention Analytics' }
  ];

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }
    if (!formData.recipients.trim()) {
      toast.error('Please add at least one recipient');
      return;
    }

    const newReport: ScheduledReport = {
      id: Date.now().toString(),
      name: formData.name,
      dashboard: dashboards.find(d => d.value === formData.dashboard)?.label || formData.dashboard,
      format: formData.format,
      frequency: formData.frequency,
      dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
      dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
      time: formData.time,
      recipients: formData.recipients.split(',').map(r => r.trim()),
      isActive: true,
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    setReports([...reports, newReport]);
    setCreateOpen(false);
    resetForm();
    toast.success('Scheduled report created');
  };

  const handleEdit = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      dashboard: dashboards.find(d => d.label === report.dashboard)?.value || 'overview',
      format: report.format,
      frequency: report.frequency,
      dayOfWeek: report.dayOfWeek || 'monday',
      dayOfMonth: report.dayOfMonth || 1,
      time: report.time,
      recipients: report.recipients.join(', ')
    });
    setCreateOpen(true);
  };

  const handleUpdate = () => {
    if (!editingReport) return;

    setReports(reports.map(r => 
      r.id === editingReport.id 
        ? {
            ...r,
            name: formData.name,
            dashboard: dashboards.find(d => d.value === formData.dashboard)?.label || formData.dashboard,
            format: formData.format,
            frequency: formData.frequency,
            dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
            dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
            time: formData.time,
            recipients: formData.recipients.split(',').map(r => r.trim())
          }
        : r
    ));
    setCreateOpen(false);
    setEditingReport(null);
    resetForm();
    toast.success('Scheduled report updated');
  };

  const handleDelete = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    toast.success('Scheduled report deleted');
  };

  const toggleActive = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const runNow = (report: ScheduledReport) => {
    toast.info(`Running "${report.name}" now...`);
    
    // Simulate execution
    setTimeout(() => {
      const newExecution: ExecutionHistory = {
        id: Date.now().toString(),
        reportId: report.id,
        reportName: report.name,
        executedAt: new Date(),
        status: 'success',
        recipients: report.recipients.length
      };
      setHistory([newExecution, ...history]);
      setReports(reports.map(r => 
        r.id === report.id ? { ...r, lastRun: new Date() } : r
      ));
      toast.success(`"${report.name}" sent to ${report.recipients.length} recipients`);
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dashboard: 'overview',
      format: 'pdf',
      frequency: 'weekly',
      dayOfWeek: 'monday',
      dayOfMonth: 1,
      time: '09:00',
      recipients: ''
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/analytics')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Analytics
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Scheduled Reports</h1>
              <p className="text-muted-foreground">Automate report delivery to your team</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) {
              setEditingReport(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> New Scheduled Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingReport ? 'Edit' : 'Create'} Scheduled Report</DialogTitle>
                <DialogDescription>
                  Set up automatic report delivery
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Report Name</Label>
                  <Input
                    placeholder="Weekly HR Summary"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dashboard</Label>
                    <Select
                      value={formData.dashboard}
                      onValueChange={(v) => setFormData({ ...formData, dashboard: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dashboards.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={formData.format}
                      onValueChange={(v: 'pdf' | 'excel' | 'csv') => setFormData({ ...formData, format: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setFormData({ ...formData, frequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.frequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select
                        value={formData.dayOfWeek}
                        onValueChange={(v) => setFormData({ ...formData, dayOfWeek: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.frequency === 'monthly' && (
                    <div className="space-y-2">
                      <Label>Day of Month</Label>
                      <Select
                        value={formData.dayOfMonth.toString()}
                        onValueChange={(v) => setFormData({ ...formData, dayOfMonth: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 5, 10, 15, 20, 25].map(day => (
                            <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recipients (comma-separated emails)</Label>
                  <Input
                    placeholder="hr@company.com, manager@company.com"
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  />
                </div>

                <Button 
                  onClick={editingReport ? handleUpdate : handleCreate} 
                  className="w-full"
                >
                  {editingReport ? 'Update' : 'Create'} Scheduled Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scheduled Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Schedules</CardTitle>
            <CardDescription>Manage your automated report deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Dashboard</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{report.dashboard}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{report.frequency}</span>
                        {report.dayOfWeek && <span>({report.dayOfWeek})</span>}
                        {report.dayOfMonth && <span>(day {report.dayOfMonth})</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {report.recipients.length}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {format(report.nextRun, 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={report.isActive ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(report.id)}
                      >
                        {report.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => runNow(report)}
                          title="Run Now"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(report)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(report.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
            <CardDescription>Recent report deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Executed At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(exec => (
                  <TableRow key={exec.id}>
                    <TableCell className="font-medium">{exec.reportName}</TableCell>
                    <TableCell>{format(exec.executedAt, 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      {exec.status === 'success' ? (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle className="w-3 h-3" /> Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" /> Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{exec.recipients}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {exec.error || 'Delivered successfully'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ScheduledReports;
