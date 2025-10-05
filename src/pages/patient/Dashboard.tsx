import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addMinutes } from 'date-fns';
import { getHealthRecordSummary } from '@/services/healthRecordsService';
import { getAIInsightSummary } from '@/services/aiInsightsService';
import { getRecentActivity, formatTimeAgo } from '@/services/activityService';
import { getHealthAlerts } from '@/services/healthAlertsService';
import { InlineLoadingSpinner, CardLoadingSpinner } from '@/components/ui/loading-spinner';
import { PageSkeleton } from '@/components/ui/skeleton-loading';
import { cacheService, createCacheKey, CACHE_TTL } from '@/services/cacheService';
import { getPatientConsentRequests } from '@/services/consentService';
import { supabase } from '@/integrations/supabase/client';
import { getDoctors } from '@/services/doctorsService';
import QuickActions from '@/components/layout/QuickActions';
import PatientCalendarComponent, { PatientAppointment } from '@/components/calendar/PatientCalendarComponent';
import PatientSchedulingModal, { PatientScheduleData } from '@/components/calendar/PatientSchedulingModal';
import DayViewModal, { DayViewEvent } from '@/components/calendar/DayViewModal';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [healthRecords, setHealthRecords] = useState({ totalRecords: 0, recentRecords: [] });
  const [aiInsights, setAiInsights] = useState({ totalInsights: 0, recentInsights: [], averageConfidence: 0 });
  const [activeConsents, setActiveConsents] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [healthAlerts, setHealthAlerts] = useState([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<PatientAppointment | null>(null);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialization?: string }>>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testCenters, setTestCenters] = useState<Array<{ id: string; name: string; address?: string }>>([]);

  // Test function for debugging deletion
  const testDeletion = async (consultationId: string) => {
    console.log('🧪 Testing deletion for:', consultationId);
    
    try {
      // Test 1: Check current user and profile
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Auth error:', authError);
        return false;
      }
      console.log('✅ Current user:', user?.email);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, user_id')
        .eq('user_id', user?.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile error:', profileError);
        return false;
      }
      console.log('✅ Profile:', profile);

      // Test 2: Check if consultation exists
      const { data: existing, error: fetchError } = await supabase
        .from('consultations')
        .select('id, patient_id, doctor_id, reason, status, consent_id')
        .eq('id', consultationId)
        .single();
      
      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        return false;
      }
      
      console.log('✅ Consultation exists:', existing);
      
      // Test 3: Check if user owns this consultation
      if (existing.patient_id !== profile.id) {
        console.error('❌ User does not own this consultation');
        console.log('Consultation patient_id:', existing.patient_id);
        console.log('User profile_id:', profile.id);
        return false;
      }
      console.log('✅ User owns this consultation');
      
      // Test 4: Check RLS permissions by trying to select
      const { data: rlsTest, error: rlsError } = await supabase
        .from('consultations')
        .select('id')
        .eq('id', consultationId);
      
      if (rlsError) {
        console.error('❌ RLS error:', rlsError);
        return false;
      }
      
      console.log('✅ RLS permissions OK:', rlsTest);
      
      // Test 5: Handle consent_id constraint before deletion
      if (existing.consent_id) {
        console.log('🔧 Setting consent_id to NULL before deletion...');
        const { error: updateError } = await supabase
          .from('consultations')
          .update({ consent_id: null })
          .eq('id', consultationId);
        
        if (updateError) {
          console.warn('⚠️ Warning: Could not set consent_id to NULL:', updateError);
        } else {
          console.log('✅ consent_id set to NULL');
        }
      }
      
      // Test 6: Attempt deletion
      console.log('🗑️ Attempting deletion...');
      const { data: deleteResult, error: deleteError } = await supabase
        .from('consultations')
        .delete()
        .eq('id', consultationId)
        .select();
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        console.error('Error details:', {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        });
        return false;
      }
      
      console.log('✅ Delete result:', deleteResult);
      
      // Test 7: Verify deletion
      const { data: verifyResult, error: verifyError } = await supabase
        .from('consultations')
        .select('id')
        .eq('id', consultationId);
      
      if (verifyError) {
        console.error('❌ Verify error:', verifyError);
      } else {
        console.log('🔍 Verification result:', verifyResult);
        if (verifyResult && verifyResult.length === 0) {
          console.log('🎉 Deletion verified successfully!');
        } else {
          console.log('⚠️ Deletion verification failed - consultation still exists');
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Test error:', error);
      return false;
    }
  };

  // Expose test function to window for debugging
  React.useEffect(() => {
    (window as any).testDeletion = testDeletion;
    (window as any).listConsultations = async () => {
      const { data: consultations, error } = await supabase
        .from('consultations')
        .select(`
          id,
          consultation_date,
          consultation_time,
          reason,
          status,
          consent_id,
          profiles!consultations_patient_id_fkey(full_name)
        `)
        .eq('profiles.user_id', user?.id);
      
      if (error) {
        console.error('Error listing consultations:', error);
        return [];
      }
      
      console.log('📋 Current consultations:', consultations);
      return consultations;
    };
    console.log('🧪 Debug functions available:');
    console.log('- window.testDeletion(consultationId) - Test deletion');
    console.log('- window.listConsultations() - List all consultations');
  }, [user?.id, testDeletion]);

  // Also expose immediately for debugging
  (window as any).testDeletion = testDeletion;
  (window as any).listConsultations = async () => {
    if (!user?.id) {
      console.error('❌ No user logged in');
      return [];
    }
    
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        id,
        consultation_date,
        consultation_time,
        reason,
        status,
        consent_id,
        profiles!consultations_patient_id_fkey(full_name)
      `)
      .eq('profiles.user_id', user.id);
    
    if (error) {
      console.error('Error listing consultations:', error);
      return [];
    }
    
    console.log('📋 Current consultations:', consultations);
    return consultations;
  };

  // Add a simple test function that doesn't depend on component state
  (window as any).testDeletionSimple = async (consultationId) => {
    console.log('🧪 Testing deletion for:', consultationId);
    
    try {
      const { data, error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', consultationId)
        .select();
      
      if (error) {
        console.error('❌ Delete error:', error);
        return false;
      }
      
      console.log('✅ Delete result:', data);
      return true;
    } catch (error) {
      console.error('❌ Test error:', error);
      return false;
    }
  };

  console.log('🧪 Debug functions loaded!');
  console.log('Available functions:');
  console.log('- window.testDeletion(consultationId)');
  console.log('- window.listConsultations()');
  console.log('- window.testDeletionSimple(consultationId)');
  
  // Add function to create test appointment
  (window as any).createTestAppointment = async (doctorId: string, date: string, time: string) => {
    console.log('🧪 Creating test appointment...');
    const testData: PatientScheduleData = {
      title: 'Test Consultation',
      appointment_type: 'consultation',
      date: date,
      time: time,
      duration: 30,
      doctor_id: doctorId,
      test_center_id: '',
      notes: 'Test appointment for debugging',
      status: 'pending'
    };
    
    try {
      await handleScheduleAppointment(testData);
      console.log('✅ Test appointment created successfully');
    } catch (error) {
      console.error('❌ Failed to create test appointment:', error);
    }
  };
  
  console.log('- window.createTestAppointment(doctorId, date, time) - Create test appointment');
  
  // Add function to open scheduling modal for testing
  (window as any).openSchedulingModal = (date?: string) => {
    const testDate = date ? new Date(date) : new Date();
    console.log('🧪 Opening DayViewModal for date:', testDate);
    setDayViewDate(testDate);
    setIsDayViewOpen(true);
  };
  
  console.log('- window.openSchedulingModal(date?) - Open scheduling modal for testing');
  
  // Add function to check and create test data
  (window as any).setupTestData = async () => {
    console.log('🧪 Setting up test data...');
    
    // First, list current consultations
    console.log('📋 Current consultations:');
    await (window as any).listConsultations();
    
    // Get doctors
    console.log('👨‍⚕️ Available doctors:', doctors);
    
    if (doctors.length > 0) {
      const firstDoctor = doctors[0];
      const today = new Date().toISOString().split('T')[0];
      console.log(`📅 Creating test appointment with doctor ${firstDoctor.name} (${firstDoctor.id}) for ${today} at 10:00`);
      
      // Create test appointment
      await (window as any).createTestAppointment(firstDoctor.id, today, '10:00');
      
      // Wait a moment and then open the modal
      setTimeout(() => {
        console.log('🔍 Opening modal to test blocking...');
        (window as any).openSchedulingModal(today);
      }, 1000);
    } else {
      console.log('❌ No doctors available for testing');
    }
  };
  
  console.log('- window.setupTestData() - Create test appointment and open modal');
  
  // Add function to test Supabase connection
  (window as any).testSupabaseConnection = async () => {
    console.log('🔍 Testing Supabase connection...');
    
    try {
      // Test 1: Check auth
      console.log('🔍 Testing auth...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('✅ Auth test:', user ? `User logged in: ${user.email}` : 'No user', authError);
      
      // Test 2: Check profiles table
      console.log('🔍 Testing profiles table...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .limit(5);
      console.log('✅ Profiles test:', profiles?.length || 0, 'profiles found', profilesError);
      if (profilesError) console.error('❌ Profiles error details:', profilesError);
      
      // Test 3: Check consultations table
      console.log('🔍 Testing consultations table...');
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('id, consultation_date, doctor_id, patient_id')
        .limit(5);
      console.log('✅ Consultations test:', consultations?.length || 0, 'consultations found', consultationsError);
      if (consultationsError) console.error('❌ Consultations error details:', consultationsError);
      
      // Test 4: Check health_records table
      console.log('🔍 Testing health_records table...');
      const { data: healthRecords, error: healthRecordsError } = await supabase
        .from('health_records')
        .select('id, record_type, created_at')
        .limit(5);
      console.log('✅ Health records test:', healthRecords?.length || 0, 'health records found', healthRecordsError);
      if (healthRecordsError) console.error('❌ Health records error details:', healthRecordsError);
      
      const result = {
        auth: !authError,
        profiles: !profilesError,
        consultations: !consultationsError,
        healthRecords: !healthRecordsError,
        user: user?.email || 'No user',
        profileCount: profiles?.length || 0,
        consultationCount: consultations?.length || 0,
        healthRecordCount: healthRecords?.length || 0
      };
      
      console.log('🎯 Final test result:', result);
      return result;
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { error: error.message };
    }
  };
  
  console.log('- window.testSupabaseConnection() - Test Supabase connection');
  
  // Add a simpler test function
  (window as any).quickTest = () => {
    console.log('🔍 Quick Supabase test...');
    console.log('Current user:', user);
    console.log('Current appointments:', appointments.length);
    console.log('Current doctors:', doctors.length);
    console.log('Supabase client:', supabase);
    
    // Test a simple query
    supabase.from('profiles').select('count').then(({ data, error }) => {
      console.log('✅ Simple query test:', data, error);
    });
  };
  
  console.log('- window.quickTest() - Quick Supabase test');
  
  // Add function to inspect current appointments
  (window as any).inspectAppointments = () => {
    console.log('🔍 Inspecting current appointments...');
    console.log('Total appointments:', appointments.length);
    appointments.forEach((apt, index) => {
      console.log(`Appointment ${index + 1}:`, {
        id: apt.id,
        title: apt.title,
        start: apt.start,
        end: apt.end,
        doctor_id: apt.doctor_id,
        doctor_name: apt.doctor_name,
        appointment_type: apt.appointment_type,
        status: apt.status
      });
    });
    
    // Also check what gets passed to DayViewModal
    const dayViewEvents = convertToDayViewEvents(appointments);
    console.log('DayViewEvents:', dayViewEvents);
    
    return appointments;
  };
  
  console.log('- window.inspectAppointments() - Inspect current appointments');
  
  // Add function to test blocking logic
  (window as any).testBlocking = (doctorId, date, time) => {
    console.log('🧪 Testing blocking logic...');
    console.log('Doctor ID:', doctorId);
    console.log('Date:', date);
    console.log('Time:', time);
    console.log('Current appointments state:', appointments);
    
    // Convert appointments to the format expected by PatientSchedulingModal
    const testAppointments = appointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      start: apt.start,
      end: apt.end,
      appointment_type: apt.appointment_type,
      status: apt.status,
      doctor_name: apt.doctor_name,
      notes: apt.notes,
      patient_id: apt.patient_id,
      doctor_id: apt.doctor_id
    }));
    
    console.log('Test appointments for blocking:', testAppointments);
    
    // Filter by doctor
    const relevantAppointments = testAppointments.filter(apt => apt.doctor_id === doctorId);
    console.log('Relevant appointments for doctor:', relevantAppointments);
    
    // Check if time slot would be blocked
    const slotStart = new Date(`${date}T${time}`);
    const slotEnd = new Date(slotStart.getTime() + (30 * 60000)); // 30 minutes
    
    const isBlocked = relevantAppointments.some(apt => {
      const aptStart = new Date(apt.start);
      const aptEnd = new Date(apt.end);
      const overlaps = (slotStart < aptEnd && slotEnd > aptStart);
      
      if (overlaps) {
        console.log('🚫 Slot blocked by appointment:', apt);
      }
      
      return overlaps;
    });
    
    console.log('Is slot blocked?', isBlocked);
    return isBlocked;
  };
  
  console.log('- window.testBlocking(doctorId, date, time) - Test blocking logic');
  
  // Add function to test with correct date
  (window as any).testWithCorrectDate = () => {
    console.log('🧪 Testing with correct date (October 5, 2025)...');
    
    const doctorId = '4e77d0cc-c61a-4aa1-9435-f294d8b29e4e';
    const correctDate = '2025-10-05';
    
    // Test blocking for the actual appointment times
    console.log('Testing 10:30 AM slot (should be blocked):');
    (window as any).testBlocking(doctorId, correctDate, '10:30');
    
    console.log('Testing 11:30 AM slot (should be blocked):');
    (window as any).testBlocking(doctorId, correctDate, '11:30');
    
    console.log('Testing 9:00 AM slot (should be available):');
    (window as any).testBlocking(doctorId, correctDate, '09:00');
    
    // Open modal with correct date
    console.log('Opening modal with correct date...');
    (window as any).openSchedulingModal(correctDate);
  };
  
  console.log('- window.testWithCorrectDate() - Test with correct date');
  
  // Add function to refresh appointments
  (window as any).refreshAppointments = async () => {
    console.log('🔄 Refreshing appointments...');
    if (user?.id) {
      try {
        const freshAppointments = await getCachedAppointments(user.id);
        console.log('✅ Fresh appointments loaded:', freshAppointments);
        setAppointments(freshAppointments as PatientAppointment[]);
        return freshAppointments;
      } catch (error) {
        console.error('❌ Error refreshing appointments:', error);
        return [];
      }
    } else {
      console.log('❌ No user ID available');
      return [];
    }
  };
  
  console.log('- window.refreshAppointments() - Refresh appointments from database');
  
  // Add function to test blocking with fresh data
  (window as any).testBlockingWithRefresh = async (doctorId, date, time) => {
    console.log('🧪 Testing blocking with fresh data...');
    
    // First refresh appointments
    const freshAppointments = await (window as any).refreshAppointments();
    
    // Wait a moment for state to update
    setTimeout(() => {
      console.log('🧪 Now testing blocking logic...');
      (window as any).testBlocking(doctorId, date, time);
    }, 1000);
  };
  
  console.log('- window.testBlockingWithRefresh(doctorId, date, time) - Test blocking with fresh data');

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        const profileCacheKey = createCacheKey('patient-profile', user.id);
        let profile = cacheService.get(profileCacheKey);
        
        if (!profile) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('role', 'patient')
            .single();

          if (profileError) throw profileError;
          profile = profileData;
          cacheService.set(profileCacheKey, profile, CACHE_TTL.LONG);
        }

        const [
          healthRecordsData,
          aiInsightsData,
          consentRequestsData,
          activityData,
          alertsData,
          appointmentsData,
          doctorsData,
          testCentersData
        ] = await Promise.all([
          getCachedHealthRecords(user.id),
          getCachedAIInsights(user.id),
          getCachedConsentRequests((profile as any).id),
          getCachedRecentActivity(user.id),
          getCachedHealthAlerts(user.id),
          getCachedAppointments(user.id),
          getCachedDoctors(),
          getCachedTestCenters()
        ]);

        setHealthRecords(healthRecordsData as any);
        setAiInsights(aiInsightsData as any);
        setActiveConsents((consentRequestsData as any[]).filter((consent: any) => consent.status === 'approved').length);
        setRecentActivity(activityData as any);
        setHealthAlerts(alertsData as any);
        setAppointments(appointmentsData as any);
        console.log('🔍 Setting doctors in state:', doctorsData);
        console.log('🔍 Doctors length:', Array.isArray(doctorsData) ? doctorsData.length : 0);
        
        // Set doctors data
        setDoctors(doctorsData as any);
        setTestCenters(testCentersData as any);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Real-time subscription for consultations
  useEffect(() => {
    if (!user?.id) return;

    let subscription: any;

    const setupRealtimeSubscription = async () => {
      // Get patient profile ID
      const { data: patientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !patientProfile) {
        console.error('Patient profile not found for real-time subscription:', profileError);
        return;
      }

      // Subscribe to consultations changes
      subscription = supabase
        .channel('patient-consultations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'consultations',
            filter: `patient_id=eq.${patientProfile.id}`
          },
          (payload) => {
            console.log('🔄 Real-time consultation update:', payload);
            
            // Skip real-time updates if we're currently deleting
            if (isDeleting) {
              console.log('⏸️ Skipping real-time update - deletion in progress');
              return;
            }
            
            // Only refresh on INSERT and UPDATE, not DELETE (to avoid reloading deleted items)
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              console.log('🔄 Refreshing appointments due to INSERT/UPDATE');
              // Clear cache and refresh from database
              const cacheKey = createCacheKey('patient-appointments', user.id);
              cacheService.delete(cacheKey);
              
              getCachedAppointments(user.id).then((appointments) => {
                setAppointments(appointments as PatientAppointment[]);
              });
            } else if (payload.eventType === 'DELETE') {
              console.log('🔄 Handling DELETE event - removing from local state');
              // For DELETE events, just remove from local state
              const deletedId = (payload as any).old_record?.id;
              if (deletedId) {
                setAppointments(prev => prev.filter(apt => apt.id !== deletedId));
                console.log('✅ Removed deleted consultation from local state');
              }
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user?.id, isDeleting]);

  // Cached fetchers
  const getCachedHealthRecords = async (userId: string) => {
    const cacheKey = createCacheKey('health-records', userId);
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const data = await getHealthRecordSummary(userId);
    cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
    return data;
  };

  const getCachedAIInsights = async (userId: string) => {
    const cacheKey = createCacheKey('ai-insights', userId);
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const data = await getAIInsightSummary(userId);
    cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
    return data;
  };

  const getCachedConsentRequests = async (profileId: string) => {
    const cacheKey = createCacheKey('consent-requests', profileId);
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const data = await getPatientConsentRequests(profileId);
    cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
    return data;
  };

  const getCachedRecentActivity = async (userId: string) => {
    const cacheKey = createCacheKey('recent-activity', userId);
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const data = await getRecentActivity(userId);
    cacheService.set(cacheKey, data, CACHE_TTL.SHORT);
    return data;
  };

  const getCachedHealthAlerts = async (userId: string) => {
    const cacheKey = createCacheKey('health-alerts', userId);
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const data = await getHealthAlerts(userId);
    cacheService.set(cacheKey, data, CACHE_TTL.SHORT);
    return data;
  };

  // Function to get blocked time slots for a specific doctor
  const getBlockedTimeSlots = async (doctorId: string, date: string) => {
    try {
      const { data: blockedConsultations, error } = await supabase
        .from('consultations')
        .select(`
          id,
          reason,
          consultation_date,
          consultation_time,
          status,
          doctor_id,
          notes
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'cancelled')
        .eq('consultation_date', date)
        .or('reason.ilike.%blocked%,reason.ilike.%unavailable%,reason.ilike.%lunch%');

      if (error) {
        console.error('Error fetching blocked time slots:', error);
        return [];
      }

      // Convert consultations to blocked time slot format
      const blockedSlots = (blockedConsultations || []).map(consultation => {
        // Calculate end time (default 30 minutes if not specified)
        const startTime = new Date(`${consultation.consultation_date}T${consultation.consultation_time}`);
        const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes default
        
        return {
          id: consultation.id,
          title: consultation.reason || 'Blocked Time',
          start_time: `${consultation.consultation_date}T${consultation.consultation_time}`,
          end_time: endTime.toISOString(),
          event_type: 'blocked',
          doctor_id: consultation.doctor_id,
          notes: consultation.notes
        };
      });

      return blockedSlots;
    } catch (error) {
      console.error('Error in getBlockedTimeSlots:', error);
      return [];
    }
  };

  const getCachedAppointments = async (userId: string) => {
    const cacheKey = createCacheKey('patient-appointments', userId);
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    try {
      // Get patient profile ID first
      const { data: patientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !patientProfile) {
        console.error('Patient profile not found:', profileError);
        return [];
      }

          // Fetch consultations using the consultation service
          const { data: consultations, error: consultationError } = await supabase
            .from('consultations')
            .select(`
              id,
              consultation_date,
              consultation_time,
              end_time,
              duration_minutes,
              reason,
              notes,
              status,
              doctor_id,
              profiles!consultations_doctor_id_fkey(full_name)
            `)
            .eq('patient_id', patientProfile.id)
            .order('consultation_date', { ascending: true });

      if (consultationError) {
        console.error('Error fetching consultations:', consultationError);
        return [];
      }

          const formattedAppointments: PatientAppointment[] = consultations?.map((consultation: any) => {
        // Combine date and time to create start time
        const consultationDate = new Date(consultation.consultation_date);
        const [hours, minutes] = consultation.consultation_time.split(':').map(Number);
        const startTime = new Date(consultationDate);
        startTime.setHours(hours, minutes, 0, 0);
        
            // Use end_time from database if available, otherwise calculate from duration
            let endTime: Date;
            if (consultation.end_time) {
              const [endHours, endMinutes] = consultation.end_time.split(':').map(Number);
              endTime = new Date(consultationDate);
              endTime.setHours(endHours, endMinutes, 0, 0);
            } else {
              // Fallback to calculating from duration
              const duration = consultation.duration_minutes || 30;
              endTime = new Date(startTime.getTime() + duration * 60000);
            }
        
        return {
          id: consultation.id,
          title: consultation.reason || 'Consultation',
          start: startTime,
          end: endTime,
          appointment_type: 'consultation' as const,
              status: consultation.status as 'pending' | 'confirmed' | 'cancelled' | 'scheduled',
              doctor_name: consultation.profiles?.full_name || 'Dr. Unknown',
          notes: consultation.notes || '',
          patient_id: userId,
          doctor_id: consultation.doctor_id
        };
      }) || [];
      
      cacheService.set(cacheKey, formattedAppointments, CACHE_TTL.MEDIUM);
      return formattedAppointments;
    } catch (error) {
      console.error('Error fetching consultations:', error);
      // Fallback to empty array
      const mockAppointments: PatientAppointment[] = [];
      cacheService.set(cacheKey, mockAppointments, CACHE_TTL.SHORT);
      return mockAppointments;
    }
  };

  const getCachedDoctors = async () => {
    const cacheKey = createCacheKey('doctors-list', 'all');
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    try {
      console.log('🔍 Fetching doctors using Supabase service...');
      const doctors = await getDoctors();
      
      if (doctors && doctors.length > 0) {
        console.log('✅ Successfully fetched doctors:', doctors);
        cacheService.set(cacheKey, doctors, CACHE_TTL.MEDIUM);
        return doctors;
      } else {
        console.warn('⚠️ No doctors returned from service, using fallback');
        throw new Error('No doctors found');
      }
    } catch (error) {
      console.error('❌ Error fetching doctors from service:', error);
      // The service will handle fallback data, so we can return empty array here
      // and let the service's fallback mechanism work
      return [];
    }
  };

  const getCachedTestCenters = async () => {
    const cacheKey = createCacheKey('test-centers-list', 'all');
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    // For now, use mock data since test_centers table doesn't exist yet
    // TODO: Replace with real Supabase query when test_centers table is created
    const mockTestCenters = [
      { id: 'lab1', name: 'City Lab Center', address: '123 Main St' },
      { id: 'lab2', name: 'Medical Imaging Center', address: '456 Oak Ave' },
      { id: 'lab3', name: 'Diagnostic Center', address: '789 Pine St' }
    ];
    
    cacheService.set(cacheKey, mockTestCenters, CACHE_TTL.LONG);
    return mockTestCenters;
  };

  const quickStats = [
    { label: 'Health Records', value: healthRecords.totalRecords.toString(), icon: FileText, href: '/records' },
    { label: 'Active Consents', value: activeConsents.toString(), icon: Shield, href: '/consents' },
  ];

  // Calendar event handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsSchedulingModalOpen(true);
  };

  const handleAppointmentClick = (appointment: PatientAppointment) => {
    setEditingAppointment(appointment);
    setIsSchedulingModalOpen(true);
  };

  const handleAddAppointment = (date: Date) => {
    setSelectedDate(date);
    setEditingAppointment(null);
    setIsSchedulingModalOpen(true);
  };

  const handleDayViewClick = (date: Date) => {
    setDayViewDate(date);
    setIsDayViewOpen(true);
  };

  // Convert PatientAppointment to DayViewEvent format
  const convertToDayViewEvents = (appointments: PatientAppointment[]): DayViewEvent[] => {
    const convertedEvents = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      start: appointment.start,
      end: appointment.end,
      event_type: appointment.appointment_type === 'consultation' ? 'consultation' as const : 'meeting' as const,
      status: appointment.status === 'completed' ? 'confirmed' : appointment.status as 'pending' | 'confirmed' | 'cancelled' | 'rejected',
      patient_name: user?.name || 'Patient',
      notes: appointment.notes,
      doctor_id: appointment.doctor_id || '',
      patient_id: appointment.patient_id,
      is_available: true
    }));
    
    console.log('🔍 Converting appointments to DayViewEvents:', {
      originalAppointments: appointments,
      convertedEvents: convertedEvents
    });
    
    return convertedEvents;
  };

  const handleScheduleAppointment = async (data: PatientScheduleData) => {
    try {
      console.log('📅 Scheduling appointment:', data);
      
      // Only save consultations to Supabase, other appointment types can be local
      if (data.appointment_type === 'consultation' && data.doctor_id) {
        console.log('Creating consultation in Supabase...');
        
        // Get patient profile ID
        const { data: patientProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (profileError || !patientProfile) {
          console.error('❌ Patient profile not found:', profileError);
          alert(`Patient profile not found: ${profileError.message}`);
          throw new Error('Patient profile not found');
        }

        console.log('Patient profile ID:', patientProfile.id);

        // Calculate end time
        const [hours, minutes] = data.time.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, data.duration);
        const endTime = format(endDate, 'HH:mm');

        // Save consultation to Supabase
        const consultationData = {
          patient_id: patientProfile.id,
          doctor_id: data.doctor_id,
          consultation_date: data.date,
          consultation_time: data.time,
          end_time: endTime,
          duration_minutes: data.duration,
          reason: data.title,
          notes: data.notes,
          status: 'scheduled' as const
        };
        
        console.log('Consultation data:', consultationData);
        
        const { data: consultation, error: consultationError } = await supabase
          .from('consultations')
          .insert(consultationData)
          .select(`
            id,
            patient_id,
            doctor_id,
            consultation_date,
            consultation_time,
            end_time,
            duration_minutes,
            reason,
            notes,
            status,
            profiles!consultations_patient_id_fkey(full_name)
          `)
          .single();

        if (consultationError) {
          console.error('❌ Error creating consultation:', consultationError);
          alert(`Failed to create consultation: ${consultationError.message}`);
          throw consultationError;
        }

        console.log('✅ Consultation created in Supabase:', consultation);

        // Convert to calendar event format
        const startTime = new Date(`${data.date}T${data.time}`);
        const newAppointment: PatientAppointment = {
          id: (consultation as any).id,
          title: data.title,
          start: startTime,
          end: new Date(startTime.getTime() + (data.duration * 60000)),
          appointment_type: data.appointment_type,
          status: 'scheduled',
          doctor_name: doctors.find(d => d.id === data.doctor_id)?.name,
          notes: data.notes,
          patient_id: user?.id || '',
          doctor_id: data.doctor_id
        };

        setAppointments(prev => [...prev, newAppointment]);
        console.log('✅ Consultation added to local state');
        
      } else {
        console.log('Creating local appointment...');
        // For non-consultation appointments, add to local state only
    const startTime = new Date(`${data.date}T${data.time}`);
    const newAppointment: PatientAppointment = {
      id: `appt-${Date.now()}`,
      title: data.title,
      start: startTime,
      end: new Date(startTime.getTime() + (data.duration * 60000)),
      appointment_type: data.appointment_type,
      status: data.status,
      doctor_name: data.doctor_id ? doctors.find(d => d.id === data.doctor_id)?.name : undefined,
      test_center: data.test_center_id ? testCenters.find(tc => tc.id === data.test_center_id)?.name : undefined,
      notes: data.notes,
      patient_id: user?.id || '',
      doctor_id: data.doctor_id,
      test_center_id: data.test_center_id
    };
    setAppointments(prev => [...prev, newAppointment]);
        console.log('✅ Local appointment created');
      }
    } catch (error) {
      console.error('❌ Error scheduling appointment:', error);
      alert(`Failed to schedule appointment: ${error.message}`);
    } finally {
    setIsSchedulingModalOpen(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, data: PatientScheduleData) => {
    try {
      console.log('📝 Updating appointment:', appointmentId, data);
      
      // Check if it's a consultation (has UUID format)
      const isConsultation = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
      
      if (isConsultation && data.appointment_type === 'consultation') {
        // Calculate end time
        const [hours, minutes] = data.time.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, data.duration);
        const endTime = format(endDate, 'HH:mm');
        
        // Update in Supabase
        const updateData = {
          consultation_date: data.date,
          consultation_time: data.time,
          end_time: endTime,
          duration_minutes: data.duration,
          reason: data.title,
          notes: data.notes,
          status: (data.status === 'pending' ? 'scheduled' : data.status) as 'confirmed' | 'cancelled' | 'scheduled' | 'scheduled_no_consent' | 'completed'
        };
        
        console.log('Updating consultation with data:', updateData);
        
        const { data: updatedConsultation, error } = await supabase
          .from('consultations')
          .update(updateData)
          .eq('id', appointmentId)
          .select();
        
        if (error) {
          console.error('❌ Error updating consultation:', error);
          alert(`Failed to update consultation: ${error.message}`);
          return;
        }
        
        console.log('✅ Consultation updated in Supabase:', updatedConsultation);
        alert('Consultation updated successfully!');
      }
      
      // Update local state
    const startTime = new Date(`${data.date}T${data.time}`);
    setAppointments(prev => prev.map(appointment => 
      appointment.id === appointmentId 
        ? {
            ...appointment,
            title: data.title,
            start: startTime,
            end: new Date(startTime.getTime() + (data.duration * 60000)),
            appointment_type: data.appointment_type,
            status: data.status,
            doctor_name: data.doctor_id ? doctors.find(d => d.id === data.doctor_id)?.name : appointment.doctor_name,
            test_center: data.test_center_id ? testCenters.find(tc => tc.id === data.test_center_id)?.name : appointment.test_center,
            notes: data.notes,
            doctor_id: data.doctor_id,
            test_center_id: data.test_center_id
          }
        : appointment
    ));
      
      console.log('✅ Appointment updated successfully');
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      alert(`Failed to update appointment: ${error.message}`);
    } finally {
    setIsSchedulingModalOpen(false);
    setEditingAppointment(null);
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.map(appointment => 
      appointment.id === appointmentId 
        ? { ...appointment, status: 'cancelled' as const }
        : appointment
    ));
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions />
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's your health overview</p>
      </div>

      {/* Top Row: Health Records + Active Consents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label} 
              className="hover:shadow-medium transition-all cursor-pointer"
              onClick={() => navigate(stat.href)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    {loading ? (
                      <InlineLoadingSpinner text="Loading..." className="text-sm" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Health Alerts - full width */}
      {!loading && healthAlerts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthAlerts.map((alert, index) => (
              <div
                key={alert.id || index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'warning'
                    ? 'bg-warning-light'
                    : alert.type === 'error'
                    ? 'bg-red-50'
                    : alert.type === 'success'
                    ? 'bg-green-50'
                    : 'bg-blue-50'
                }`}
              >
                <AlertCircle
                  className={`h-4 w-4 mt-0.5 ${
                    alert.type === 'warning'
                      ? 'text-warning'
                      : alert.type === 'error'
                      ? 'text-red-500'
                      : alert.type === 'success'
                      ? 'text-green-500'
                      : 'text-blue-500'
                  }`}
                />
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest health management activities</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CardLoadingSpinner text="Loading activity..." />
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-center gap-3 pb-3 border-b border-border last:border-0"
                >
                  <div className="p-2 bg-accent-light rounded-lg">
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Section */}
      <PatientCalendarComponent
        appointments={appointments}
        onDateClick={handleDateClick}
        onAppointmentClick={handleAppointmentClick}
        onAddAppointment={handleAddAppointment}
        onEditAppointment={handleAppointmentClick}
        onCancelAppointment={handleCancelAppointment}
        onRescheduleAppointment={(appointmentId: string) => {
          const appointment = appointments.find(apt => apt.id === appointmentId);
          if (appointment) {
            handleAppointmentClick(appointment);
          }
        }}
        onDayViewClick={handleDayViewClick}
        showNavigation={true}
        showAddButton={true}
      />

      {/* Scheduling Modal */}
      <PatientSchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => {
          setIsSchedulingModalOpen(false);
          setEditingAppointment(null);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
        onSchedule={handleScheduleAppointment}
        onUpdate={handleUpdateAppointment}
        editingAppointment={editingAppointment}
        doctors={doctors}
        testCenters={testCenters}
        existingAppointments={appointments}
      />

      {/* Day View Modal */}
      {dayViewDate && (
        <DayViewModal
          isOpen={isDayViewOpen}
          onClose={() => {
            setIsDayViewOpen(false);
            setDayViewDate(null);
          }}
          selectedDate={dayViewDate}
          events={convertToDayViewEvents(appointments)}
          existingAppointments={appointments}
          onScheduleEvent={(timeSlot, duration, eventData) => {
            // Handle scheduling new events from day view - use the same logic as handleScheduleAppointment
            const scheduleData: PatientScheduleData = {
              title: eventData?.title || 'New Appointment',
              appointment_type: eventData?.type === 'consultation' ? 'consultation' : 'other',
              date: format(timeSlot, 'yyyy-MM-dd'),
              time: format(timeSlot, 'HH:mm'),
              duration: duration,
              doctor_id: '', // Will be set when user selects a doctor in the modal
              notes: eventData?.notes || '',
              status: 'pending'
            };
            handleScheduleAppointment(scheduleData);
          }}
          onEditEvent={(event) => {
            // Find and edit the appointment
            const appointment = appointments.find(apt => apt.id === event.id);
            if (appointment) {
              handleAppointmentClick(appointment);
            }
          }}
          onDeleteEvent={async (eventId) => {
            try {
              console.log('🗑️ Deleting appointment:', eventId);
              setIsDeleting(true);
              
              // Check if it's a consultation (has UUID format)
              const isConsultation = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
              console.log('Is consultation:', isConsultation, 'EventId:', eventId, 'EventId type:', typeof eventId);
              
              // Try to delete from Supabase regardless of ID format
              console.log('🔍 Attempting to delete from Supabase...');
              
              // First, check if the consultation exists
              console.log('🔍 Checking if consultation exists...');
              const { data: existingConsultation, error: fetchError } = await supabase
                .from('consultations')
                .select('id, patient_id, doctor_id, reason, consent_id')
                .eq('id', eventId)
                .single();
              
              if (fetchError) {
                console.error('❌ Error fetching consultation:', fetchError);
                // If it's a "not found" error, it might not be a consultation
                if (fetchError.code === 'PGRST116') {
                  console.log('ℹ️ Not a consultation or already deleted, removing from local state only');
                } else {
                  alert(`Failed to fetch consultation: ${fetchError.message}`);
                  setIsDeleting(false);
                  return;
                }
              } else if (existingConsultation) {
                console.log('✅ Consultation found:', existingConsultation);
                
                // Delete from Supabase
                console.log('🗑️ Deleting from Supabase...');
                
                // First, try to set consent_id to NULL to avoid constraint issues
                if (existingConsultation.consent_id) {
                  console.log('🔧 Setting consent_id to NULL before deletion...');
                  const { error: updateError } = await supabase
                    .from('consultations')
                    .update({ consent_id: null })
                    .eq('id', eventId);
                  
                  if (updateError) {
                    console.warn('⚠️ Warning: Could not set consent_id to NULL:', updateError);
                  } else {
                    console.log('✅ consent_id set to NULL');
                  }
                }
                
                const { data, error } = await supabase
                  .from('consultations')
                  .delete()
                  .eq('id', eventId)
                  .select();
                
                if (error) {
                  console.error('❌ Error deleting consultation:', error);
                  alert(`Failed to delete consultation: ${error.message}`);
                  setIsDeleting(false);
                  return;
                }
                
                console.log('✅ Consultation deleted from Supabase:', data);
                
                // Verify deletion
                const { data: verifyData, error: verifyError } = await supabase
                  .from('consultations')
                  .select('id')
                  .eq('id', eventId);
                
                if (verifyError) {
                  console.error('❌ Error verifying deletion:', verifyError);
                } else {
                  console.log('🔍 Verification after deletion:', verifyData);
                  if (verifyData && verifyData.length === 0) {
                    console.log('✅ Deletion verified - consultation no longer exists');
                  } else {
                    console.log('⚠️ Deletion verification failed - consultation still exists');
                  }
                }
                
                // Clear cache to ensure fresh data on next load
                const cacheKey = createCacheKey('patient-appointments', user?.id || '');
                cacheService.delete(cacheKey);
                console.log('🗑️ Cleared appointment cache');
                
                // Show success message
                alert('Consultation deleted successfully!');
              } else {
                console.log('ℹ️ No consultation found with this ID, removing from local state only');
              }
              
              // Remove from local state
            setAppointments(prev => prev.filter(apt => apt.id !== eventId));
              console.log('✅ Appointment deleted successfully from local state');
            } catch (error) {
              console.error('❌ Error deleting appointment:', error);
              alert(`Failed to delete appointment: ${error.message}`);
            } finally {
              setIsDeleting(false);
            }
          }}
          onMoveEvent={async (eventId, newStart, newEnd) => {
            try {
              console.log('🔄 Moving appointment:', eventId, newStart, newEnd);
              
              // Check if it's a consultation (has UUID format)
              const isConsultation = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
              
              if (isConsultation) {
                // Calculate new end time based on duration
                const duration = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60));
                const newEndTime = format(newEnd, 'HH:mm');
                
                // Update in Supabase
                const { data, error } = await supabase
                  .from('consultations')
                  .update({
                    consultation_date: format(newStart, 'yyyy-MM-dd'),
                    consultation_time: format(newStart, 'HH:mm'),
                    end_time: newEndTime,
                    duration_minutes: duration
                  })
                  .eq('id', eventId)
                  .select();
                
                if (error) {
                  console.error('❌ Error moving consultation:', error);
                  alert(`Failed to move consultation: ${error.message}`);
                  return;
                }
                
                console.log('✅ Consultation moved in Supabase:', data);
              }
              
              // Update local state
            setAppointments(prev => prev.map(apt => 
              apt.id === eventId 
                ? { ...apt, start: newStart, end: newEnd }
                : apt
            ));
              
              console.log('✅ Appointment moved successfully');
            } catch (error) {
              console.error('❌ Error moving appointment:', error);
              alert(`Failed to move appointment: ${error.message}`);
            }
          }}
          onResizeEvent={async (eventId, newEnd) => {
            try {
              // Check if it's a consultation (has UUID format)
              const isConsultation = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
              
              if (isConsultation) {
                // For consultations, we can't really resize the duration in Supabase
                // as it's fixed at 30 minutes, but we can update the local state
                console.log('Note: Consultation duration is fixed at 30 minutes');
              }
              
              // Update local state
            setAppointments(prev => prev.map(apt => 
              apt.id === eventId 
                ? { ...apt, end: newEnd }
                : apt
            ));
              
              console.log('✅ Appointment resized successfully');
            } catch (error) {
              console.error('Error resizing appointment:', error);
            }
          }}
          onSchedule={handleScheduleAppointment}
          onUpdate={handleUpdateAppointment}
          isPatientView={true}
          doctors={doctors}
          testCenters={testCenters}
          onSlotClick={(slotTime) => {
            // Open the standalone PatientSchedulingModal with pre-filled time
            setSelectedDate(slotTime);
            setEditingAppointment({
              id: 'temp-slot',
              title: '',
              start: slotTime,
              end: new Date(slotTime.getTime() + 30 * 60000),
              appointment_type: 'consultation',
              status: 'pending',
              doctor_name: '',
              notes: '',
              doctor_id: '',
              patient_id: user?.id || '',
              test_center_id: ''
            });
            setIsSchedulingModalOpen(true);
          }}
        />
      )}

    </div>
  );
};

export default PatientDashboard;
