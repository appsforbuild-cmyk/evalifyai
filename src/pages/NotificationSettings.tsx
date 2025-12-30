import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences } from '@/hooks/useNotifications';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Target, 
  Calendar, 
  Star, 
  Users,
  Loader2,
  Save
} from 'lucide-react';

interface ChannelSetting {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const notificationChannels: ChannelSetting[] = [
  {
    key: 'feedback_received',
    label: 'Feedback Received',
    description: 'When you receive new feedback from a manager',
    icon: <MessageSquare className="w-5 h-5 text-primary" />,
  },
  {
    key: 'feedback_published',
    label: 'Feedback Published',
    description: 'When your feedback is published and ready to view',
    icon: <MessageSquare className="w-5 h-5 text-primary" />,
  },
  {
    key: 'goal_completed',
    label: 'Goal Completed',
    description: 'When a goal is marked as complete',
    icon: <Target className="w-5 h-5 text-green-500" />,
  },
  {
    key: 'milestone_achieved',
    label: 'Milestone Achieved',
    description: 'When you or your team achieves a milestone',
    icon: <Star className="w-5 h-5 text-yellow-500" />,
  },
  {
    key: 'session_scheduled',
    label: 'Session Scheduled',
    description: 'When a feedback session is scheduled with you',
    icon: <Calendar className="w-5 h-5 text-blue-500" />,
  },
  {
    key: 'recognition_received',
    label: 'Recognition Received',
    description: 'When you receive recognition from a colleague',
    icon: <Star className="w-5 h-5 text-pink-500" />,
  },
  {
    key: 'team_update',
    label: 'Team Updates',
    description: 'General updates about your team',
    icon: <Users className="w-5 h-5 text-purple-500" />,
  },
  {
    key: 'quick_feedback',
    label: 'Quick Feedback',
    description: 'When you receive quick feedback',
    icon: <MessageSquare className="w-5 h-5 text-orange-500" />,
  },
];

const NotificationSettings = () => {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();
  
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [frequency, setFrequency] = useState<'real-time' | 'daily-digest' | 'weekly-digest'>('real-time');
  const [channels, setChannels] = useState<Record<string, { email: boolean; push: boolean }>>({});

  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.email_enabled);
      setPushEnabled(preferences.push_enabled);
      setFrequency(preferences.frequency);
      setChannels(preferences.channels as Record<string, { email: boolean; push: boolean }>);
    } else {
      // Set defaults
      const defaultChannels: Record<string, { email: boolean; push: boolean }> = {};
      notificationChannels.forEach(channel => {
        defaultChannels[channel.key] = { email: true, push: true };
      });
      setChannels(defaultChannels);
    }
  }, [preferences]);

  const handleChannelToggle = (channelKey: string, type: 'email' | 'push', enabled: boolean) => {
    setChannels(prev => ({
      ...prev,
      [channelKey]: {
        ...prev[channelKey],
        [type]: enabled,
      },
    }));
  };

  const handleSave = () => {
    updatePreferences({
      email_enabled: emailEnabled,
      push_enabled: pushEnabled,
      frequency,
      channels: channels as unknown as Record<string, never>,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage how and when you receive notifications
          </p>
        </div>

        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Global Settings
            </CardTitle>
            <CardDescription>
              Control your overall notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-enabled" className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                id="email-enabled"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="push-enabled" className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive in-app push notifications</p>
                </div>
              </div>
              <Switch
                id="push-enabled"
                checked={pushEnabled}
                onCheckedChange={setPushEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base">Notification Frequency</Label>
              <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="real-time" id="real-time" />
                  <Label htmlFor="real-time" className="font-normal">
                    Real-time - Get notifications as they happen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily-digest" id="daily-digest" />
                  <Label htmlFor="daily-digest" className="font-normal">
                    Daily digest - Get a summary once a day
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly-digest" id="weekly-digest" />
                  <Label htmlFor="weekly-digest" className="font-normal">
                    Weekly digest - Get a summary once a week
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Channel Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive and how
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notificationChannels.map((channel, index) => (
                <div key={channel.key}>
                  <div className="flex items-start gap-4 py-4">
                    {channel.icon}
                    <div className="flex-1">
                      <p className="font-medium">{channel.label}</p>
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${channel.key}-email`}
                          checked={channels[channel.key]?.email ?? true}
                          onCheckedChange={(checked) => handleChannelToggle(channel.key, 'email', checked)}
                          disabled={!emailEnabled}
                        />
                        <Label htmlFor={`${channel.key}-email`} className="text-sm text-muted-foreground">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${channel.key}-push`}
                          checked={channels[channel.key]?.push ?? true}
                          onCheckedChange={(checked) => handleChannelToggle(channel.key, 'push', checked)}
                          disabled={!pushEnabled}
                        />
                        <Label htmlFor={`${channel.key}-push`} className="text-sm text-muted-foreground">
                          Push
                        </Label>
                      </div>
                    </div>
                  </div>
                  {index < notificationChannels.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;
