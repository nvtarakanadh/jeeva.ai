import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types';

export interface CreateNotificationData {
  userId: string;
  profileId: string;
  type: 'consent_request' | 'consent_approved' | 'consent_denied' | 
        'prescription_created' | 'prescription_updated' |
        'consultation_note_created' | 'consultation_note_updated' |
        'record_access_granted' | 'record_access_denied' |
        'consultation_booked' | 'consultation_updated' |
        'ai_analysis_complete' | 'health_alert' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Get user notifications
export const getUserNotifications = async (userId: string, limit: number = 50): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: new Date(notification.created_at),
      actionUrl: notification.action_url,
      metadata: notification.metadata || {}
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read for user
export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
};

// Create a new notification
export const createNotification = async (notificationData: CreateNotificationData): Promise<string | null> => {
  try {
    console.log('🔔 Creating notification with data:', notificationData);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        profile_id: notificationData.profileId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        action_url: notificationData.actionUrl,
        metadata: notificationData.metadata || {}
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
    
    console.log('✅ Notification created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Get unread count
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Notification creation helpers for specific events
export const createConsentRequestNotification = async (
  patientUserId: string,
  patientProfileId: string,
  doctorName: string
): Promise<string | null> => {
  return createNotification({
    userId: patientUserId,
    profileId: patientProfileId,
    type: 'consent_request',
    title: 'New Consent Request',
    message: `${doctorName} has requested access to your medical records`,
    actionUrl: '/consent-management',
    metadata: { doctorName }
  });
};

export const createConsentApprovedNotification = async (
  doctorUserId: string,
  doctorProfileId: string,
  patientName: string
): Promise<string | null> => {
  return createNotification({
    userId: doctorUserId,
    profileId: doctorProfileId,
    type: 'consent_approved',
    title: 'Consent Approved',
    message: `${patientName} has approved your consent request`,
    actionUrl: '/doctor/consents',
    metadata: { patientName }
  });
};

export const createConsentDeniedNotification = async (
  doctorUserId: string,
  doctorProfileId: string,
  patientName: string
): Promise<string | null> => {
  return createNotification({
    userId: doctorUserId,
    profileId: doctorProfileId,
    type: 'consent_denied',
    title: 'Consent Denied',
    message: `${patientName} has denied your consent request`,
    actionUrl: '/doctor/consents',
    metadata: { patientName }
  });
};

export const createPrescriptionNotification = async (
  patientUserId: string,
  patientProfileId: string,
  doctorName: string,
  prescriptionTitle: string
): Promise<string | null> => {
  return createNotification({
    userId: patientUserId,
    profileId: patientProfileId,
    type: 'prescription_created',
    title: 'New Prescription',
    message: `You have a new prescription "${prescriptionTitle}" from ${doctorName}`,
    actionUrl: '/prescriptions',
    metadata: { doctorName, prescriptionTitle }
  });
};

export const createConsultationNoteNotification = async (
  patientUserId: string,
  patientProfileId: string,
  doctorName: string,
  noteTitle: string
): Promise<string | null> => {
  console.log('🔔 createConsultationNoteNotification called with:', {
    patientUserId,
    patientProfileId,
    doctorName,
    noteTitle
  });
  
  const result = await createNotification({
    userId: patientUserId,
    profileId: patientProfileId,
    type: 'consultation_note_created',
    title: 'New Consultation Note',
    message: `You have a new consultation note "${noteTitle}" from ${doctorName}`,
    actionUrl: '/consultation-notes',
    metadata: { doctorName, noteTitle }
  });
  
  console.log('🔔 createConsultationNoteNotification result:', result);
  return result;
};

export const createRecordAccessNotification = async (
  doctorUserId: string,
  doctorProfileId: string,
  patientName: string,
  accessType: 'granted' | 'denied'
): Promise<string | null> => {
  const type = accessType === 'granted' ? 'record_access_granted' : 'record_access_denied';
  const title = accessType === 'granted' ? 'Record Access Granted' : 'Record Access Denied';
  const message = accessType === 'granted' 
    ? `You now have access to ${patientName}'s medical records`
    : `Access to ${patientName}'s medical records has been denied`;

  return createNotification({
    userId: doctorUserId,
    profileId: doctorProfileId,
    type,
    title,
    message,
    actionUrl: '/patient-records',
    metadata: { patientName, accessType }
  });
};

export const createConsultationBookedNotification = async (
  doctorUserId: string,
  doctorProfileId: string,
  patientName: string,
  consultationDate: string
): Promise<string | null> => {
  return createNotification({
    userId: doctorUserId,
    profileId: doctorProfileId,
    type: 'consultation_booked',
    title: 'New Consultation Booked',
    message: `${patientName} has booked a consultation for ${consultationDate}`,
    actionUrl: '/doctor/consultations',
    metadata: { patientName, consultationDate }
  });
};

export const createHealthAlertNotification = async (
  patientUserId: string,
  patientProfileId: string,
  alertMessage: string
): Promise<string | null> => {
  return createNotification({
    userId: patientUserId,
    profileId: patientProfileId,
    type: 'health_alert',
    title: 'Health Alert',
    message: alertMessage,
    actionUrl: '/dashboard',
    metadata: { alertType: 'health' }
  });
};
