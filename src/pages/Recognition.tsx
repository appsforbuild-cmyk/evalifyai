import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, User, Building2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecognitionCard } from '@/components/gamification/RecognitionCard';
import { RecognitionModal } from '@/components/gamification/RecognitionModal';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { useRecognition, RECOGNITION_TYPES } from '@/hooks/useRecognition';
import { useGamification } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';

const Recognition = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { posts, trendingPosts, loading, filter, setFilter, createRecognition, toggleLike, addComment } = useRecognition();
  const { awardPoints } = useGamification();

  const handleCreateRecognition = async (toUserId: string, message: string, type: string, isPublic: boolean) => {
    await createRecognition(toUserId, message, type, isPublic);
    // Award points to giver
    await awardPoints('give_recognition');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Recognition Wall</h1>
            <p className="text-muted-foreground">Celebrate your teammates' achievements</p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Give Recognition
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'team' | 'mine')}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  Company-wide
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-2">
                  <Users className="w-4 h-4" />
                  My Team
                </TabsTrigger>
                <TabsTrigger value="mine" className="gap-2">
                  <User className="w-4 h-4" />
                  My Recognitions
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <p className="text-muted-foreground mb-4">No recognitions yet. Be the first to celebrate a teammate!</p>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Give Recognition
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RecognitionCard
                      post={post}
                      onLike={toggleLike}
                      onComment={addComment}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Points Display */}
            <PointsDisplay />

            {/* Trending */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Trending This Week
              </h3>
              {trendingPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trending posts yet</p>
              ) : (
                <div className="space-y-3">
                  {trendingPosts.slice(0, 5).map((post, index) => {
                    const type = RECOGNITION_TYPES.find(t => t.type === post.recognition_type);
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-lg">{type?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {post.to_profile?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {post.message.slice(0, 50)}...
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ❤️ {post.likes}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recognition Types Legend */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Recognition Types</h3>
              <div className="space-y-2">
                {RECOGNITION_TYPES.map(type => (
                  <div key={type.type} className="flex items-center gap-3">
                    <span className="text-xl">{type.emoji}</span>
                    <span className="text-sm">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecognitionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreateRecognition}
      />
    </DashboardLayout>
  );
};

export default Recognition;
