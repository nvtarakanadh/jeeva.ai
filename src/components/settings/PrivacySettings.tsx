import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PrivacySettingsProps {
  privacy: {
    shareAnalytics: boolean;
    allowResearch: boolean;
    publicProfile: boolean;
  };
  onPrivacyChange: (key: string, value: boolean) => void;
}

export const PrivacySettings = ({ privacy, onPrivacyChange }: PrivacySettingsProps) => {
  const handleChange = (key: string, value: boolean) => {
    onPrivacyChange(key, value);
    toast({
      title: "Privacy Settings Updated",
      description: "Your privacy preferences have been saved.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Security
        </CardTitle>
        <CardDescription>
          Control how your data is used and shared
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Share Analytics</Label>
              <p className="text-sm text-muted-foreground">Help improve our platform with anonymous usage data</p>
            </div>
            <Switch
              checked={privacy.shareAnalytics}
              onCheckedChange={(checked) => handleChange('shareAnalytics', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Research Participation</Label>
              <p className="text-sm text-muted-foreground">Participate in approved medical research studies</p>
            </div>
            <Switch
              checked={privacy.allowResearch}
              onCheckedChange={(checked) => handleChange('allowResearch', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Profile</Label>
              <p className="text-sm text-muted-foreground">Make basic profile visible to healthcare providers</p>
            </div>
            <Switch
              checked={privacy.publicProfile}
              onCheckedChange={(checked) => handleChange('publicProfile', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};