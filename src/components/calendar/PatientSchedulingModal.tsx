import React, { useState, useEffect, useCallback, memo } from 'react';
import { format, addMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Stethoscope, 
  TestTube, 
  Scan, 
  FileText, 
  Clock, 
  User, 
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import { PatientAppointment } from './PatientCalendarComponent';

export interface PatientScheduleData {
  title: string;
  appointment_type: 'consultation' | 'lab_test' | 'scanning' | 'other';
  date: string;
  time: string;
  duration: number;
  doctor_id?: string;
  test_center_id?: string;
  notes?: string;
  status: 'pending' | 'confirmed';
}

interface PatientSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSchedule: (data: PatientScheduleData) => void;
  onUpdate?: (appointmentId: string, data: PatientScheduleData) => void;
  editingAppointment?: PatientAppointment | null;
  doctors?: Array<{ id: string; name: string; specialization?: string }>;
  testCenters?: Array<{ id: string; name: string; address?: string }>;
  asDialog?: boolean; // New prop to control whether to render as Dialog or just content
  existingAppointments?: PatientAppointment[]; // Add existing appointments for overlap checking
}

// Helper function to calculate end time
const calculateEndTime = (startTime: string | any, durationMinutes: number): string => {
  try {
    console.log('calculateEndTime called with:', { startTime, durationMinutes, startTimeType: typeof startTime });
    
    // Convert to string if it's an object
    let timeString = startTime;
    if (typeof startTime === 'object' && startTime !== null) {
      // If it's a Date object, format it
      if (startTime instanceof Date) {
        timeString = format(startTime, 'HH:mm');
      } else if (startTime.time) {
        // If it has a time property
        timeString = startTime.time;
      } else {
        console.log('Cannot convert object to time string:', startTime);
        return 'Invalid time';
      }
    }
    
    // Ensure it's a string
    timeString = String(timeString);
    
    // Validate time format
    if (!timeString || !timeString.includes(':') || typeof durationMinutes !== 'number') {
      console.log('Invalid input after conversion:', { timeString, durationMinutes });
      return 'Invalid time';
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    console.log('Parsed time:', { hours, minutes });
    
    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.log('Invalid hours/minutes:', { hours, minutes });
      return 'Invalid time';
    }
    
    // Create a valid date for today
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);
    console.log('Created startDate:', startDate);
    
    // Validate the created date
    if (isNaN(startDate.getTime())) {
      console.log('Invalid startDate');
      return 'Invalid time';
    }
    
    const endDate = addMinutes(startDate, durationMinutes);
    console.log('Created endDate:', endDate);
    
    const result = format(endDate, 'HH:mm');
    console.log('Formatted result:', result);
    return result;
  } catch (error) {
    console.error('Error calculating end time:', error);
    return 'Invalid time';
  }
};

// Helper function to check for overlapping appointments
const checkOverlap = (
  newStart: Date, 
  newEnd: Date, 
  existingAppointments: PatientAppointment[], 
  excludeId?: string
): boolean => {
  return existingAppointments.some(appointment => {
    if (appointment.id === excludeId) return false; // Don't check against the appointment being edited
    
    const existingStart = appointment.start;
    const existingEnd = appointment.end;
    
    // Check if the new appointment overlaps with existing one
    return (newStart < existingEnd && newEnd > existingStart);
  });
};

