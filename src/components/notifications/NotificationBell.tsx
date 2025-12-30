import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationIcon = ({ type }: { type: string }) => {
  const iconClass = "w-4 h-4";
  
  switch (type) {
    case 'feedback_received':
    case 'feedback_published':
      return <span className={cn(iconClass, "text-primary")}>📝</span>;
    case 'goal_completed':
      return <span className={cn(iconClass, "text-green-500")}>🎯</span>;
    case 'milestone_achieved':
      return <span className={cn(iconClass, "text-yellow-500")}>🏆</span>;
    case 'session_scheduled':
      return <span className={cn(iconClass, "text-blue-500")}>📅</span>;
    case 'recognition_received':
      return <span className={cn(iconClass, "text-pink-500")}>⭐</span>;
    case 'team_update':
      return <span className={cn(iconClass, "text-purple-500")}>👥</span>;
    case 'quick_feedback':
      return <span className={cn(iconClass, "text-orange-500")}>💬</span>;
    default:
      return <span className={cn(iconClass, "text-muted-foreground")}>🔔</span>;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onNavigate: (url: string | null, id: string) => void;
}) => {
  return (
    <div
      className={cn(
        "p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={() => onNavigate(notification.action_url, notification.id)}
      onMouseEnter={() => {
        if (!notification.is_read) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm truncate",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {notification.action_url && (
          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications(10);

  const handleNavigate = (url: string | null, id: string) => {
    markAsRead(id);
    setOpen(false);
    if (url) {
      navigate(url);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-primary cursor-pointer"
          onClick={() => {
            setOpen(false);
            navigate('/notifications');
          }}
        >
          See all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
