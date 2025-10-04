import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const [testCenters, setTestCenters] = useState<Array<{ id: string; name: string; address?: string }>>([]);

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

  const getCachedAppointments = async (userId: string) => {
    const cacheKey = createCacheKey('patient-appointments', userId);
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    try {
      // Fetch real consultations from Supabase using direct fetch
      const response = await fetch(`https://wgcmusjsuziqjkzuaqkd.supabase.co/rest/v1/consultations?patient_id=eq.${userId}&select=id,consultation_date,consultation_time,reason,notes,status,doctor_id&order=consultation_date`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Consultations API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const consultations = await response.json();
      
      const formattedAppointments: PatientAppointment[] = consultations?.map(consultation => {
        // Combine date and time to create start time
        const consultationDate = new Date(consultation.consultation_date);
        const [hours, minutes] = consultation.consultation_time.split(':').map(Number);
        const startTime = new Date(consultationDate);
        startTime.setHours(hours, minutes, 0, 0);
        
        // Add 30 minutes for end time (default consultation duration)
        const endTime = new Date(startTime.getTime() + 30 * 60000);
        
        return {
          id: consultation.id,
          title: consultation.reason || 'Consultation',
          start: startTime,
          end: endTime,
          appointment_type: 'consultation' as const,
          status: consultation.status as 'pending' | 'confirmed' | 'cancelled',
          doctor_name: 'Dr. Unknown', // Will be populated separately
          notes: consultation.notes || '',
          patient_id: userId,
          doctor_id: consultation.doctor_id
        };
      }) || [];
      
      cacheService.set(cacheKey, formattedAppointments, CACHE_TTL.MEDIUM);
      return formattedAppointments;
    } catch (error) {
      console.error('Error fetching consultations:', error);
      // Fallback to mock data
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
    return appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      start: appointment.start,
      end: appointment.end,
      event_type: appointment.appointment_type === 'consultation' ? 'consultation' : 'meeting',
      status: appointment.status === 'completed' ? 'confirmed' : appointment.status as 'pending' | 'confirmed' | 'cancelled' | 'rejected',
      patient_name: user?.name || 'Patient',
      notes: appointment.notes,
      doctor_id: appointment.doctor_id || '',
      patient_id: appointment.patient_id,
      is_available: true
    }));
  };

  const handleScheduleAppointment = (data: PatientScheduleData) => {
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
    setIsSchedulingModalOpen(false);
  };

  const handleUpdateAppointment = (appointmentId: string, data: PatientScheduleData) => {
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
    setIsSchedulingModalOpen(false);
    setEditingAppointment(null);
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
          onScheduleEvent={(timeSlot, duration, eventData) => {
            // Handle scheduling new events from day view
            const startTime = timeSlot;
            const newAppointment: PatientAppointment = {
              id: `appt-${Date.now()}`,
              title: eventData?.title || 'New Appointment',
              start: startTime,
              end: new Date(startTime.getTime() + (duration * 60000)),
              appointment_type: eventData?.type === 'consultation' ? 'consultation' : 'other',
              status: 'pending',
              notes: eventData?.notes || '',
              patient_id: user?.id || '',
              doctor_id: undefined
            };
            setAppointments(prev => [...prev, newAppointment]);
          }}
          onEditEvent={(event) => {
            // Find and edit the appointment
            const appointment = appointments.find(apt => apt.id === event.id);
            if (appointment) {
              handleAppointmentClick(appointment);
            }
          }}
          onDeleteEvent={(eventId) => {
            setAppointments(prev => prev.filter(apt => apt.id !== eventId));
          }}
          onMoveEvent={(eventId, newStart, newEnd) => {
            setAppointments(prev => prev.map(apt => 
              apt.id === eventId 
                ? { ...apt, start: newStart, end: newEnd }
                : apt
            ));
          }}
          onResizeEvent={(eventId, newEnd) => {
            setAppointments(prev => prev.map(apt => 
              apt.id === eventId 
                ? { ...apt, end: newEnd }
                : apt
            ));
          }}
          onSchedule={handleScheduleAppointment}
          onUpdate={handleUpdateAppointment}
          isPatientView={true}
          doctors={doctors}
          testCenters={testCenters}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
