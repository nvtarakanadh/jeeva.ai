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
    
    // Filter appointments by selected doctor (for consultations) or all appointments (for other types)
    const relevantAppointments = existingAppointments.filter(appointment => {
      if (formData.appointment_type === 'consultation') {
        // For consultations, only check appointments with the selected doctor
        return appointment.doctor_id === formData.doctor_id;
      } else {
        // For lab tests/scanning, check all appointments (no doctor-specific filtering)
        return true;
      }
    });
    
    // Check against relevant appointments
    return !relevantAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.start);
      const appointmentEnd = new Date(appointment.end);
      
      // Check if the new slot overlaps with existing appointment
      return (slotStart < appointmentEnd && slotEnd > appointmentStart);
    });
  }, [formData.date, formData.duration, formData.doctor_id, formData.appointment_type, existingAppointments]);

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
  }, [formData.date, formData.duration, formData.doctor_id, formData.appointment_type, existingAppointments, checkTimeSlotAvailability]);

  const availableSlots = generateTimeSlots();

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

    if (editingAppointment && onUpdate) {
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
            {editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {editingAppointment ? 'Update your appointment details' : 'Schedule a new medical appointment'}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
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
              {editingAppointment ? 'Update' : 'Book'} Appointment
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
            {editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
          </DialogTitle>
          <DialogDescription>
            {editingAppointment ? 'Update your appointment details' : 'Schedule a new medical appointment'}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
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
              {editingAppointment ? 'Update' : 'Book'} Appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

PatientSchedulingModal.displayName = 'PatientSchedulingModal';

export default PatientSchedulingModal;
