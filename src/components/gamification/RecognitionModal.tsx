import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Globe, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RECOGNITION_TYPES } from '@/hooks/useRecognition';

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  team: string | null;
}

interface RecognitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (toUserId: string, message: string, type: string, isPublic: boolean) => Promise<void>;
}

export const RecognitionModal = ({ open, onOpenChange, onSubmit }: RecognitionModalProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedType, setSelectedType] = useState(RECOGNITION_TYPES[0].type);
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedUser(null);
      setMessage('');
      setSelectedType(RECOGNITION_TYPES[0].type);
      setIsPublic(true);
      setSearchQuery('');
    }
  }, [open]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, team')
      .neq('user_id', user?.id);

    setUsers(data || []);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedUser || message.length < 50) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedUser.user_id, message, selectedType, isPublic);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting recognition:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Recognize a Teammate</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Who do you want to recognize?</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedUser.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.team}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teammates..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredUsers.slice(0, 10).map(u => (
                    <motion.button
                      key={u.user_id}
                      whileHover={{ x: 4 }}
                      onClick={() => setSelectedUser(u)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {u.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.team}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recognition Type */}
          <div className="space-y-2">
            <Label>Recognition Type</Label>
            <div className="grid grid-cols-5 gap-2">
              {RECOGNITION_TYPES.map(type => (
                <motion.button
                  key={type.type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedType(type.type)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors
                    ${selectedType === type.type 
                      ? 'border-primary bg-primary/10' 
                      : 'border-transparent bg-muted hover:border-muted-foreground/30'
                    }
                  `}
                >
                  <span className="text-2xl">{type.emoji}</span>
                  <span className="text-xs text-center font-medium">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message (min. 50 characters)</Label>
            <Textarea
              placeholder="Share what this person did that made a difference..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
            />
            <p className={`text-xs ${message.length < 50 ? 'text-muted-foreground' : 'text-green-600'}`}>
              {message.length}/50 characters minimum
            </p>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <Label htmlFor="public-toggle" className="text-sm">
                {isPublic ? 'Public recognition (visible to everyone)' : 'Private recognition (only recipient sees)'}
              </Label>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedUser || message.length < 50 || isSubmitting}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Recognition'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
