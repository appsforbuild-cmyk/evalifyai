import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { 
  Bell, 
  Search, 
  Trash2, 
  CheckCheck, 
  MessageSquare,
  Target,
  Calendar,
  Star,
  Users,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'feedback_received':
    case 'feedback_published':
    case 'quick_feedback':
      return <MessageSquare className="w-5 h-5 text-primary" />;
    case 'goal_completed':
      return <Target className="w-5 h-5 text-green-500" />;
    case 'milestone_achieved':
      return <Star className="w-5 h-5 text-yellow-500" />;
    case 'session_scheduled':
      return <Calendar className="w-5 h-5 text-blue-500" />;
    case 'recognition_received':
      return <Star className="w-5 h-5 text-pink-500" />;
    case 'team_update':
      return <Users className="w-5 h-5 text-purple-500" />;
    default:
      return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
};

const NotificationRow = ({
  notification,
  isSelected,
  onSelect,
  onNavigate,
}: {
  notification: Notification;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onNavigate: (url: string | null, id: string) => void;
}) => {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 border-b hover:bg-muted/50 transition-colors",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(notification.id, !!checked)}
        onClick={(e) => e.stopPropagation()}
      />
      <div 
        className="flex-1 cursor-pointer"
        onClick={() => onNavigate(notification.action_url, notification.id)}
      >
        <div className="flex items-start gap-3">
          {getNotificationIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={cn(
                "text-sm",
                !notification.is_read && "font-semibold"
              )}>
                {notification.title}
              </p>
              {!notification.is_read && (
                <Badge variant="default" className="text-xs">New</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteMultiple } = useNotifications();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab === 'feedback') {
      filtered = filtered.filter(n => 
        ['feedback_received', 'feedback_published', 'quick_feedback'].includes(n.type)
      );
    } else if (activeTab === 'goals') {
      filtered = filtered.filter(n => 
        ['goal_completed', 'milestone_achieved'].includes(n.type)
      );
    } else if (activeTab === 'system') {
      filtered = filtered.filter(n => 
        ['session_scheduled', 'team_update'].includes(n.type)
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleNavigate = (url: string | null, id: string) => {
    markAsRead(id);
    if (url) {
      navigate(url);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      deleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/settings/notifications">
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Bulk actions bar */}
            {filteredNotifications.length > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b">
                <Checkbox
                  checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} selected` 
                    : 'Select all'}
                </span>
                {selectedIds.size > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        selectedIds.forEach(id => markAsRead(id));
                        setSelectedIds(new Set());
                      }}
                    >
                      <CheckCheck className="w-4 h-4 mr-1" />
                      Mark as read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
                {unreadCount > 0 && selectedIds.size === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead()}
                    className="ml-auto"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark all as read
                  </Button>
                )}
              </div>
            )}

            <ScrollArea className="h-[calc(100vh-350px)]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-1">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'unread' 
                      ? "You're all caught up!" 
                      : searchQuery 
                        ? 'No notifications match your search'
                        : 'Notifications will appear here'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    isSelected={selectedIds.has(notification.id)}
                    onSelect={handleSelect}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
