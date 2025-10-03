import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, Calendar, Plus, Activity, Stethoscope, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getUltraOptimizedDashboardStats, getUltraOptimizedRecentActivity, getUltraOptimizedUpcomingTasks, clearUltraOptimizedCache } from '@/services/ultraOptimizedDashboardService';
import { type DashboardStats, type RecentActivity, type UpcomingTask } from '@/services/dashboardService';
import { dataPrefetchService } from '@/services/dataPrefetchService';
import { ScheduleService, type CalendarEvent } from '@/services/scheduleService';
import { EventService, Event, CreateEventData } from '@/services/eventService';
import { PageSkeleton } from '@/components/ui/skeleton-loading';
import { ProgressiveStats, ProgressiveList } from '@/components/ui/progressive-loading';
import QuickActions from '@/components/layout/QuickActions';
import { lazy, Suspense } from 'react';
import EnhancedCalendarComponent from '@/components/calendar/EnhancedCalendarComponent';
import EnhancedSchedulingModal from '@/components/calendar/EnhancedSchedulingModal';
import DayViewModal from '@/components/calendar/DayViewModal';

const CalendarComponent = lazy(() => import('@/components/calendar/CalendarComponent'));
const CalendarSkeleton = lazy(() => import('@/components/calendar/CalendarSkeleton'));
import SchedulingModal, { ScheduleData } from '@/components/calendar/SchedulingModal';
import MeetingDetailsModal from '@/components/calendar/MeetingDetailsModal';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    pendingConsents: 0,
    activeConsents: 0,
    totalRecords: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  
  // Calendar and Schedule states
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMeetingDetailsOpen, setIsMeetingDetailsOpen] = useState(false);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarKey, setCalendarKey] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(false); // For preventing shaking during data load

  // Get doctor profile ID once
  useEffect(() => {
    const getDoctorProfileId = async () => {
      if (!user) return;
      
      try {
        const { data: doctorProfile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error || !doctorProfile) {
          console.error('Error finding doctor profile:', error);
          setLoading(false);
          return;
        }

        setDoctorProfileId(doctorProfile.id);
      } catch (error) {
        console.error('Error getting doctor profile:', error);
        setLoading(false);
      }
    };

    getDoctorProfileId();
  }, [user]);

  // Load events for calendar with memoization
  const loadEvents = useCallback(async () => {
    if (!doctorProfileId) return;
    
    setIsDataLoading(true);
    try {
      console.log('Loading events for doctor:', doctorProfileId);
      
      // Always try consultations table first (since it exists)
      const consultationEvents = await ScheduleService.getDoctorEvents(doctorProfileId);
      console.log('Loaded consultations:', consultationEvents);
      
      // Try to load from events table as well
      let additionalEvents: any[] = [];
      try {
        const eventsData = await EventService.getDoctorEvents(doctorProfileId);
        if (eventsData && eventsData.length > 0) {
          console.log('Loaded additional events from events table:', eventsData);
          // Convert to CalendarEvent format
          additionalEvents = eventsData.map(event => ({
            id: event.id,
            title: event.title,
            start: new Date(event.start_time),
            end: new Date(event.end_time),
            type: event.event_type as any,
            patientName: event.patient_name || '',
            notes: event.notes,
            status: event.status as any,
            doctorId: event.doctor_id,
            patientId: event.patient_id
          }));
        }
      } catch (error) {
        console.log('Events table not available, using only consultations');
      }
      
      // Combine both sources
      const allEvents = [...consultationEvents, ...additionalEvents];
      console.log('Combined events:', allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, [doctorProfileId]);


  // Load patients for dropdown with memoization
  const loadPatients = useCallback(async () => {
    if (!doctorProfileId) return;
    
    try {
      // Fetch real patients from database
      const { data: patientsData, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, phone')
        .eq('role', 'patient')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }

      // Transform the data to match the expected format
      const realPatients = patientsData?.map(patient => ({
        id: patient.id, // Use profile id as the ID for consultations table
        name: patient.full_name,
        email: patient.email,
        phone: patient.phone
      })) || [];

      console.log('Loaded patients:', realPatients);
      console.log('Number of patients found:', realPatients.length);
      setPatients(realPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      // Fallback to empty array if there's an error
      setPatients([]);
    }
  }, [doctorProfileId]);

  // Calendar event handlers
  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    setSelectedDate(date);
    setIsScheduleModalOpen(true);
  };

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
    // Convert to the expected format
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      type: event.event_type as any,
      patientName: event.patient_name,
      notes: event.notes,
      status: event.status as any,
      doctorId: event.doctor_id,
      patientId: event.patient_id
    };
    setSelectedEvent(calendarEvent);
    setIsMeetingDetailsOpen(true);
  };

  const handleAddEvent = (date: Date) => {
    console.log('Add event clicked for date:', date);
    setSelectedDate(date);
    setIsScheduleModalOpen(true);
  };

  const handleEditEvent = (calendarEvent: any) => {
    console.log('Edit event:', calendarEvent);
    console.log('Available patients:', patients);
    console.log('Event patient ID:', calendarEvent.patient_id);
    
    // Convert EnhancedCalendarComponent.CalendarEvent to scheduleService.CalendarEvent
    const event: CalendarEvent = {
      id: calendarEvent.id,
      title: calendarEvent.title,
      start: calendarEvent.start,
      end: calendarEvent.end,
      type: calendarEvent.event_type as 'consultation' | 'operation' | 'meeting' | 'available',
      patientName: calendarEvent.patient_name,
      notes: calendarEvent.notes,
      status: calendarEvent.status as 'pending' | 'confirmed' | 'cancelled',
      doctorId: calendarEvent.doctor_id,
      patientId: calendarEvent.patient_id
    };
    
    // Close the details modal and open the schedule modal for editing
    setIsMeetingDetailsOpen(false);
    setSelectedEvent(null);
    setEditingEvent(event);
    setIsScheduleModalOpen(true);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      if (event.type === 'consultation' && event.doctorId) {
        // Delete from database
        const success = await ScheduleService.deleteConsultation(event.id);
        
        if (success) {
          // Remove from local state
          setEvents(prev => prev.filter(e => e.id !== event.id));
          setCalendarKey(prev => prev + 1); // Force calendar re-render
        }
      } else {
        // Remove from local state for non-consultation events
        setEvents(prev => prev.filter(e => e.id !== event.id));
        setCalendarKey(prev => prev + 1); // Force calendar re-render
      }
      setIsMeetingDetailsOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Day view handlers
  const handleDayViewClick = (date: Date) => {
    // Ensure we're working with the correct date
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    setDayViewDate(normalizedDate);
    setIsDayViewOpen(true);
  };

  const handleScheduleEvent = (timeSlot: Date, duration: number, eventData?: {
    title: string;
    type: 'consultation' | 'meeting';
    notes?: string;
  }) => {
    if (eventData) {
      // Create event directly from the day view form
      const newEvent: CalendarEvent = {
        id: `temp-${Date.now()}`,
        title: eventData.title,
        start: timeSlot,
        end: addMinutes(timeSlot, duration),
        type: eventData.type === 'consultation' ? 'consultation' : 'meeting',
        patientName: eventData.type === 'consultation' ? 'New Patient' : undefined,
        notes: eventData.notes || '',
        status: 'confirmed',
        doctorId: user?.id || '',
        patientId: eventData.type === 'consultation' ? undefined : undefined
      };
      
      // Add to local state immediately
      setEvents(prev => [...prev, newEvent]);
      setCalendarKey(prev => prev + 1);
    } else {
      // Fallback to opening the full scheduling modal
      setSelectedDate(timeSlot);
      setIsDayViewOpen(false);
      setIsScheduleModalOpen(true);
    }
  };

  const handleMoveEvent = async (eventId: string, newStart: Date, newEnd: Date) => {
    console.log('Move event:', eventId, 'to:', newStart, '-', newEnd);
    try {
      // Update in database
      if (events.find(e => e.id === eventId)?.type === 'consultation') {
        const { error } = await supabase
          .from('consultations')
          .update({
            consultation_date: newStart.toISOString().split('T')[0],
            consultation_time: newStart.toTimeString().split(' ')[0]
          })
          .eq('id', eventId);
        
        if (error) throw error;
      }
      
      // Update local state
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, start: newStart, end: newEnd }
          : e
      ));
      setCalendarKey(prev => prev + 1);
    } catch (error) {
      console.error('Error moving event:', error);
      alert('Error moving event. Please try again.');
    }
  };

  const handleResizeEvent = async (eventId: string, newEnd: Date) => {
    console.log('Resize event:', eventId, 'to end:', newEnd);
    try {
      // Update local state
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, end: newEnd }
          : e
      ));
      setCalendarKey(prev => prev + 1);
    } catch (error) {
      console.error('Error resizing event:', error);
      alert('Error resizing event. Please try again.');
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      // Find the event to check if it's a consultation
      const event = events.find(e => e.id === eventId);
      
      if (event?.type === 'consultation') {
        // For consultations, update status to 'confirmed' in the database
        const updatedEvent = await ScheduleService.updateConsultation(eventId, {
          status: 'confirmed'
        });
        
        if (updatedEvent) {
          // Update local state
          setEvents(prev => prev.map(e => 
            e.id === eventId 
              ? { ...e, status: 'confirmed' as any }
              : e
          ));
          setCalendarKey(prev => prev + 1);
          alert('Consultation approved successfully!');
        }
      } else {
        // For non-consultation events, try to update in events table
        try {
          const updatedEvent = await EventService.approveConsultation(eventId);
          if (updatedEvent) {
            // Update local state
            setEvents(prev => prev.map(e => 
              e.id === eventId 
                ? { ...e, status: 'confirmed' as any }
                : e
            ));
            setCalendarKey(prev => prev + 1);
            alert('Event approved successfully!');
          }
        } catch (error) {
          // If events table doesn't exist, just update local state
          setEvents(prev => prev.map(e => 
            e.id === eventId 
              ? { ...e, status: 'confirmed' as any }
              : e
          ));
          setCalendarKey(prev => prev + 1);
          alert('Event approved successfully!');
        }
      }
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Error approving event. Please try again.');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      // Find the event to check if it's a consultation
      const event = events.find(e => e.id === eventId);
      
      if (event?.type === 'consultation') {
        // For consultations, update status to 'rejected' in the database
        const updatedEvent = await ScheduleService.updateConsultation(eventId, {
          status: 'cancelled' // Use 'cancelled' instead of 'rejected' for consultations
        });
        
        if (updatedEvent) {
          // Update local state
          setEvents(prev => prev.map(e => 
            e.id === eventId 
              ? { ...e, status: 'cancelled' as any }
              : e
          ));
          setCalendarKey(prev => prev + 1);
          alert('Consultation rejected successfully!');
        }
      } else {
        // For non-consultation events, try to update in events table
        try {
          const updatedEvent = await EventService.rejectConsultation(eventId);
          if (updatedEvent) {
            // Remove from local state
            setEvents(prev => prev.filter(e => e.id !== eventId));
            setCalendarKey(prev => prev + 1);
            alert('Event rejected successfully!');
          }
        } catch (error) {
          // If events table doesn't exist, just remove from local state
          setEvents(prev => prev.filter(e => e.id !== eventId));
          setCalendarKey(prev => prev + 1);
          alert('Event rejected successfully!');
        }
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      alert('Error rejecting event. Please try again.');
    }
  };

  const handleUpdateEvent = async (eventId: string, scheduleData: any) => {
    console.log('=== UPDATE FUNCTION CALLED ===');
    console.log('Event ID:', eventId);
    console.log('Schedule Data:', scheduleData);
    console.log('Editing Event:', editingEvent);
    console.log('Doctor Profile ID:', doctorProfileId);
    console.log('Current events count:', events.length);
    console.log('Event exists in array:', events.find(e => e.id === eventId));
    
    if (!doctorProfileId) {
      console.error('No doctor profile ID available');
      return;
    }
    
    try {
      if (editingEvent?.type === 'consultation') {
        console.log('Updating consultation in database...');
        console.log('Update parameters:', {
          eventId,
          consultationDate: scheduleData.date,
          consultationTime: scheduleData.time,
          reason: scheduleData.title,
          notes: scheduleData.notes,
          status: scheduleData.status === 'confirmed' ? 'confirmed' : 'scheduled'
        });
        
        try {
          // Update consultation in database
          const updatedEvent = await ScheduleService.updateConsultation(eventId, {
            consultationDate: scheduleData.date,
            consultationTime: scheduleData.time,
            reason: scheduleData.title,
            notes: scheduleData.notes,
            status: scheduleData.status === 'confirmed' ? 'confirmed' : 'scheduled'
          });
          
          console.log('Database update result:', updatedEvent);
          
          if (updatedEvent) {
            console.log('Updating local state with:', updatedEvent);
            // Update local state
            setEvents(prev => {
              const newEvents = prev.map(e => e.id === eventId ? updatedEvent : e);
              console.log('New events array:', newEvents);
              return newEvents;
            });
            setCalendarKey(prev => prev + 1); // Force calendar re-render
            console.log('Event updated successfully in database and local state');
          } else {
            console.error('Failed to update event in database - no result returned');
          }
        } catch (error) {
          console.error('Failed to update consultation in database, updating local state:', error);
          
          // Update local state as fallback
          const startDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`);
          const endDateTime = new Date(startDateTime.getTime() + scheduleData.duration * 60 * 1000);
          
          const selectedPatient = patients.find(p => p.id === scheduleData.patientId);
          
          const updatedEvent: CalendarEvent = {
            id: eventId,
            title: scheduleData.title,
            start: startDateTime,
            end: endDateTime,
            type: scheduleData.event_type as 'consultation' | 'operation' | 'meeting' | 'available',
            patientName: selectedPatient?.name || editingEvent?.patientName || '',
            notes: scheduleData.notes,
            status: scheduleData.status as 'pending' | 'confirmed' | 'cancelled',
            doctorId: editingEvent?.doctorId,
            patientId: scheduleData.patientId
          };
          
          setEvents(prev => {
            const newEvents = prev.map(e => e.id === eventId ? updatedEvent : e);
            console.log('Updated events array (local fallback):', newEvents);
            return newEvents;
          });
          setCalendarKey(prev => prev + 1); // Force calendar re-render
          console.log('Event updated in local state (fallback)');
        }
      } else {
        console.log('Updating non-consultation event in local state...');
        // Update local state for non-consultation events
        const startDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`);
        const endDateTime = new Date(startDateTime.getTime() + scheduleData.duration * 60 * 1000);
        
        const selectedPatient = patients.find(p => p.id === scheduleData.patientId);
        
        const updatedEvent: CalendarEvent = {
          id: eventId,
          title: scheduleData.title,
          start: startDateTime,
          end: endDateTime,
          type: scheduleData.event_type as 'consultation' | 'operation' | 'meeting' | 'available',
          patientName: selectedPatient?.name || editingEvent?.patientName || '',
          notes: scheduleData.notes,
          status: scheduleData.status as 'pending' | 'confirmed' | 'cancelled',
          doctorId: editingEvent?.doctorId,
          patientId: scheduleData.patientId
        };
        
        console.log('Updated event for local state:', updatedEvent);
        
        setEvents(prev => {
          const newEvents = prev.map(e => e.id === eventId ? updatedEvent : e);
          console.log('Updated events array:', newEvents);
          return newEvents;
        });
        setCalendarKey(prev => prev + 1); // Force calendar re-render
        console.log('Event updated in local state');
      }
      
      setEditingEvent(null);
      setIsScheduleModalOpen(false);
      
      console.log('Update completed successfully');
      
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // Create new schedule
  const handleCreateSchedule = async (scheduleData: any) => {
    if (!doctorProfileId) {
      alert('No doctor profile ID available!');
      return;
    }
    
    try {
      const startDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + scheduleData.duration * 60 * 1000);
      const selectedPatient = patients.find(p => p.id === scheduleData.patientId);
      
      // Try to create in events table first
      if (scheduleData.event_type === 'consultation' && scheduleData.patientId) {
        try {
          const eventData: CreateEventData = {
            title: scheduleData.title,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            event_type: 'consultation',
            status: scheduleData.status || 'confirmed',
            doctor_id: doctorProfileId,
            patient_id: scheduleData.patientId,
            notes: scheduleData.notes,
            is_available: false
          };

          const newEvent = await EventService.createEvent(eventData);
          
          if (newEvent) {
            // Convert to CalendarEvent format
            const calendarEvent: CalendarEvent = {
              id: newEvent.id,
              title: newEvent.title,
              start: new Date(newEvent.start_time),
              end: new Date(newEvent.end_time),
              type: newEvent.event_type as any,
              patientName: newEvent.patient_name || '',
              notes: newEvent.notes,
              status: newEvent.status as any,
              doctorId: newEvent.doctor_id,
              patientId: newEvent.patient_id
            };
            
            // Add to events array
            setEvents(prev => [...prev, calendarEvent]);
            setCalendarKey(prev => prev + 1);
            
            // Close modal
            setIsScheduleModalOpen(false);
            
            alert(`Event "${newEvent.title}" created successfully!`);
            return;
          }
        } catch (error) {
          console.log('Events table not available, using consultations table');
        }
        
        // Fallback to consultations table
        const consultationData = {
          patientId: scheduleData.patientId,
          doctorId: doctorProfileId,
          consultationDate: scheduleData.date,
          consultationTime: scheduleData.time,
          reason: scheduleData.title,
          notes: scheduleData.notes,
        };
        
        const newEvent = await ScheduleService.createConsultation(consultationData);
        if (newEvent) {
          setEvents(prev => [...prev, newEvent]);
          setCalendarKey(prev => prev + 1);
          setIsScheduleModalOpen(false);
          alert(`Consultation "${newEvent.title}" created successfully!`);
          return;
        }
      }
      
      // For non-consultation events or if all else fails, create local event
      console.log('Creating local event as fallback');
      const localEvent: CalendarEvent = {
        id: `local-${Date.now()}`,
        title: scheduleData.title,
        start: startDateTime,
        end: endDateTime,
        type: scheduleData.event_type as any,
        patientName: selectedPatient?.name || '',
        notes: scheduleData.notes,
        status: scheduleData.status as any,
        doctorId: doctorProfileId,
        patientId: scheduleData.patientId
      };
      
      // Add to events array
      setEvents(prev => [...prev, localEvent]);
      setCalendarKey(prev => prev + 1);
      
      // Close modal
      setIsScheduleModalOpen(false);
      
      alert(`Event "${scheduleData.title}" created successfully!`);
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Error creating event. Please try again.');
    }
  };

  // Load all dashboard data when profile ID is available
  useEffect(() => {
    let isMounted = true;
    
    const loadAllData = async () => {
      if (!doctorProfileId) return;

      try {
        setLoading(true);
        
        // Load all data in parallel for better performance
        const [statsData, activityData, tasksData] = await Promise.all([
          getUltraOptimizedDashboardStats(doctorProfileId),
          getUltraOptimizedRecentActivity(doctorProfileId),
          getUltraOptimizedUpcomingTasks(doctorProfileId)
        ]);

        // Only update state if component is still mounted
        if (isMounted) {
        setStats(statsData);
        setRecentActivity(activityData);
        setUpcomingTasks(tasksData);
        
        // Load events and patients
        await Promise.all([
          loadEvents(),
          loadPatients()
        ]);
        
        // Prefetch data for other pages in the background
        dataPrefetchService.prefetchDoctorDashboardData(doctorProfileId);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    loadAllData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [doctorProfileId, loadEvents, loadPatients]);

  // Memoize quick stats to prevent unnecessary re-renders
  const quickStats = useMemo(() => [
    { label: 'Total Patients', value: stats.totalPatients.toString(), icon: Users, href: '/doctor/patients' },
    { label: 'Pending Consents', value: stats.pendingConsents.toString(), icon: Clock, href: '/doctor/consents' },
    { label: 'Active Consents', value: stats.activeConsents.toString(), icon: CheckCircle, href: '/doctor/consents' },
    { label: 'Schedule', value: events.length.toString(), icon: Calendar, href: '#' },
  ], [stats, events]);

  // Memoize calendar handlers to prevent unnecessary re-renders
  const calendarHandlers = useMemo(() => ({
    onDateClick: handleDateClick,
    onEventClick: handleEventClick,
    onAddEvent: handleAddEvent,
    onViewChange: setCalendarView
  }), []);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-destructive',
      medium: 'bg-warning',
      low: 'bg-accent'
    };
    return colors[priority] || colors.low;
  };

  // Event styling for calendar
  const eventStyleGetter = (event: any) => {
    const colors = {
      consultation: { backgroundColor: '#3b82f6', color: 'white' },
      operation: { backgroundColor: '#ef4444', color: 'white' },
      meeting: { backgroundColor: '#10b981', color: 'white' }
    };
    return {
      style: {
        backgroundColor: colors[event.type as keyof typeof colors]?.backgroundColor || '#6b7280',
        color: colors[event.type as keyof typeof colors]?.color || 'white',
        borderRadius: '4px',
        border: 'none',
        opacity: 0.8
      }
    };
  };

  // Get event icon based on type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-4 w-4" />;
      case 'operation':
        return <Activity className="h-4 w-4" />;
      case 'meeting':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions />

      <div>
        <h1 className="text-3xl font-bold">Welcome back, Dr. {user?.name}</h1>
        <p className="text-muted-foreground">Here's your practice overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => stat.href !== '#' && navigate(stat.href)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>



      {/* Enhanced Calendar Section */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>}>
        {loading || isDataLoading ? (
          <CalendarSkeleton />
        ) : (
          <EnhancedCalendarComponent
            key={calendarKey}
            events={events.map(event => {
              console.log('Mapping event for calendar:', event);
              return {
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                event_type: (event.type || 'consultation') as 'consultation' | 'blocked' | 'followup' | 'meeting' | 'reminder',
                status: (event.status || 'confirmed') as 'pending' | 'confirmed' | 'cancelled' | 'rejected',
                patient_name: event.patientName,
                notes: event.notes,
                doctor_id: event.doctorId || '',
                patient_id: event.patientId,
                is_available: true
              };
            })}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onEditEvent={handleEditEvent}
            onDayViewClick={handleDayViewClick}
            onAddEvent={handleAddEvent}
            onApproveEvent={handleApproveEvent}
            onRejectEvent={handleRejectEvent}
            view={calendarView}
            showNavigation={true}
            showAddButton={true}
          />
        )}
      </Suspense>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates in your practice</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressiveList
            items={recentActivity}
            loading={loading}
            renderItem={(activity) => (
              <div className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                <div className="p-2 bg-accent-light rounded-lg">
                  <Activity className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )}
            fallbackCount={3}
          />
          {!loading && recentActivity.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Scheduling Modal */}
      <EnhancedSchedulingModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingEvent(null);
        }}
        selectedDate={selectedDate}
        patients={patients}
        onSchedule={handleCreateSchedule}
        onUpdate={handleUpdateEvent}
        editingEvent={editingEvent}
        isPatientView={false}
        doctorName={user?.name}
      />
      

      {/* Meeting Details Modal */}
      <MeetingDetailsModal
        event={selectedEvent}
        isOpen={isMeetingDetailsOpen}
        onClose={() => {
          setIsMeetingDetailsOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
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
          events={events
            .filter(event => 
              event.start.getDate() === dayViewDate.getDate() &&
              event.start.getMonth() === dayViewDate.getMonth() &&
              event.start.getFullYear() === dayViewDate.getFullYear()
            )
            .map(event => ({
              id: event.id,
              title: event.title,
              start: event.start,
              end: event.end,
              event_type: event.type as 'consultation' | 'blocked' | 'followup' | 'meeting' | 'reminder',
              status: event.status as 'pending' | 'confirmed' | 'cancelled' | 'rejected',
              patient_name: event.patientName,
              notes: event.notes,
              doctor_id: event.doctorId || '',
              patient_id: event.patientId,
              is_available: true
            }))}
          onScheduleEvent={handleScheduleEvent}
          onEditEvent={(dayEvent) => {
            // Convert day event back to calendar event
            const calendarEvent: CalendarEvent = {
              id: dayEvent.id,
              title: dayEvent.title,
              start: dayEvent.start,
              end: dayEvent.end,
              type: dayEvent.event_type as 'consultation' | 'operation' | 'meeting' | 'available',
              patientName: dayEvent.patient_name,
              notes: dayEvent.notes,
              status: dayEvent.status as 'pending' | 'confirmed' | 'cancelled',
              doctorId: dayEvent.doctor_id,
              patientId: dayEvent.patient_id
            };
            handleEditEvent(calendarEvent);
          }}
          onDeleteEvent={async (eventId) => {
            const event = events.find(e => e.id === eventId);
            if (event) {
              await handleDeleteEvent(event);
            }
          }}
          onMoveEvent={handleMoveEvent}
          onResizeEvent={handleResizeEvent}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;