import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, Clock, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  category: string;
}

interface GoalsDisplayProps {
  profileId: string;
  compact?: boolean;
}

/**
 * Read-only display component for showing linked goals under feedback entries.
 * Non-breaking component that can be added anywhere.
 */
const GoalsDisplay = ({ profileId, compact = false }: GoalsDisplayProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileId) {
      fetchGoals();
    }
  }, [profileId]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, description, status, progress, category')
        .eq('profile_id', profileId)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setGoals(data as Goal[]);
      }
    } catch (error) {
      console.warn('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'on-hold': return <Pause className="w-3 h-3 text-amber-600" />;
      default: return <Clock className="w-3 h-3 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on-hold': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  if (loading) {
    return null;
  }

  if (goals.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Target className="w-3 h-3" /> Goals:
        </span>
        {goals.map((goal) => (
          <Badge key={goal.id} variant="outline" className="text-xs gap-1">
            {getStatusIcon(goal.status)}
            {goal.title}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
        <Target className="w-4 h-4" /> Related Goals
      </h4>
      <div className="space-y-2">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center justify-between p-2 bg-background rounded border">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getStatusIcon(goal.status)}
              <span className="text-sm truncate">{goal.title}</span>
              <Badge className={`${getStatusColor(goal.status)} text-xs`}>{goal.category}</Badge>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Progress value={goal.progress} className="w-16 h-1.5" />
              <span className="text-xs text-muted-foreground w-8">{goal.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalsDisplay;