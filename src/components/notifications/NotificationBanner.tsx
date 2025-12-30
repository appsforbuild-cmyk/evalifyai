import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const NotificationBanner = () => {
  const { unreadCount } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (unreadCount === 0 || dismissed) return null;

  return (
    <div className={cn(
      "bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between",
      "animate-in slide-in-from-top-2 duration-300"
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-full">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </p>
          <p className="text-sm text-muted-foreground">
            Check your notifications to stay up to date
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" asChild>
          <Link to="/notifications">View all</Link>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
