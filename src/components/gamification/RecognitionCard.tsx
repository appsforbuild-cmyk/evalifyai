import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RECOGNITION_TYPES } from '@/hooks/useRecognition';

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  team: string | null;
}

interface RecognitionComment {
  id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

interface RecognitionPost {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  recognition_type: string;
  likes: number;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
  user_has_liked?: boolean;
  comments?: RecognitionComment[];
}

interface RecognitionCardProps {
  post: RecognitionPost;
  onLike: (postId: string, currentlyLiked: boolean) => void;
  onComment: (postId: string, content: string) => void;
}

export const RecognitionCard = ({ post, onLike, onComment }: RecognitionCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const recognitionType = RECOGNITION_TYPES.find(t => t.type === post.recognition_type);

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onComment(post.id, newComment);
      setNewComment('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.from_profile?.avatar_url || undefined} />
            <AvatarFallback>
              {post.from_profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              <span>{post.from_profile?.full_name || 'Someone'}</span>
              <span className="text-muted-foreground font-normal"> recognized </span>
              <span>{post.to_profile?.full_name || 'Someone'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${recognitionType?.color || 'bg-muted'}`}>
          <span>{recognitionType?.emoji}</span>
          <span>{recognitionType?.label}</span>
        </span>
      </div>

      {/* Message */}
      <p className="text-foreground leading-relaxed">{post.message}</p>

      {/* Recipient Highlight */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Avatar className="w-10 h-10 border-2 border-primary">
          <AvatarImage src={post.to_profile?.avatar_url || undefined} />
          <AvatarFallback>
            {post.to_profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.to_profile?.full_name}</p>
          <p className="text-sm text-muted-foreground">{post.to_profile?.team}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id, post.user_has_liked || false)}
          className={post.user_has_liked ? 'text-red-500' : ''}
        >
          <Heart className={`w-4 h-4 mr-1 ${post.user_has_liked ? 'fill-current' : ''}`} />
          {post.likes}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          {post.comments?.length || 0}
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 pt-3 border-t"
        >
          {post.comments?.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {comment.profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted rounded-lg p-2">
                <p className="text-sm font-medium">{comment.profile?.full_name}</p>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSubmitComment} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
