import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Eye, EyeOff } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification, LEVEL_THRESHOLDS } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  points_this_week: number;
  points_this_month: number;
  level: number;
  rank: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    team: string | null;
  };
}

const Leaderboards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userPoints, toggleOptOut } = useGamification();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    fetchTeams();
  }, [timeframe, teamFilter]);

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('team')
      .not('team', 'is', null);

    const uniqueTeams = [...new Set(data?.map(p => p.team).filter(Boolean))] as string[];
    setTeams(uniqueTeams);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const orderColumn = timeframe === 'week' ? 'points_this_week' : 
                         timeframe === 'month' ? 'points_this_month' : 'total_points';

      let query = supabase
        .from('user_points')
        .select('*')
        .eq('gamification_opt_out', false)
        .order(orderColumn, { ascending: false })
        .limit(50);

      const { data: pointsData, error } = await query;
      if (error) throw error;

      // Fetch profiles
      const userIds = pointsData?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, team')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      let entries: LeaderboardEntry[] = (pointsData || []).map(p => ({
        ...p,
        profile: profileMap.get(p.user_id),
      }));

      // Filter by team if needed
      if (teamFilter !== 'all') {
        entries = entries.filter(e => e.profile?.team === teamFilter);
      }

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptOutToggle = async (optOut: boolean) => {
    await toggleOptOut(optOut);
    toast({
      title: optOut ? 'Opted out of leaderboards' : 'Opted back in',
      description: optOut 
        ? 'Your profile will no longer appear on public leaderboards'
        : 'Your profile is now visible on leaderboards',
    });
    fetchLeaderboard();
  };

  const getPointsForTimeframe = (entry: LeaderboardEntry) => {
    switch (timeframe) {
      case 'week': return entry.points_this_week;
      case 'month': return entry.points_this_month;
      default: return entry.total_points;
    }
  };

  const userRank = leaderboard.findIndex(e => e.user_id === user?.id) + 1;

  const podiumEntries = leaderboard.slice(0, 3);
  const listEntries = leaderboard.slice(3);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Leaderboards
            </h1>
            <p className="text-muted-foreground">See who's leading in engagement and recognition</p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[180px]">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Opt-out Toggle */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {userPoints?.gamification_opt_out ? (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Eye className="w-5 h-5 text-primary" />
                )}
                <div>
                  <Label htmlFor="opt-out" className="font-medium">Leaderboard Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    {userPoints?.gamification_opt_out 
                      ? 'Your profile is hidden from public leaderboards'
                      : 'Your profile is visible on leaderboards'}
                  </p>
                </div>
              </div>
              <Switch
                id="opt-out"
                checked={!userPoints?.gamification_opt_out}
                onCheckedChange={(checked) => handleOptOutToggle(!checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as 'week' | 'month' | 'all')}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="mt-6 space-y-8">
            {loading ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="w-32 h-48 rounded-xl" />
                  ))}
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No leaderboard data yet. Start earning points!</p>
              </div>
            ) : (
              <>
                {/* Podium */}
                <div className="flex items-end justify-center gap-4 px-4">
                  {/* 2nd Place */}
                  {podiumEntries[1] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <Avatar className="w-16 h-16 border-4 border-slate-400 mb-2">
                        <AvatarImage src={podiumEntries[1].profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {podiumEntries[1].profile?.full_name?.charAt(0) || '2'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm text-center truncate max-w-24">
                        {podiumEntries[1].profile?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getPointsForTimeframe(podiumEntries[1])} pts
                      </p>
                      <div className="w-24 h-24 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-lg flex items-center justify-center mt-2">
                        <Medal className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-slate-500">2</div>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  {podiumEntries[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <Crown className="w-8 h-8 text-yellow-500 mb-1" />
                      <Avatar className="w-20 h-20 border-4 border-yellow-500 mb-2">
                        <AvatarImage src={podiumEntries[0].profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {podiumEntries[0].profile?.full_name?.charAt(0) || '1'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-center truncate max-w-28">
                        {podiumEntries[0].profile?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getPointsForTimeframe(podiumEntries[0])} pts
                      </p>
                      <div className="w-28 h-32 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-center justify-center mt-2">
                        <Trophy className="w-10 h-10 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-yellow-600">1</div>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {podiumEntries[2] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <Avatar className="w-14 h-14 border-4 border-orange-400 mb-2">
                        <AvatarImage src={podiumEntries[2].profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {podiumEntries[2].profile?.full_name?.charAt(0) || '3'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm text-center truncate max-w-20">
                        {podiumEntries[2].profile?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getPointsForTimeframe(podiumEntries[2])} pts
                      </p>
                      <div className="w-20 h-20 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg flex items-center justify-center mt-2">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-xl font-bold text-orange-600">3</div>
                    </motion.div>
                  )}
                </div>

                {/* Your Rank */}
                {userRank > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            #{userRank}
                          </div>
                          <div>
                            <p className="font-semibold">Your Ranking</p>
                            <p className="text-sm text-muted-foreground">
                              Level {userPoints?.level} • {userPoints?.rank}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {timeframe === 'week' ? userPoints?.points_this_week :
                             timeframe === 'month' ? userPoints?.points_this_month :
                             userPoints?.total_points}
                          </p>
                          <p className="text-sm text-muted-foreground">points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* List */}
                <div className="space-y-2">
                  {listEntries.map((entry, index) => {
                    const globalRank = index + 4;
                    const isCurrentUser = entry.user_id === user?.id;

                    return (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          isCurrentUser ? 'bg-primary/5 border-primary/20' : 'bg-card'
                        }`}
                      >
                        <div className="w-8 text-center font-semibold text-muted-foreground">
                          {globalRank}
                        </div>
                        <Avatar>
                          <AvatarImage src={entry.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {entry.profile?.full_name || 'Anonymous'}
                            {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.profile?.team} • Level {entry.level}
                          </p>
                        </div>
                        <Badge variant="secondary">{entry.rank}</Badge>
                        <div className="text-right">
                          <p className="font-bold">{getPointsForTimeframe(entry)}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboards;
