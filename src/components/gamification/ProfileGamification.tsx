import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Heart, Award, Crown, ChevronRight, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGamification, LEVEL_THRESHOLDS } from '@/hooks/useGamification';
import { AchievementBadge } from './AchievementBadge';
import { RECOGNITION_TYPES } from '@/hooks/useRecognition';

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  team: string | null;
}

interface Recognition {
  id: string;
  from_user_id: string;
  message: string;
  recognition_type: string;
  created_at: string;
  from_profile?: Profile;
}

interface ProfileGamificationProps {
  userId: string;
  showFull?: boolean;
}

export const ProfileGamification = ({ userId, showFull = false }: ProfileGamificationProps) => {
  const { userPoints, achievements, userAchievements, getNextLevelProgress } = useGamification();
  const [recentRecognitions, setRecentRecognitions] = useState<Recognition[]>([]);
  const [stats, setStats] = useState({
    feedbackGiven: 0,
    feedbackReceived: 0,
    goalsCompleted: 0,
    recognitionsReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  const levelProgress = getNextLevelProgress();

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      // Fetch recent recognitions received
      const { data: recognitions } = await supabase
        .from('recognition_posts')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recognitions) {
        // Fetch from profiles
        const fromUserIds = recognitions.map(r => r.from_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, team')
          .in('user_id', fromUserIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

        setRecentRecognitions(recognitions.map(r => ({
          ...r,
          from_profile: profileMap.get(r.from_user_id),
        })));
      }

      // Fetch stats
      const [feedbackGiven, feedbackReceived, goalsCompleted, recognitionsReceived] = await Promise.all([
        supabase.from('voice_sessions').select('id', { count: 'exact' }).eq('manager_id', userId),
        supabase.from('feedback_entries').select('id', { count: 'exact' }).eq('is_published', true),
        supabase.from('goals').select('id', { count: 'exact' }).eq('profile_id', userId).eq('status', 'completed'),
        supabase.from('recognition_posts').select('id', { count: 'exact' }).eq('to_user_id', userId),
      ]);

      setStats({
        feedbackGiven: feedbackGiven.count || 0,
        feedbackReceived: feedbackReceived.count || 0,
        goalsCompleted: goalsCompleted.count || 0,
        recognitionsReceived: recognitionsReceived.count || 0,
      });
    } catch (error) {
      console.error('Error fetching profile gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get displayed achievements (max 3 favorites or most recent earned)
  const displayedAchievements = userAchievements
    .filter(ua => ua.earned_at)
    .sort((a, b) => {
      if (a.is_displayed && !b.is_displayed) return -1;
      if (!a.is_displayed && b.is_displayed) return 1;
      return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
    })
    .slice(0, 3)
    .map(ua => achievements.find(a => a.id === ua.achievement_id))
    .filter(Boolean);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-6">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level & Points Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
                  {userPoints?.level || 1}
                </div>
                {(userPoints?.level || 1) >= 5 && (
                  <Crown className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500" />
                )}
              </motion.div>
              <div>
                <h3 className="font-bold text-xl">{userPoints?.rank || 'Beginner'}</h3>
                <p className="text-muted-foreground">Level {userPoints?.level || 1}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{userPoints?.total_points || 0}</div>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to Level {(userPoints?.level || 1) + 1}
              </span>
              <span className="font-medium">{Math.round(levelProgress.percentage)}%</span>
            </div>
            <Progress value={levelProgress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {levelProgress.current} / {levelProgress.target} points needed
            </p>
          </div>
        </div>
      </Card>

      {/* Achievement Showcase */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievement Showcase
            </CardTitle>
            <Link to="/leaderboards" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {displayedAchievements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No achievements yet. Start using the app to unlock badges!
            </p>
          ) : (
            <div className="flex justify-center gap-4">
              {displayedAchievements.map((achievement) => (
                <motion.div
                  key={achievement!.id}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="text-center"
                >
                  <AchievementBadge
                    achievement={achievement!}
                    earned={true}
                    size="lg"
                  />
                  <p className="text-xs font-medium mt-2 max-w-16 truncate">
                    {achievement!.name}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.feedbackGiven}</div>
            <p className="text-xs text-muted-foreground">Feedback Given</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.goalsCompleted}</div>
            <p className="text-xs text-muted-foreground">Goals Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.recognitionsReceived}</div>
            <p className="text-xs text-muted-foreground">Recognitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {userAchievements.filter(ua => ua.earned_at).length}
            </div>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Recognitions */}
      {showFull && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-red-500" />
              Recent Recognitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecognitions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recognitions received yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentRecognitions.map((recognition) => {
                  const type = RECOGNITION_TYPES.find(t => t.type === recognition.recognition_type);
                  return (
                    <motion.div
                      key={recognition.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={recognition.from_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {recognition.from_profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">
                            {recognition.from_profile?.full_name || 'Someone'}
                          </p>
                          <Badge className={`text-xs ${type?.color || 'bg-muted'}`}>
                            {type?.emoji} {type?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {recognition.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
