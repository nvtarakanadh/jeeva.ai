import { supabase } from '@/integrations/supabase/client';

export interface Activity {
  id: string;
  type: 'upload' | 'analysis' | 'consent' | 'login' | 'profile_update';
  message: string;
  timestamp: string;
  metadata?: any;
}

export const getRecentActivity = async (userId: string): Promise<Activity[]> => {
  try {
    const activities: Activity[] = [];

    // Get recent health record uploads
    const { data: records, error: recordsError } = await supabase
      .from('health_records')
      .select('title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!recordsError && records) {
      records.forEach(record => {
        activities.push({
          id: `record-${record.created_at}`,
          type: 'upload',
          message: `${record.title} uploaded`,
          timestamp: record.created_at,
          metadata: { recordTitle: record.title }
        });
      });
    }

    // Get recent AI insights
    const { data: insights, error: insightsError } = await supabase
      .from('ai_insights')
      .select(`
        insight_type, 
        created_at,
        health_records!inner(title, user_id)
      `)
      .eq('health_records.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2);

    if (!insightsError && insights) {
      insights.forEach(insight => {
        activities.push({
          id: `insight-${insight.created_at}`,
          type: 'analysis',
          message: `AI analysis completed for ${insight.health_records?.title || 'health record'}`,
          timestamp: insight.created_at,
          metadata: { insightType: insight.insight_type }
        });
      });
    }

    // Get recent consent activities
    const { data: consents, error: consentsError } = await supabase
      .from('consent_requests')
      .select('status, created_at, updated_at, profiles(full_name)')
      .eq('patient_id', userId)
      .order('updated_at', { ascending: false })
      .limit(2);

    if (!consentsError && consents) {
      consents.forEach(consent => {
        const doctorName = consent.profiles?.full_name || 'Unknown Doctor';
        const message = consent.status === 'approved' 
          ? `Consent approved for ${doctorName}`
          : consent.status === 'denied'
          ? `Consent denied for ${doctorName}`
          : `Consent request from ${doctorName}`;
        
        activities.push({
          id: `consent-${consent.updated_at || consent.created_at}`,
          type: 'consent',
          message,
          timestamp: consent.updated_at || consent.created_at,
          metadata: { status: consent.status, doctorName }
        });
      });
    }

    // Sort all activities by timestamp and return the most recent 5
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    throw error;
  }
};

export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};
