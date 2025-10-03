import React, { useState } from 'react';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { PasswordSettings } from '@/components/settings/PasswordSettings';
import { PreferenceSettings } from '@/components/settings/PreferenceSettings';
import { DataManagement } from '@/components/settings/DataManagement';


const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    aiInsights: true,
    consentRequests: true,
    recordSharing: true,
  });

  const [privacy, setPrivacy] = useState({
    shareAnalytics: false,
    allowResearch: false,
    publicProfile: false,
  });

  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    timezone: 'Asia/Kolkata',
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <NotificationSettings 
        notifications={notifications} 
        onNotificationChange={handleNotificationChange}
      />

      <PrivacySettings 
        privacy={privacy} 
        onPrivacyChange={handlePrivacyChange}
      />

      <PasswordSettings />

      <PreferenceSettings 
        preferences={preferences} 
        onPreferenceChange={handlePreferenceChange}
      />

      <DataManagement />
    </div>
  );
};

export default Settings;