import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Stethoscope, Briefcase, Activity, AlertCircle, Shield, Bell } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

interface DoctorScheduleData {
  title: string;
  event_type: 'consultation' | 'blocked' | 'followup' | 'meeting' | 'reminder';
  date: string;
  time: string;
  duration: number;
  patientId: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
}

interface DoctorSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  patients: any[];
  onSchedule: (data: DoctorScheduleData) => void;
  onUpdate?: (eventId: string, data: DoctorScheduleData) => void;
  editingEvent?: any;
  asDialog?: boolean; // New prop to control whether to render as Dialog or just content
  existingAppointments?: any[]; // Add existing appointments for overlap checking
}

// Helper function to calculate end time
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  try {
    console.log('calculateEndTime called with:', { startTime, durationMinutes, startTimeType: typeof startTime });
    
    // Convert to string if it's an object
    let timeString = startTime;
    if (typeof startTime === 'object' && startTime !== null) {
      // If it's a Date object, format it
      if ((startTime as any) instanceof Date) {
        timeString = format(startTime as Date, 'HH:mm');
      } else if ((startTime as any).time) {
        // If it has a time property
        timeString = (startTime as any).time;
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
  existingAppointments: any[], 
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

const DoctorSchedulingModal: React.FC<DoctorSchedulingModalProps> = React.memo(({
  isOpen,
  onClose,
  selectedDate,
  patients,
  onSchedule,
  onUpdate,
  editingEvent,
  asDialog = true,
  existingAppointments = []
}) => {
  const [formData, setFormData] = useState<DoctorScheduleData>({
    title: '',
    event_type: 'consultation',
    date: '',
    time: '',
    duration: 30,
    patientId: '',
    notes: '',
    status: 'pending'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Generate available time slots based on real data (8 AM to 8 PM, same as day view)
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    const startHour = 8;
    const endHour = 20; // 8 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this time slot is available
        const isAvailable = checkTimeSlotAvailability(timeString);
        slots.push({ time: timeString, available: isAvailable });
      }
    }
    
    return slots;
  }, [formData.date, existingAppointments]);

  // Check if a specific time slot is available
  const checkTimeSlotAvailability = useCallback((timeString: string) => {
    if (!formData.date) return true;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const slotStart = new Date(`${formData.date}T${timeString}`);
    const slotEnd = new Date(slotStart.getTime() + (formData.duration * 60000));
    
    // Debug logging
    if (timeString === '09:00') {
      console.log('🔍 Checking availability for 09:00:');
      console.log('Form data date:', formData.date);
      console.log('Slot start:', slotStart);
      console.log('Slot end:', slotEnd);
      console.log('Existing appointments:', existingAppointments);
    }
    
    // Check against existing appointments
    const isBlocked = existingAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.start);
      const appointmentEnd = new Date(appointment.end);
      
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
    
    return !isBlocked;
  }, [formData.date, formData.duration, existingAppointments]);

  const availableSlots = generateTimeSlots();

  // Regenerate slots when date or duration changes
  useEffect(() => {
    if (formData.date && formData.duration) {
      // Force re-render of slots when dependencies change
      console.log('🔄 Regenerating time slots for date:', formData.date, 'duration:', formData.duration);
      
      // Check if currently selected time is still available (but not during editing)
      if (formData.time && !editingEvent) {
        const isStillAvailable = checkTimeSlotAvailability(formData.time);
        if (!isStillAvailable) {
          console.log('⚠️ Selected time is no longer available, clearing selection');
          setFormData(prev => ({ ...prev, time: '' }));
        }
      }
    }
  }, [formData.date, formData.duration, existingAppointments, checkTimeSlotAvailability, formData.time, editingEvent]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent:', editingEvent);
    console.log('🔍 DoctorSchedulingModal useEffect - selectedDate:', selectedDate);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent keys:', editingEvent ? Object.keys(editingEvent) : 'no editingEvent');
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.type:', editingEvent?.type);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.event_type:', editingEvent?.event_type);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.patientId:', editingEvent?.patientId);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.patient_id:', editingEvent?.patient_id);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.title:', editingEvent?.title);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.notes:', editingEvent?.notes);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.status:', editingEvent?.status);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.start:', editingEvent?.start);
    console.log('🔍 DoctorSchedulingModal useEffect - editingEvent.end:', editingEvent?.end);
    
    if (editingEvent) {
      const duration = Math.round((editingEvent.end.getTime() - editingEvent.start.getTime()) / (1000 * 60));
      
      // Determine event type from title or use default
      let eventType = editingEvent.type || editingEvent.event_type;
      if (!eventType) {
        // Infer event type from title
        const title = editingEvent.title?.toLowerCase() || '';
        if (title.includes('consultation')) {
          eventType = 'consultation';
        } else if (title.includes('blocked') || title.includes('break') || title.includes('lunch') || title.includes('unavailable')) {
          eventType = 'blocked';
        } else if (title.includes('follow')) {
          eventType = 'followup';
        } else if (title.includes('meeting') || title.includes('meet')) {
          eventType = 'meeting';
        } else if (title.includes('reminder')) {
          eventType = 'reminder';
        } else {
          eventType = 'consultation'; // default
        }
      }
      
      // Find patient ID from patientName if patientId is not available
      let patientId = editingEvent.patientId || editingEvent.patient_id;
      let extractedPatientName = '';
      if (!patientId && patients.length > 0) {
        // Try to extract patient name from title (e.g., "Consultation - John Doe" -> "John Doe")
        let patientName = editingEvent.patientName;
        if (!patientName && editingEvent.title) {
          // Extract name after "Consultation - " or similar patterns
          const titleMatch = editingEvent.title.match(/(?:Consultation|Meeting|Follow-up|Reminder)\s*-\s*(.+)/);
          if (titleMatch) {
            patientName = titleMatch[1].trim();
            extractedPatientName = patientName;
          }
        }
        
        if (patientName) {
          // Try exact match first
          let patient = patients.find(p => p.name === patientName);
          if (!patient) {
            // Try partial match (in case the name in title is different from patient name)
            patient = patients.find(p => patientName.includes(p.name) || p.name.includes(patientName));
          }
          if (patient) {
            patientId = patient.id;
          }
        }
      }
      
      const formData: DoctorScheduleData = {
        title: editingEvent.title || '',
        event_type: eventType as 'consultation' | 'blocked' | 'followup' | 'meeting' | 'reminder',
        date: format(editingEvent.start, 'yyyy-MM-dd'),
        time: format(editingEvent.start, 'HH:mm'),
        duration: duration,
        patientId: patientId || '',
        notes: editingEvent.notes || '',
        status: editingEvent.status === 'cancelled' ? 'pending' : (editingEvent.status as 'pending' | 'confirmed' | 'cancelled' | 'rejected') || 'pending'
      };
      console.log('🔍 Setting form data from editingEvent:', formData);
      console.log('🔍 Inferred event type:', eventType);
      console.log('🔍 Found patient ID:', patientId);
      console.log('🔍 Extracted patient name:', extractedPatientName);
      console.log('🔍 Available patients:', patients);
      setFormData(formData);
      console.log('🔍 Form data set successfully');
    } else {
      const formData: DoctorScheduleData = {
        title: '',
        event_type: 'consultation',
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        time: '',
        duration: 30,
        patientId: '',
        notes: '',
        status: 'pending'
      };
      console.log('🔍 Setting default form data:', formData);
      setFormData(formData);
    }
  }, [editingEvent, selectedDate, patients]);

  // Debug: Log form data changes
  useEffect(() => {
    console.log('🔍 Form data changed:', formData);
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    
    if (formData.event_type === 'consultation' && !formData.patientId) {
      newErrors.patientId = 'Patient is required for consultations';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check for overlapping appointments
    const startTime = new Date(`${formData.date}T${formData.time}`);
    const endTime = new Date(startTime.getTime() + (formData.duration * 60000));
    
    if (checkOverlap(startTime, endTime, existingAppointments, editingEvent?.id)) {
      newErrors.time = 'This time slot conflicts with an existing appointment';
      setErrors(newErrors);
      return;
    }
    
    console.log('📅 Submitting doctor schedule data:', formData);
    
    if (editingEvent && editingEvent.id !== 'temp-slot') {
      onUpdate?.(editingEvent.id, formData);
    } else {
      onSchedule(formData);
    }
  }, [formData, onSchedule, onUpdate, editingEvent, existingAppointments]);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-4 w-4" />;
      case 'blocked':
        return <Shield className="h-4 w-4" />;
      case 'followup':
        return <Activity className="h-4 w-4" />;
      case 'meeting':
        return <Briefcase className="h-4 w-4" />;
      case 'reminder':
        return <Bell className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const content = (
      <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {editingEvent && editingEvent.id !== 'temp-slot' ? 'Edit Event' : 'Create New Event'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {editingEvent && editingEvent.id !== 'temp-slot' ? 'Update the event details below' : 'Fill in the details to create a new event'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" key={editingEvent?.id || 'new'}>
        {/* Event Type Selection */}
        <div className="space-y-2">
          <Label>Event Type *</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'consultation', label: 'Consultation', icon: Stethoscope },
              { value: 'blocked', label: 'Blocked Time', icon: Shield },
              { value: 'followup', label: 'Follow-up', icon: Activity },
              { value: 'meeting', label: 'Meeting', icon: Briefcase },
              { value: 'reminder', label: 'Reminder', icon: Bell }
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant={formData.event_type === value ? 'default' : 'outline'}
                className="flex items-center gap-2 h-12"
                onClick={() => setFormData(prev => ({ ...prev, event_type: value as any }))}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
          {errors.event_type && <p className="text-sm text-red-500">{errors.event_type}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter event title"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
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
          <Label htmlFor="duration">Duration (minutes) *</Label>
          <Select
            value={formData.duration.toString()}
            onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Selection */}
        {formData.event_type && formData.date && (
          <div className="space-y-2">
            <Label>Select Time Slot *</Label>
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading available slots...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={formData.time === slot.time ? 'default' : slot.available ? 'outline' : 'secondary'}
                      size="sm"
                      className={`text-xs ${
                        !slot.available 
                          ? 'opacity-50 cursor-not-allowed bg-red-100 border-red-300 text-red-600' 
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
                    Available: {availableSlots.filter(slot => slot.available).length} slots
                  </span>
                  <span>
                    Booked: {availableSlots.filter(slot => !slot.available).length} slots
                  </span>
                </div>
              </div>
            )}
            {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
          </div>
        )}

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

        {/* Patient Selection (for consultations) */}
        {formData.event_type === 'consultation' && (
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient *</Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
            >
              <SelectTrigger className={errors.patientId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.patientId && <p className="text-sm text-red-500">{errors.patientId}</p>}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes..."
            rows={3}
          />
        </div>

        {/* Status (for editing) */}
        {editingEvent && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {editingEvent && editingEvent.id !== 'temp-slot' ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );

  // Debug functions
  React.useEffect(() => {
    (window as any).debugDoctorScheduling = {
      formData,
      editingEvent,
      isEditing: editingEvent && editingEvent.id !== 'temp-slot',
      testEditEvent: () => {
        console.log('🧪 Testing edit event functionality...');
        console.log('Current editingEvent:', editingEvent);
        console.log('Current formData:', formData);
        console.log('Is editing:', editingEvent && editingEvent.id !== 'temp-slot');
        console.log('editingEvent keys:', editingEvent ? Object.keys(editingEvent) : 'no editingEvent');
        console.log('editingEvent properties:', editingEvent ? {
          id: editingEvent.id,
          title: editingEvent.title,
          type: editingEvent.type,
          event_type: editingEvent.event_type,
          patientId: editingEvent.patientId,
          patient_id: editingEvent.patient_id,
          patientName: editingEvent.patientName,
          notes: editingEvent.notes,
          status: editingEvent.status,
          start: editingEvent.start,
          end: editingEvent.end,
          doctorId: editingEvent.doctorId
        } : 'no editingEvent');
        console.log('Full editingEvent object:', JSON.stringify(editingEvent, null, 2));
        console.log('Available patients:', patients);
        if (editingEvent?.patientName) {
          const foundPatient = patients.find(p => p.name === editingEvent.patientName);
          console.log('Found patient for name "' + editingEvent.patientName + '":', foundPatient);
        }
        console.log('Current form data state:', formData);
        console.log('Form data event_type:', formData.event_type);
        console.log('Form data patientId:', formData.patientId);
        return {
          editingEvent,
          formData,
          isEditing: editingEvent && editingEvent.id !== 'temp-slot'
        };
      }
    };
    console.log('🔧 Debug functions available: window.debugDoctorScheduling');
  }, [formData, editingEvent]);

  if (asDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
});

DoctorSchedulingModal.displayName = 'DoctorSchedulingModal';

export default DoctorSchedulingModal;
export type { DoctorScheduleData };
