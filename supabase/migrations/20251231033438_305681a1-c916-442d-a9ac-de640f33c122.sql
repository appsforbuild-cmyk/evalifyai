-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL DEFAULT 'engagement',
  points INTEGER NOT NULL DEFAULT 10,
  rarity TEXT NOT NULL DEFAULT 'common',
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('feedback', 'goals', 'recognition', 'engagement')),
  CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER NOT NULL DEFAULT 0,
  is_displayed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create recognition_posts table
CREATE TABLE public.recognition_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  message TEXT NOT NULL,
  recognition_type TEXT NOT NULL DEFAULT 'thank-you',
  is_public BOOLEAN NOT NULL DEFAULT true,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_recognition_type CHECK (recognition_type IN ('thank-you', 'great-work', 'team-player', 'innovator', 'mentor'))
);

-- Create recognition_likes table
CREATE TABLE public.recognition_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recognition_id UUID NOT NULL REFERENCES public.recognition_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recognition_id, user_id)
);

-- Create recognition_comments table
CREATE TABLE public.recognition_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recognition_id UUID NOT NULL REFERENCES public.recognition_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_points table
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  points_this_week INTEGER NOT NULL DEFAULT 0,
  points_this_month INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  rank TEXT NOT NULL DEFAULT 'Beginner',
  gamification_opt_out BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create point_transactions table for tracking
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (read-only for all authenticated)
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view all achievements" ON public.user_achievements
  FOR SELECT USING (true);

CREATE POLICY "System can manage user achievements" ON public.user_achievements
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for recognition_posts
CREATE POLICY "Anyone can view public recognitions" ON public.recognition_posts
  FOR SELECT USING (is_public = true OR from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create recognition posts" ON public.recognition_posts
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their own posts" ON public.recognition_posts
  FOR UPDATE USING (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own posts" ON public.recognition_posts
  FOR DELETE USING (auth.uid() = from_user_id);

-- RLS Policies for recognition_likes
CREATE POLICY "Anyone can view likes" ON public.recognition_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their likes" ON public.recognition_likes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recognition_comments
CREATE POLICY "Anyone can view comments" ON public.recognition_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.recognition_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON public.recognition_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_points
CREATE POLICY "Users can view non-opted-out points" ON public.user_points
  FOR SELECT USING (gamification_opt_out = false OR user_id = auth.uid());

CREATE POLICY "System can manage points" ON public.user_points
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for point_transactions
CREATE POLICY "Users can view their own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions" ON public.point_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_recognition_posts_to_user ON public.recognition_posts(to_user_id);
CREATE INDEX idx_recognition_posts_created_at ON public.recognition_posts(created_at DESC);
CREATE INDEX idx_user_points_total ON public.user_points(total_points DESC);
CREATE INDEX idx_user_points_week ON public.user_points(points_this_week DESC);
CREATE INDEX idx_point_transactions_user ON public.point_transactions(user_id);

-- Seed achievements
INSERT INTO public.achievements (name, description, icon, category, points, rarity, criteria) VALUES
  ('First Feedback', 'Give your first feedback', 'message-circle', 'feedback', 10, 'common', '{"type": "feedback_given", "threshold": 1}'),
  ('Feedback Streak', 'Give feedback 5 days in a row', 'flame', 'feedback', 50, 'rare', '{"type": "feedback_streak", "threshold": 5}'),
  ('Bias Buster', 'Achieve 90+ fairness score 10 times', 'shield-check', 'feedback', 100, 'epic', '{"type": "high_fairness", "threshold": 10}'),
  ('Goal Crusher', 'Complete 10 goals', 'target', 'goals', 75, 'rare', '{"type": "goals_completed", "threshold": 10}'),
  ('Recognition Star', 'Receive 25 peer recognitions', 'star', 'recognition', 150, 'legendary', '{"type": "recognition_received", "threshold": 25}'),
  ('Team Champion', 'Give feedback to all team members in one month', 'users', 'feedback', 100, 'epic', '{"type": "team_feedback", "threshold": 1}'),
  ('Early Bird', 'Complete performance review before deadline 3 times', 'clock', 'engagement', 40, 'rare', '{"type": "early_review", "threshold": 3}'),
  ('Growth Mindset', 'Complete 5 learning modules', 'brain', 'engagement', 60, 'rare', '{"type": "learning_completed", "threshold": 5}'),
  ('Generous Giver', 'Give 50 recognitions to peers', 'gift', 'recognition', 100, 'epic', '{"type": "recognition_given", "threshold": 50}'),
  ('Engagement Champion', 'Log in 30 days in a row', 'calendar-check', 'engagement', 75, 'rare', '{"type": "login_streak", "threshold": 30}'),
  ('First Goal', 'Set your first goal', 'flag', 'goals', 10, 'common', '{"type": "goal_created", "threshold": 1}'),
  ('Milestone Master', 'Complete 20 milestones', 'award', 'goals', 125, 'epic', '{"type": "milestones_completed", "threshold": 20}'),
  ('Feedback Guru', 'Give 100 pieces of feedback', 'message-square', 'feedback', 200, 'legendary', '{"type": "feedback_given", "threshold": 100}'),
  ('Voice of the Team', 'Create 10 voice sessions', 'mic', 'feedback', 50, 'rare', '{"type": "voice_sessions", "threshold": 10}'),
  ('Quick Responder', 'Give 25 quick feedback', 'zap', 'feedback', 60, 'rare', '{"type": "quick_feedback", "threshold": 25}');