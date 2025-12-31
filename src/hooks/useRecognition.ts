import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { awardRecognitionPoints, checkAchievementProgress } from '@/lib/gamification';

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  team: string | null;
}

interface RecognitionPost {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  recognition_type: string;
  is_public: boolean;
  likes: number;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
  user_has_liked?: boolean;
  comments?: RecognitionComment[];
}

interface RecognitionComment {
  id: string;
  recognition_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export const RECOGNITION_TYPES = [
  { type: 'thank-you', label: 'Thank You', emoji: '🙏', color: 'bg-blue-100 text-blue-800' },
  { type: 'great-work', label: 'Great Work', emoji: '🌟', color: 'bg-yellow-100 text-yellow-800' },
  { type: 'team-player', label: 'Team Player', emoji: '🤝', color: 'bg-green-100 text-green-800' },
  { type: 'innovator', label: 'Innovator', emoji: '💡', color: 'bg-purple-100 text-purple-800' },
  { type: 'mentor', label: 'Mentor', emoji: '🎓', color: 'bg-orange-100 text-orange-800' },
];

export const useRecognition = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<RecognitionPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<RecognitionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'team' | 'mine'>('all');

  useEffect(() => {
    fetchPosts();
  }, [user, filter]);

  const fetchPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('recognition_posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'mine') {
        query = supabase
          .from('recognition_posts')
          .select('*')
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(50);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // Fetch profiles for each post
      const userIds = new Set<string>();
      postsData?.forEach(post => {
        userIds.add(post.from_user_id);
        userIds.add(post.to_user_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, team')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Fetch likes for current user
      const { data: userLikes } = await supabase
        .from('recognition_likes')
        .select('recognition_id')
        .eq('user_id', user.id);

      const likedPostIds = new Set(userLikes?.map(l => l.recognition_id));

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('recognition_comments')
        .select('*')
        .in('recognition_id', postsData?.map(p => p.id) || [])
        .order('created_at', { ascending: true });

      const commentsByPost = new Map<string, RecognitionComment[]>();
      commentsData?.forEach(comment => {
        const existing = commentsByPost.get(comment.recognition_id) || [];
        existing.push({
          ...comment,
          profile: profileMap.get(comment.user_id),
        });
        commentsByPost.set(comment.recognition_id, existing);
      });

      // If team filter, filter by user's team
      let filteredPosts = postsData || [];
      if (filter === 'team') {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('team')
          .eq('user_id', user.id)
          .single();

        if (userProfile?.team) {
          const teamUserIds = profiles
            ?.filter(p => p.team === userProfile.team)
            .map(p => p.user_id);

          filteredPosts = postsData?.filter(
            p => teamUserIds?.includes(p.from_user_id) || teamUserIds?.includes(p.to_user_id)
          ) || [];
        }
      }

      const enrichedPosts: RecognitionPost[] = filteredPosts.map(post => ({
        ...post,
        from_profile: profileMap.get(post.from_user_id),
        to_profile: profileMap.get(post.to_user_id),
        user_has_liked: likedPostIds.has(post.id),
        comments: commentsByPost.get(post.id) || [],
      }));

      setPosts(enrichedPosts);

      // Fetch trending (most liked this week)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: trendingData } = await supabase
        .from('recognition_posts')
        .select('*')
        .eq('is_public', true)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('likes', { ascending: false })
        .limit(5);

      const trendingEnriched: RecognitionPost[] = (trendingData || []).map(post => ({
        ...post,
        from_profile: profileMap.get(post.from_user_id),
        to_profile: profileMap.get(post.to_user_id),
        user_has_liked: likedPostIds.has(post.id),
        comments: commentsByPost.get(post.id) || [],
      }));

      setTrendingPosts(trendingEnriched);
    } catch (error) {
      console.error('Error fetching recognition posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRecognition = async (
    toUserId: string,
    message: string,
    recognitionType: string,
    isPublic: boolean = true
  ) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recognition_posts')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        message,
        recognition_type: recognitionType,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) throw error;

    // Award points to both giver and receiver
    await awardRecognitionPoints(user.id, toUserId, data.id);
    
    // Check achievements for both users
    const { count: givenCount } = await supabase
      .from('recognition_posts')
      .select('id', { count: 'exact' })
      .eq('from_user_id', user.id);
    await checkAchievementProgress(user.id, 'recognition_given', givenCount || 0);
    
    const { count: receivedCount } = await supabase
      .from('recognition_posts')
      .select('id', { count: 'exact' })
      .eq('to_user_id', toUserId);
    await checkAchievementProgress(toUserId, 'recognition_received', receivedCount || 0);

    toast({
      title: 'Recognition sent!',
      description: 'Your recognition has been posted. Points awarded to both of you!',
    });

    await fetchPosts();
    return data;
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
        await supabase
          .from('recognition_likes')
          .delete()
          .eq('recognition_id', postId)
          .eq('user_id', user.id);

        const { data: currentPost } = await supabase
          .from('recognition_posts')
          .select('likes')
          .eq('id', postId)
          .single();

        await supabase
          .from('recognition_posts')
          .update({ likes: Math.max(0, (currentPost?.likes || 1) - 1) })
          .eq('id', postId);

        // Update local state
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, likes: Math.max(0, p.likes - 1), user_has_liked: false }
              : p
          )
        );
      } else {
        await supabase.from('recognition_likes').insert({
          recognition_id: postId,
          user_id: user.id,
        });

        // Update likes count directly
        const { data: post } = await supabase
          .from('recognition_posts')
          .select('likes')
          .eq('id', postId)
          .single();

        await supabase
          .from('recognition_posts')
          .update({ likes: (post?.likes || 0) + 1 })
          .eq('id', postId);

        // Update local state
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, likes: p.likes + 1, user_has_liked: true }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recognition_comments')
        .insert({
          recognition_id: postId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch user profile for the comment
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, team')
        .eq('user_id', user.id)
        .single();

      // Update local state
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                comments: [...(p.comments || []), { ...data, profile }],
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return {
    posts,
    trendingPosts,
    loading,
    filter,
    setFilter,
    createRecognition,
    toggleLike,
    addComment,
    refetch: fetchPosts,
  };
};
