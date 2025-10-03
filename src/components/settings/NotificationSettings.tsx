import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    aiInsights: boolean;
    consentRequests: boolean;
    recordSharing: boolean;
  };
  onNotificationChange: (key: string, value: boolean) => void;
}

export const NotificationSettings = ({ notifications, onNotificationChange }: NotificationSettingsProps) => {
  const handleChange = (key: string, value: boolean) => {
    onNotificationChange(key, value);
    toast({
      title: "Settings Updated",
      description: "Notification preferences have been saved.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about important events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => handleChange('email', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser notifications</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => handleChange('push', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive text messages for urgent updates</p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) => handleChange('sms', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Insights</Label>
              <p className="text-sm text-muted-foreground">Get notified when AI analysis is complete</p>
            </div>
            <Switch
              checked={notifications.aiInsights}
              onCheckedChange={(checked) => handleChange('aiInsights', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Consent Requests</Label>
              <p className="text-sm text-muted-foreground">Get notified of new consent requests</p>
            </div>
            <Switch
              checked={notifications.consentRequests}
              onCheckedChange={(checked) => handleChange('consentRequests', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Record Sharing</Label>
              <p className="text-sm text-muted-foreground">Get notified when records are shared</p>
            </div>
            <Switch
              checked={notifications.recordSharing}
              onCheckedChange={(checked) => handleChange('recordSharing', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};