const PatientSchedulingModal: React.FC<PatientSchedulingModalProps> = memo(({
  isOpen,
  onClose,
  selectedDate,
  onSchedule,
  onUpdate,
  editingAppointment,
  doctors = [],
  testCenters = [],
  asDialog = true,
  existingAppointments = []
}) => {
  console.log('🔍 PatientSchedulingModal rendered - isOpen:', isOpen);
  console.log('🔍 PatientSchedulingModal received doctors:', doctors);
  console.log('🔍 Doctors length in modal:', doctors?.length);
  console.log('🔍 PatientSchedulingModal editingAppointment:', editingAppointment);
  console.log('🔍 PatientSchedulingModal existingAppointments:', existingAppointments);
  const [formData, setFormData] = useState<PatientScheduleData>({
    title: '',
    appointment_type: 'consultation',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: '',
    duration: 30,
    doctor_id: '',
    test_center_id: '',
    notes: '',
    status: 'pending'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // State for blocked time slots
  const [blockedTimeSlots, setBlockedTimeSlots] = React.useState<any[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Check if a specific time slot is available for the selected doctor
  const checkTimeSlotAvailability = useCallback((timeString: string) => {
    if (!formData.date) return true;
    
    // For consultations, we need a doctor selected
    if (formData.appointment_type === 'consultation' && !formData.doctor_id) {
      return false; // No doctor selected, so no slots available
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const slotStart = new Date(`${formData.date}T${timeString}`);
    const slotEnd = new Date(slotStart.getTime() + (formData.duration * 60000));
    
    // Debug logging
    if (timeString === '09:00') {
      console.log('🔍 PatientSchedulingModal - Checking availability for 09:00:');
      console.log('Selected doctor_id:', formData.doctor_id);
      console.log('Appointment type:', formData.appointment_type);
      console.log('All existing appointments:', existingAppointments);
      console.log('All existing appointments details:', existingAppointments.map(apt => ({
        id: apt.id,
        title: apt.title,
        doctor_id: apt.doctor_id,
        start: apt.start,
        end: apt.end
      })));
    }
    
    // Filter appointments by selected doctor (for consultations) or all appointments (for other types)
    const relevantAppointments = existingAppointments.filter(appointment => {
      if (formData.appointment_type === 'consultation') {
        // For consultations, only check appointments with the selected doctor
        const matches = appointment.doctor_id === formData.doctor_id;
        if (timeString === '09:00') {
          console.log(`Appointment ${appointment.id} doctor_id: ${appointment.doctor_id}, matches: ${matches}`);
        }
        return matches;
      } else {
        // For lab tests/scanning, check all appointments (no doctor-specific filtering)
        return true;
      }
    });
    
    if (timeString === '09:00') {
      console.log('Relevant appointments for selected doctor:', relevantAppointments);
      console.log('Relevant appointments details:', relevantAppointments.map(apt => ({
        id: apt.id,
        title: apt.title,
        doctor_id: apt.doctor_id,
        start: apt.start,
        end: apt.end
      })));
    }
    
    // Check against relevant appointments
    const isBlockedByAppointments = relevantAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.start);
      const appointmentEnd = new Date(appointment.end);
      
      if (timeString === '09:00') {
        console.log(`Checking appointment ${appointment.id}: ${appointmentStart.toLocaleTimeString()} - ${appointmentEnd.toLocaleTimeString()}`);
        console.log(`Slot: ${slotStart.toLocaleTimeString()} - ${slotEnd.toLocaleTimeString()}`);
      }
      
      // Check if the new slot overlaps with existing appointment
      const overlaps = (slotStart < appointmentEnd && slotEnd > appointmentStart);
      
      if (overlaps && timeString === '09:00') {
        console.log('🚫 Slot blocked by appointment:', {
          appointmentTitle: appointment.title,
          appointmentStart,
          appointmentEnd,
          slotStart,
          slotEnd
        });
      }
      
      return overlaps;
    });

    // Check against blocked time slots
    console.log(`🔍 Checking ${timeString} against ${blockedTimeSlots.length} blocked time slots`);
    const isBlockedByTimeSlots = blockedTimeSlots.some(blockedSlot => {
      const blockedStart = new Date(blockedSlot.start_time);
      const blockedEnd = new Date(blockedSlot.end_time);
      
      console.log(`🔍 Checking blocked slot ${blockedSlot.id} (${blockedSlot.title}): ${blockedStart.toLocaleTimeString()} - ${blockedEnd.toLocaleTimeString()}`);
      console.log(`🔍 Slot being checked: ${slotStart.toLocaleTimeString()} - ${slotEnd.toLocaleTimeString()}`);
      
      // Check if the new slot overlaps with blocked time slot
      const overlaps = (slotStart < blockedEnd && slotEnd > blockedStart);
      
      console.log(`🔍 Overlap result: ${overlaps ? 'OVERLAPS' : 'NO OVERLAP'}`);
      
      if (overlaps) {
        console.log('🚫 Slot blocked by blocked time slot:', {
          blockedTitle: blockedSlot.title,
          blockedStart: blockedStart.toLocaleTimeString(),
          blockedEnd: blockedEnd.toLocaleTimeString(),
          slotStart: slotStart.toLocaleTimeString(),
          slotEnd: slotEnd.toLocaleTimeString()
        });
      }
      
      return overlaps;
    });

    const isBlocked = isBlockedByAppointments || isBlockedByTimeSlots;
    
    if (timeString === '09:00') {
      console.log(`Final result for ${timeString}: ${isBlocked ? 'BLOCKED' : 'AVAILABLE'}`);
    }
    
    return !isBlocked;
  }, [formData.date, formData.duration, formData.doctor_id, formData.appointment_type, existingAppointments, blockedTimeSlots]);

  // Generate available time slots based on real data (8 AM to 8 PM, same as day view)
  const generateTimeSlots = useCallback(() => {
    console.log('🔄 Generating time slots...');
    console.log('🔄 Blocked time slots count:', blockedTimeSlots.length);
    console.log('🔄 Blocked time slots:', blockedTimeSlots);
    
    const slots = [];
    const startHour = 8;
    const endHour = 20; // 8 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this time slot is available
        const isAvailable = checkTimeSlotAvailability(timeString);
        
        // Log every slot for debugging
        if (!isAvailable) {
          console.log(`🚫 Blocked slot: ${timeString}`);
        }
        
        slots.push({ time: timeString, available: isAvailable });
      }
    }
    
    console.log('🔄 Generated slots:', slots.length);
    console.log('🔄 Available slots:', slots.filter(s => s.available).length);
    console.log('🔄 Blocked slots:', slots.filter(s => !s.available).length);
    console.log('🔄 Blocked slot times:', slots.filter(s => !s.available).map(s => s.time));
    
    return slots;
  }, [formData.date, formData.duration, formData.doctor_id, formData.appointment_type, existingAppointments, blockedTimeSlots, refreshKey, checkTimeSlotAvailability]);

  const availableSlots = generateTimeSlots();

  // Regenerate time slots when blocked time slots change
  React.useEffect(() => {
    console.log('🔄 PatientSchedulingModal - blockedTimeSlots changed, regenerating time slots');
    console.log('🔄 PatientSchedulingModal - blockedTimeSlots count:', blockedTimeSlots.length);
    console.log('🔄 PatientSchedulingModal - blockedTimeSlots details:', blockedTimeSlots.map(slot => ({
      id: slot.id,
      title: slot.title,
      start_time: slot.start_time,
      end_time: slot.end_time
    })));
    
    // If no blocked slots found, try to fetch them from database
    if (blockedTimeSlots.length === 0 && formData.doctor_id && formData.date) {
      console.log('🧪 No blocked slots found, fetching from database...');
      fetchBlockedTimeSlots(formData.doctor_id, formData.date);
    }
    
    // The generateTimeSlots function will be called automatically due to the dependency array
  }, [blockedTimeSlots, formData.doctor_id, formData.date]);

  // Debug function to test availability checking
  React.useEffect(() => {
    if (formData.doctor_id && formData.date) {
      console.log('🧪 PatientSchedulingModal - Testing availability for doctor:', formData.doctor_id);
      console.log('🧪 PatientSchedulingModal - Available slots:', availableSlots.filter(slot => slot.available).length);
      console.log('🧪 PatientSchedulingModal - Blocked slots:', availableSlots.filter(slot => !slot.available).length);
      console.log('🧪 PatientSchedulingModal - All slots:', availableSlots);
      console.log('🧪 PatientSchedulingModal - Existing appointments:', existingAppointments);
      console.log('🧪 PatientSchedulingModal - Existing appointments details:', existingAppointments.map(apt => ({
        id: apt.id,
        title: apt.title,
        doctor_id: apt.doctor_id,
        start: apt.start,
        end: apt.end
      })));
      
      // Show which slots are blocked
      const blockedSlots = availableSlots.filter(slot => !slot.available);
      if (blockedSlots.length > 0) {
        console.log('🚫 Blocked slots:', blockedSlots.map(slot => slot.time));
      } else {
        console.log('⚠️ No blocked slots found - this might be the issue!');
        console.log('🔍 Debugging blocking logic...');
        
        // Test specific times that should be blocked
        const testTimes = ['10:30', '11:30'];
        testTimes.forEach(time => {
          const isAvailable = checkTimeSlotAvailability(time);
          console.log(`🔍 Time ${time}: ${isAvailable ? 'Available' : 'Blocked'}`);
        });
      }
    }
  }, [formData.doctor_id, formData.date, availableSlots, existingAppointments, checkTimeSlotAvailability]);

  // Function to fetch blocked time slots for selected doctor
  const fetchBlockedTimeSlots = React.useCallback(async (doctorId: string, date: string) => {
    if (!doctorId || !date) return;
    
    try {
      console.log('🔍 Fetching blocked time slots for doctor:', doctorId, 'date:', date);
      console.log('🔍 Date type:', typeof date, 'Date value:', date);
      
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Fetch only blocked time events (where patient_id is null)
      // These are events created by the doctor to block time slots
      const { data: blockedConsultations, error } = await supabase
        .from('consultations')
        .select(`
          id,
          reason,
          consultation_date,
          consultation_time,
          status,
          doctor_id,
          notes,
          patient_id
        `)
        .eq('doctor_id', doctorId)
        .eq('consultation_date', date)
        .is('patient_id', null); // Only blocked time events (no patient assigned)

      if (error) {
        console.error('❌ Error fetching blocked time slots:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        return;
      }

      console.log('🔍 Database query completed successfully');
      console.log('🔍 Raw consultations fetched from database:', blockedConsultations);
      console.log('🔍 Number of consultations found:', blockedConsultations?.length || 0);
      console.log('🔍 Consultations details:', blockedConsultations);

      if (!blockedConsultations || blockedConsultations.length === 0) {
        console.log('🔍 No consultations found, setting empty blocked slots');
        setBlockedTimeSlots([]);
        setRefreshKey(prev => prev + 1); // Force refresh of time slots
        return;
      }

      // Convert all consultations to blocked time slot format
      // Any time the doctor has an event (consultation, meeting, blocked time, etc.), that slot should be blocked for patients
      const blockedSlots = blockedConsultations.map((consultation: any) => {
        // Calculate end time using database values
        const startTime = new Date(`${consultation.consultation_date}T${consultation.consultation_time}`);
        let endTime: Date;
        
        if (consultation.end_time) {
          // Use end_time from database if available
          const [endHours, endMinutes] = consultation.end_time.split(':').map(Number);
          endTime = new Date(consultation.consultation_date);
          endTime.setHours(endHours, endMinutes, 0, 0);
        } else {
          // Fallback to calculating from duration_minutes or default to 30 minutes
          const duration = consultation.duration_minutes || 30;
          endTime = new Date(startTime.getTime() + duration * 60000);
        }
        
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

      console.log('🔍 Blocked time slots found:', blockedSlots);
      console.log('🔍 Blocked time slots count:', blockedSlots.length);
      console.log('🔍 Blocked time slots details:', blockedSlots.map(slot => ({
        id: slot.id,
        title: slot.title,
        start_time: slot.start_time,
        end_time: slot.end_time,
        doctor_id: slot.doctor_id
      })));
      
      console.log('🔍 Setting blocked time slots state...');
      setBlockedTimeSlots(blockedSlots);
      setRefreshKey(prev => prev + 1); // Force refresh of time slots
      console.log('🔍 Blocked time slots state set successfully');
    } catch (error) {
      console.error('Error in fetchBlockedTimeSlots:', error);
    }
  }, []);

  // Fetch blocked time slots when doctor or date changes
  React.useEffect(() => {
    console.log('🔄 PatientSchedulingModal - useEffect triggered for fetchBlockedTimeSlots');
    console.log('🔄 PatientSchedulingModal - formData.doctor_id:', formData.doctor_id);
    console.log('🔄 PatientSchedulingModal - formData.date:', formData.date);
    
    if (formData.doctor_id && formData.date) {
      console.log('🔄 PatientSchedulingModal - Calling fetchBlockedTimeSlots...');
      fetchBlockedTimeSlots(formData.doctor_id, formData.date);
    } else {
      console.log('🔄 PatientSchedulingModal - Not calling fetchBlockedTimeSlots - missing doctor_id or date');
      // Clear blocked slots if no doctor or date
      setBlockedTimeSlots([]);
    }
  }, [formData.doctor_id, formData.date, fetchBlockedTimeSlots]);

  // Debug when existing appointments change
  React.useEffect(() => {
    console.log('🔄 PatientSchedulingModal - existingAppointments changed:', existingAppointments.length, 'appointments');
    console.log('🔄 PatientSchedulingModal - existingAppointments details:', existingAppointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      doctor_id: apt.doctor_id,
      start: apt.start,
      end: apt.end
    })));
    console.log('🔄 PatientSchedulingModal - blockedTimeSlots:', blockedTimeSlots.length, 'blocked slots');
  }, [existingAppointments, blockedTimeSlots]);

  // Expose debug functions to window for testing
  React.useEffect(() => {
    (window as any).debugPatientScheduling = {
      formData,
      existingAppointments,
      blockedTimeSlots,
      availableSlots,
      checkTimeSlotAvailability: (time: string) => checkTimeSlotAvailability(time),
      generateTimeSlots: () => generateTimeSlots(),
      testBlocking: (time: string) => {
        console.log(`🧪 Testing blocking for time: ${time}`);
        console.log('Current formData:', formData);
        console.log('Existing appointments:', existingAppointments);
        console.log('Blocked time slots:', blockedTimeSlots);
        const isAvailable = checkTimeSlotAvailability(time);
        console.log(`Result: ${time} is ${isAvailable ? 'Available' : 'Blocked'}`);
        return isAvailable;
      },
        testDoctorSync: () => {
          console.log('🧪 Testing doctor sync...');
          console.log('Selected doctor ID:', formData.doctor_id);
          console.log('All appointments:', existingAppointments.map(apt => ({
            id: apt.id,
            title: apt.title,
            doctor_id: apt.doctor_id,
            start: apt.start,
            end: apt.end
          })));
          console.log('Blocked time slots:', blockedTimeSlots.map(blocked => ({
            id: blocked.id,
            title: blocked.title,
            doctor_id: blocked.doctor_id,
            start_time: blocked.start_time,
            end_time: blocked.end_time
          })));
          const doctorAppointments = existingAppointments.filter(apt => apt.doctor_id === formData.doctor_id);
          console.log('Appointments for selected doctor:', doctorAppointments);
          return doctorAppointments;
        },
        testBlockedSlots: async () => {
          console.log('🧪 Testing blocked slots fetch...');
          if (formData.doctor_id && formData.date) {
            await fetchBlockedTimeSlots(formData.doctor_id, formData.date);
            console.log('Blocked slots after fetch:', blockedTimeSlots);
          } else {
            console.log('No doctor or date selected');
          }
        },
        testDatabaseQuery: async () => {
          console.log('🧪 Testing database query directly...');
          if (formData.doctor_id && formData.date) {
            try {
              const { supabase } = await import('@/integrations/supabase/client');
              const { data, error } = await supabase
                .from('consultations')
                .select('*')
                .eq('doctor_id', formData.doctor_id)
                .eq('consultation_date', formData.date);
              
              console.log('Direct database query result:', data);
              console.log('Direct database query error:', error);
              return data;
            } catch (err) {
              console.error('Error in direct database query:', err);
            }
          } else {
            console.log('No doctor or date selected for database test');
          }
        },
        forceTestBlockedSlots: () => {
          console.log('🧪 Forcing test blocked slots...');
          const testBlockedSlots = [
            {
              id: 'test-1',
              title: 'Test Blocked Time',
              start_time: `${formData.date}T10:30:00`,
              end_time: `${formData.date}T11:00:00`,
              event_type: 'blocked',
              doctor_id: formData.doctor_id,
              notes: 'Test blocked slot'
            },
            {
              id: 'test-2',
              title: 'Test Blocked Time 2',
              start_time: `${formData.date}T11:30:00`,
              end_time: `${formData.date}T12:00:00`,
              event_type: 'blocked',
              doctor_id: formData.doctor_id,
              notes: 'Test blocked slot 2'
            }
          ];
          console.log('🧪 Setting test blocked slots:', testBlockedSlots);
          setBlockedTimeSlots(testBlockedSlots);
          setRefreshKey(prev => prev + 1);
          return testBlockedSlots;
        },
        testRealBlockedSlots: async () => {
          console.log('🧪 Testing real blocked slots from database...');
          console.log('🧪 Current formData:', formData);
          
          if (!formData.doctor_id || !formData.date) {
            console.log('❌ No doctor or date selected');
            console.log('❌ Doctor ID:', formData.doctor_id);
            console.log('❌ Date:', formData.date);
            return null;
          }
          
          try {
            console.log('🧪 Importing supabase client...');
            const { supabase } = await import('@/integrations/supabase/client');
            console.log('🧪 Supabase client imported successfully');
            
            console.log('🧪 Fetching consultations for doctor:', formData.doctor_id, 'date:', formData.date);
            
            // Fetch ALL consultations for this doctor on this date
            const { data: allConsultations, error } = await supabase
              .from('consultations')
              .select('*')
              .eq('doctor_id', formData.doctor_id)
              .eq('consultation_date', formData.date);
            
            console.log('🔍 Database query completed');
            console.log('🔍 All consultations for doctor:', allConsultations);
            console.log('🔍 Error:', error);
            console.log('🔍 Number of consultations found:', allConsultations?.length || 0);
            
            if (error) {
              console.error('❌ Database error:', error);
              return null;
            }
            
            if (allConsultations && allConsultations.length > 0) {
              // Show blocked time events (patient_id is null)
              const blockedTimeEvents = allConsultations.filter(c => c.patient_id === null);
              console.log('🚫 Blocked Time Events (patient_id is null):', blockedTimeEvents);
              console.log('🚫 Number of blocked time events:', blockedTimeEvents.length);
              
              // Show consultation events (patient_id is not null)
              const consultationEvents = allConsultations.filter(c => c.patient_id !== null);
              console.log('👥 Consultation Events (patient_id is not null):', consultationEvents);
              console.log('👥 Number of consultation events:', consultationEvents.length);
              
              // Process blocked time events
              const processedBlockedSlots = blockedTimeEvents.map(consultation => {
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
              
              console.log('🔄 Processed blocked slots:', processedBlockedSlots);
              console.log('🔄 Number of processed blocked slots:', processedBlockedSlots.length);
              
              // Set the blocked slots
              console.log('🔄 Setting blocked slots in state...');
              setBlockedTimeSlots(processedBlockedSlots);
              setRefreshKey(prev => prev + 1);
              console.log('🔄 Blocked slots set successfully');
              
              return processedBlockedSlots;
            } else {
              console.log('⚠️ No consultations found for this doctor and date');
              return [];
            }
          } catch (err) {
            console.error('❌ Error testing real blocked slots:', err);
            return null;
          }
        },
        testCurrentState: () => {
          console.log('🧪 Current state test:');
          console.log('🧪 formData:', formData);
          console.log('🧪 blockedTimeSlots:', blockedTimeSlots);
          console.log('🧪 blockedTimeSlots.length:', blockedTimeSlots.length);
          console.log('🧪 availableSlots:', availableSlots);
          console.log('🧪 availableSlots.length:', availableSlots.length);
          console.log('🧪 blocked slots in availableSlots:', availableSlots.filter(s => !s.available));
          console.log('🧪 available slots in availableSlots:', availableSlots.filter(s => s.available));
          return {
            formData,
            blockedTimeSlots,
            availableSlots,
            blockedCount: availableSlots.filter(s => !s.available).length,
            availableCount: availableSlots.filter(s => s.available).length
          };
        },
        manualFetch: () => {
          console.log('🧪 Manual fetch triggered');
          if (formData.doctor_id && formData.date) {
            console.log('🧪 Calling fetchBlockedTimeSlots manually...');
            fetchBlockedTimeSlots(formData.doctor_id, formData.date);
          } else {
            console.log('❌ Cannot fetch - missing doctor_id or date');
            console.log('❌ Doctor ID:', formData.doctor_id);
            console.log('❌ Date:', formData.date);
          }
        },
        testUIWithHardcodedBlocked: () => {
          console.log('🧪 Testing UI with hardcoded blocked slots...');
          const hardcodedBlockedSlots = [
            {
              id: 'hardcoded-1',
              title: 'Hardcoded Blocked Time',
              start_time: `${formData.date}T10:30:00`,
              end_time: `${formData.date}T11:00:00`,
              event_type: 'blocked',
              doctor_id: formData.doctor_id,
              notes: 'Hardcoded test slot'
            },
            {
              id: 'hardcoded-2',
              title: 'Hardcoded Blocked Time 2',
              start_time: `${formData.date}T11:30:00`,
              end_time: `${formData.date}T12:00:00`,
              event_type: 'blocked',
              doctor_id: formData.doctor_id,
              notes: 'Hardcoded test slot 2'
            }
          ];
          console.log('🧪 Setting hardcoded blocked slots:', hardcodedBlockedSlots);
          setBlockedTimeSlots(hardcodedBlockedSlots);
          setRefreshKey(prev => prev + 1);
          console.log('🧪 Hardcoded blocked slots set - check UI now');
          return hardcodedBlockedSlots;
        },
        checkAllBlockedTimeEvents: async () => {
          console.log('🧪 Checking ALL blocked time events in database...');
          try {
            const { supabase } = await import('@/integrations/supabase/client');
            
            // Fetch ALL blocked time events (patient_id is null) for ALL doctors and dates
            const { data: allBlockedEvents, error } = await supabase
              .from('consultations')
              .select('*')
              .is('patient_id', null);
            
            console.log('🔍 All blocked time events in database:', allBlockedEvents);
            console.log('🔍 Number of blocked time events:', allBlockedEvents?.length || 0);
            console.log('🔍 Error:', error);
            
            if (allBlockedEvents && allBlockedEvents.length > 0) {
              console.log('🔍 Blocked events by doctor:');
              const byDoctor = allBlockedEvents.reduce((acc, event) => {
                if (!acc[event.doctor_id]) acc[event.doctor_id] = [];
                acc[event.doctor_id].push(event);
                return acc;
              }, {});
              console.log('🔍 Grouped by doctor:', byDoctor);
            }
            
            return allBlockedEvents;
          } catch (err) {
            console.error('❌ Error checking all blocked time events:', err);
            return null;
          }
        }
    };
    console.log('🔧 Debug functions available: window.debugPatientScheduling');
    console.log('🔧 Current state:', {
      formData,
      existingAppointments: existingAppointments.length,
      availableSlots: availableSlots.length,
      blockedSlots: availableSlots.filter(slot => !slot.available).length
    });
  }, [formData, existingAppointments, availableSlots, checkTimeSlotAvailability, generateTimeSlots]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    console.log('🔍 PatientSchedulingModal useEffect - editingAppointment:', editingAppointment);
    console.log('🔍 PatientSchedulingModal useEffect - selectedDate:', selectedDate);
    
    if (editingAppointment) {
      const duration = Math.round((editingAppointment.end.getTime() - editingAppointment.start.getTime()) / (1000 * 60));
      const formData: PatientScheduleData = {
        title: editingAppointment.title,
        appointment_type: editingAppointment.appointment_type,
        date: format(editingAppointment.start, 'yyyy-MM-dd'),
        time: format(editingAppointment.start, 'HH:mm'),
        duration: duration,
        doctor_id: editingAppointment.doctor_id || '',
        test_center_id: editingAppointment.test_center_id || '',
        notes: editingAppointment.notes || '',
        status: editingAppointment.status === 'cancelled' ? 'pending' : (editingAppointment.status as 'pending' | 'confirmed') || 'pending'
      };
      console.log('🔍 Setting form data from editingAppointment:', formData);
      setFormData(formData);
    } else {
      const formData: PatientScheduleData = {
        title: '',
        appointment_type: 'consultation',
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        time: '',
        duration: 30,
        doctor_id: '',
        test_center_id: '',
        notes: '',
        status: 'pending'
      };
      console.log('🔍 Setting default form data:', formData);
      setFormData(formData);
    }
  }, [editingAppointment, selectedDate]);

  // Regenerate slots when date, duration, doctor, appointment type, or existing appointments change
  useEffect(() => {
    if (formData.date && formData.duration) {
      console.log('🔄 Regenerating time slots for date:', formData.date, 'duration:', formData.duration, 'doctor:', formData.doctor_id, 'type:', formData.appointment_type);
      
      // Check if currently selected time is still available
      if (formData.time) {
        const isStillAvailable = checkTimeSlotAvailability(formData.time);
        if (!isStillAvailable) {
          console.log('⚠️ Selected time is no longer available, clearing selection');
          setFormData(prev => ({ ...prev, time: '' }));
        }
      }
    }
  }, [formData.date, formData.duration, formData.doctor_id, formData.appointment_type, existingAppointments, checkTimeSlotAvailability, formData.time]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Please select a time slot';
    }

    if (formData.appointment_type === 'consultation' && !formData.doctor_id) {
      newErrors.doctor_id = 'Doctor selection is required for consultations';
    }

    if (formData.appointment_type === 'lab_test' && !formData.test_center_id) {
      newErrors.test_center_id = 'Test center selection is required for lab tests';
    }

    if (formData.appointment_type === 'scanning' && !formData.test_center_id) {
      newErrors.test_center_id = 'Test center selection is required for scanning';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check for overlapping appointments
    if (formData.date && formData.time) {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const appointmentDate = new Date(formData.date);
      const startTime = new Date(appointmentDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(startTime, formData.duration);
      
      if (checkOverlap(startTime, endTime, existingAppointments, editingAppointment?.id)) {
        setErrors(prev => ({
          ...prev,
          time: 'This time slot conflicts with an existing appointment'
        }));
        return;
      }
    }

    if (editingAppointment && editingAppointment.id !== 'temp-slot' && onUpdate) {
      onUpdate(editingAppointment.id, formData);
    } else {
      onSchedule(formData);
    }
    
    setFormData({
      title: '',
      appointment_type: 'consultation',
      date: '',
      time: '',
      duration: 30,
      doctor_id: '',
      test_center_id: '',
      notes: '',
      status: 'pending'
    });
    setErrors({});
    onClose();
  }, [validateForm, onSchedule, onUpdate, formData, editingAppointment, onClose, existingAppointments]);

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-4 w-4" />;
      case 'lab_test':
        return <TestTube className="h-4 w-4" />;
      case 'scanning':
        return <Scan className="h-4 w-4" />;
      case 'other':
        return <FileText className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lab_test':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scanning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'other':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Show all slots (both available and blocked) with visual indicators
  const allSlots = availableSlots;

  const content = (
    <div className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
            {getAppointmentTypeIcon(formData.appointment_type)}
          <h2 className="text-lg font-semibold">
            {editingAppointment && editingAppointment.id !== 'temp-slot' ? 'Edit Appointment' : 'Book New Appointment'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {editingAppointment && editingAppointment.id !== 'temp-slot' ? 'Update your appointment details' : 'Schedule a new medical appointment'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Appointment Type Selection */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'consultation', label: 'Consultation', icon: Stethoscope, color: 'green' },
                { value: 'lab_test', label: 'Lab Test', icon: TestTube, color: 'blue' },
                { value: 'scanning', label: 'Scanning', icon: Scan, color: 'orange' },
                { value: 'other', label: 'Other', icon: FileText, color: 'purple' }
              ].map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.appointment_type === type.value ? 'default' : 'outline'}
                    className={`h-auto p-4 flex flex-col items-center gap-2 ${
                      formData.appointment_type === type.value 
                        ? `bg-${type.color}-500 hover:bg-${type.color}-600` 
                        : ''
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, appointment_type: type.value as any }))}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter appointment title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>

          {/* Doctor Selection (for consultations) */}
          {formData.appointment_type === 'consultation' && (
            <div className="space-y-2">
              <Label htmlFor="doctor">Select Doctor</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(value) => {
                  console.log('🔍 Doctor selected:', value);
                  console.log('🔍 Available doctors:', doctors);
                  const selectedDoctor = doctors.find(d => d.id === value);
                  console.log('🔍 Selected doctor details:', selectedDoctor);
                  setFormData(prev => ({ ...prev, doctor_id: value }));
                }}
              >
                <SelectTrigger className={errors.doctor_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length === 0 ? (
                    <SelectItem value="no-doctors" disabled>
                      <div className="flex items-center gap-2 text-gray-500">
                        <User className="h-4 w-4" />
                        <span>No doctors available</span>
                      </div>
                    </SelectItem>
                  ) : (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{doctor.name}</span>
                          {doctor.specialization && (
                            <Badge variant="secondary" className="ml-2">
                              {doctor.specialization}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.doctor_id && <p className="text-sm text-red-500">{errors.doctor_id}</p>}
            </div>
          )}

          {/* Test Center Selection (for lab tests and scanning) */}
          {(formData.appointment_type === 'lab_test' || formData.appointment_type === 'scanning') && (
            <div className="space-y-2">
              <Label htmlFor="testCenter">Select Test Center</Label>
              <Select
                value={formData.test_center_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, test_center_id: value }))}
              >
                <SelectTrigger className={errors.test_center_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose a test center" />
                </SelectTrigger>
                <SelectContent>
                  {testCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{center.name}</span>
                        {center.address && (
                          <span className="text-sm text-gray-500 ml-2">
                            {center.address}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.test_center_id && <p className="text-sm text-red-500">{errors.test_center_id}</p>}
            </div>
          )}

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label>Available Time Slots</Label>
            {isLoadingSlots ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading available slots...</p>
              </div>
            ) : formData.appointment_type === 'consultation' && !formData.doctor_id ? (
              <div className="text-center py-4 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Please select a doctor to see available time slots.</p>
              </div>
            ) : allSlots.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                {allSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    type="button"
                    variant={formData.time === slot.time ? 'default' : slot.available ? 'outline' : 'secondary'}
                    size="sm"
                         className={`text-xs ${
                           !slot.available 
                             ? 'opacity-90 cursor-not-allowed bg-red-200 border-2 border-red-400 text-red-800 font-semibold hover:bg-red-300' 
                             : formData.time === slot.time 
                               ? 'bg-primary text-primary-foreground' 
                               : 'hover:bg-primary hover:text-primary-foreground'
                         }`}
                    onClick={() => slot.available && setFormData(prev => ({ ...prev, time: slot.time }))}
                    disabled={!slot.available}
                    title={!slot.available ? 'This time slot is already booked' : `Available at ${slot.time}`}
                  >
                    {slot.time}
                    {!slot.available && <span className="ml-1">🚫</span>}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No available slots on this day.</p>
              </div>
            )}
            {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select
              value={formData.duration.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes or special requirements"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[100px]">
              {editingAppointment && editingAppointment.id !== 'temp-slot' ? 'Update' : 'Book'} Appointment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!asDialog) {
    return isOpen ? content : null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getAppointmentTypeIcon(formData.appointment_type)}
            {editingAppointment && editingAppointment.id !== 'temp-slot' ? 'Edit Appointment' : 'Book New Appointment'}
          </DialogTitle>
          <DialogDescription>
            {editingAppointment && editingAppointment.id !== 'temp-slot' ? 'Update your appointment details' : 'Schedule a new medical appointment'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Appointment Type Selection */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'consultation', label: 'Consultation', icon: Stethoscope, color: 'green' },
                { value: 'lab_test', label: 'Lab Test', icon: TestTube, color: 'blue' },
                { value: 'scanning', label: 'Scanning', icon: Scan, color: 'orange' },
                { value: 'other', label: 'Other', icon: FileText, color: 'purple' }
              ].map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.appointment_type === type.value ? 'default' : 'outline'}
                    className={`h-20 flex flex-col items-center gap-2 ${
                      formData.appointment_type === type.value 
                        ? `bg-${type.color}-500 text-white hover:bg-${type.color}-600` 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, appointment_type: type.value as any }))}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select
              value={formData.duration.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Calculated End Time Display */}
            {formData.time && typeof formData.time === 'string' && formData.time.includes(':') && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Selected Time: {formData.time} – {(() => {
                      console.log('🔍 About to call calculateEndTime with:', { time: formData.time, duration: formData.duration, timeType: typeof formData.time });
                      return calculateEndTime(formData.time, formData.duration);
                    })()}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Duration: {formData.duration} minutes
                </p>
              </div>
            )}
          </div>

          {/* Doctor Selection (for consultations) */}
          {formData.appointment_type === 'consultation' && (
            <div className="space-y-2">
              <Label htmlFor="doctor">Select Doctor</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(value) => {
                  console.log('🔍 Doctor selected:', value);
                  console.log('🔍 Available doctors:', doctors);
                  const selectedDoctor = doctors.find(d => d.id === value);
                  console.log('🔍 Selected doctor details:', selectedDoctor);
                  setFormData(prev => ({ ...prev, doctor_id: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{doctor.name}</span>
                        {doctor.specialization && (
                          <Badge variant="secondary" className="text-xs">
                            {doctor.specialization}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doctor_id && <p className="text-sm text-red-500">{errors.doctor_id}</p>}
            </div>
          )}

          {/* Test Center Selection (for lab tests and scanning) */}
          {(formData.appointment_type === 'lab_test' || formData.appointment_type === 'scanning') && (
            <div className="space-y-2">
              <Label htmlFor="testCenter">Select Test Center</Label>
              <Select
                value={formData.test_center_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, test_center_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a test center" />
                </SelectTrigger>
                <SelectContent>
                  {testCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{center.name}</span>
                        {center.address && (
                          <span className="text-xs text-muted-foreground">({center.address})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.test_center_id && <p className="text-sm text-red-500">{errors.test_center_id}</p>}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter appointment title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Available Time Slots */}
          {formData.appointment_type && formData.date && (
            <div className="space-y-2">
              <Label>Select Time Slot *</Label>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading available slots...</span>
                </div>
              ) : formData.appointment_type === 'consultation' && !formData.doctor_id ? (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Please select a doctor to see available time slots.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {allSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        type="button"
                        variant={formData.time === slot.time ? 'default' : slot.available ? 'outline' : 'secondary'}
                        size="sm"
                         className={`text-xs ${
                           !slot.available 
                             ? 'opacity-90 cursor-not-allowed bg-red-200 border-2 border-red-400 text-red-800 font-semibold hover:bg-red-300' 
                             : formData.time === slot.time 
                               ? 'bg-primary text-primary-foreground' 
                               : 'hover:bg-primary hover:text-primary-foreground'
                         }`}
                        onClick={() => slot.available && setFormData(prev => ({ ...prev, time: slot.time }))}
                        disabled={!slot.available}
                        title={!slot.available ? 'This time slot is already booked' : `Available at ${slot.time}`}
                      >
                        {slot.time}
                        {!slot.available && <span className="ml-1">🚫</span>}
                      </Button>
                    ))}
                  </div>
                  {!formData.time && (
                    <p className="text-sm text-gray-500 text-center">
                      Please select a time slot to continue
                    </p>
                  )}
                  
                  {/* Show availability summary */}
                  <div className="flex justify-between items-center text-xs text-gray-600 mt-2">
                    <span>
                      Available: {allSlots.filter(slot => slot.available).length} slots
                    </span>
                    <span>
                      Booked: {allSlots.filter(slot => !slot.available).length} slots
                    </span>
                  </div>
                </div>
              )}
              {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[100px]">
              {editingAppointment && editingAppointment.id !== 'temp-slot' ? 'Update' : 'Book'} Appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

PatientSchedulingModal.displayName = 'PatientSchedulingModal';

export default PatientSchedulingModal;
