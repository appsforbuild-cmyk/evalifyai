import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Save,
  Share2,
  Mail,
  Calendar
} from 'lucide-react';

interface MetricItem {
  id: string;
  name: string;
  category: string;
}

interface CanvasItem {
  id: string;
  metric: MetricItem;
  chartType: 'bar' | 'line' | 'pie' | 'number';
}

interface SavedDashboard {
  id: string;
  name: string;
  items: CanvasItem[];
  createdAt: Date;
}

const availableMetrics: MetricItem[] = [
  { id: 'feedback-volume', name: 'Feedback Volume', category: 'Feedback' },
  { id: 'engagement-score', name: 'Engagement Score', category: 'Engagement' },
  { id: 'goal-completion', name: 'Goal Completion Rate', category: 'Performance' },
  { id: 'bias-score', name: 'Average Bias Score', category: 'Fairness' },
  { id: 'retention-risk', name: 'Retention Risk Distribution', category: 'Retention' },
  { id: 'recognition-count', name: 'Recognition Count', category: 'Engagement' },
  { id: 'avg-response-time', name: 'Avg Response Time', category: 'Feedback' },
  { id: 'enps', name: 'eNPS Score', category: 'Engagement' },
  { id: 'milestone-rate', name: 'Milestone Achievement Rate', category: 'Performance' },
  { id: 'fairness-cert', name: 'Fairness Certification Rate', category: 'Fairness' },
  { id: 'attrition-predicted', name: 'Predicted Attrition', category: 'Retention' },
  { id: 'active-managers', name: 'Most Active Managers', category: 'Feedback' },
];

export function ReportBuilder() {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [dashboardName, setDashboardName] = useState('');
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);
  const [draggedMetric, setDraggedMetric] = useState<MetricItem | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    day: 'monday',
    time: '09:00',
    recipients: ''
  });

  const handleDragStart = (metric: MetricItem) => {
    setDraggedMetric(metric);
  };

  const handleDrop = () => {
    if (draggedMetric) {
      const newItem: CanvasItem = {
        id: `${draggedMetric.id}-${Date.now()}`,
        metric: draggedMetric,
        chartType: 'bar'
      };
      setCanvasItems([...canvasItems, newItem]);
      setDraggedMetric(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeItem = (id: string) => {
    setCanvasItems(canvasItems.filter(item => item.id !== id));
  };

  const updateChartType = (id: string, chartType: 'bar' | 'line' | 'pie' | 'number') => {
    setCanvasItems(canvasItems.map(item => 
      item.id === id ? { ...item, chartType } : item
    ));
  };

  const saveDashboard = () => {
    if (!dashboardName.trim()) {
      toast.error('Please enter a dashboard name');
      return;
    }
    if (canvasItems.length === 0) {
      toast.error('Please add at least one metric');
      return;
    }

    const newDashboard: SavedDashboard = {
      id: Date.now().toString(),
      name: dashboardName,
      items: canvasItems,
      createdAt: new Date()
    };

    setSavedDashboards([...savedDashboards, newDashboard]);
    toast.success('Dashboard saved successfully');
    setDashboardName('');
  };

  const loadDashboard = (dashboard: SavedDashboard) => {
    setCanvasItems(dashboard.items);
    setDashboardName(dashboard.name);
    toast.success(`Loaded "${dashboard.name}"`);
  };

  const shareUrl = () => {
    const url = `${window.location.origin}/analytics?dashboard=${dashboardName.replace(/\s+/g, '-').toLowerCase()}`;
    navigator.clipboard.writeText(url);
    toast.success('Dashboard URL copied to clipboard');
  };

  const scheduleReport = () => {
    toast.success(`Report scheduled: ${scheduleConfig.frequency} on ${scheduleConfig.day} at ${scheduleConfig.time}`);
    setScheduleOpen(false);
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'line': return <LineChartIcon className="w-4 h-4" />;
      case 'pie': return <PieChartIcon className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const categories = [...new Set(availableMetrics.map(m => m.category))];

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Metrics Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Available Metrics</CardTitle>
          <CardDescription>Drag metrics to the canvas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map(category => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
              <div className="space-y-2">
                {availableMetrics
                  .filter(m => m.category === category)
                  .map(metric => (
                    <div
                      key={metric.id}
                      draggable
                      onDragStart={() => handleDragStart(metric)}
                      className="flex items-center gap-2 p-2 border rounded-lg cursor-grab hover:bg-accent transition-colors"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{metric.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Canvas Area */}
      <div className="lg:col-span-3 space-y-4">
        {/* Dashboard Name & Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Dashboard name..."
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                />
              </div>
              <Button onClick={saveDashboard} className="gap-2">
                <Save className="w-4 h-4" /> Save
              </Button>
              <Button variant="outline" onClick={shareUrl} className="gap-2">
                <Share2 className="w-4 h-4" /> Share URL
              </Button>
              <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="w-4 h-4" /> Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Report Delivery</DialogTitle>
                    <DialogDescription>Set up automatic email delivery of this report</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select 
                          value={scheduleConfig.frequency}
                          onValueChange={(v) => setScheduleConfig({...scheduleConfig, frequency: v})}
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
                      <div className="space-y-2">
                        <Label>Day</Label>
                        <Select 
                          value={scheduleConfig.day}
                          onValueChange={(v) => setScheduleConfig({...scheduleConfig, day: v})}
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
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input 
                        type="time" 
                        value={scheduleConfig.time}
                        onChange={(e) => setScheduleConfig({...scheduleConfig, time: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipients (comma-separated emails)</Label>
                      <Input 
                        placeholder="email1@company.com, email2@company.com"
                        value={scheduleConfig.recipients}
                        onChange={(e) => setScheduleConfig({...scheduleConfig, recipients: e.target.value})}
                      />
                    </div>
                    <Button onClick={scheduleReport} className="w-full gap-2">
                      <Mail className="w-4 h-4" /> Schedule Email Delivery
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Drop Zone */}
        <Card 
          className={`min-h-[400px] ${draggedMetric ? 'border-dashed border-2 border-primary' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardHeader>
            <CardTitle>Dashboard Canvas</CardTitle>
            <CardDescription>Drop metrics here to build your custom dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {canvasItems.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Drag and drop metrics here</p>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {canvasItems.map(item => (
                  <Card key={item.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{item.metric.name}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <Badge variant="secondary" className="w-fit">{item.metric.category}</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-muted-foreground">Chart type:</span>
                        <div className="flex gap-1">
                          {(['bar', 'line', 'pie', 'number'] as const).map(type => (
                            <Button
                              key={type}
                              variant={item.chartType === type ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateChartType(item.id, type)}
                            >
                              {type === 'number' ? '#' : getChartIcon(type)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="h-24 bg-muted/50 rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          {item.chartType.charAt(0).toUpperCase() + item.chartType.slice(1)} Chart Preview
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Dashboards */}
        {savedDashboards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Dashboards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedDashboards.map(dashboard => (
                  <div 
                    key={dashboard.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => loadDashboard(dashboard)}
                  >
                    <h4 className="font-medium">{dashboard.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {dashboard.items.length} metrics • Created {dashboard.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
