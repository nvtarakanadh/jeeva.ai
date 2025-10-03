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
}

interface PatientAppointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  appointment_type: 'consultation' | 'lab_test' | 'scanning' | 'other';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  doctor_name?: string;
  test_center?: string;
  notes?: string;
  patient_id: string;
  doctor_id?: string;
  test_center_id?: string;
}

const PatientSchedulingModal: React.FC<PatientSchedulingModalProps> = memo(({
  isOpen,
  onClose,
  selectedDate,
  onSchedule,
  onUpdate,
  editingAppointment,
  doctors = [],
  testCenters = []
}) => {
  console.log('🔍 PatientSchedulingModal received doctors:', doctors);
  console.log('🔍 Doctors length in modal:', doctors?.length);
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
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; available: boolean }>>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Mock available slots - in real app, this would come from API
  const generateMockSlots = (appointmentType: string, date: string) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Mock availability - some slots are unavailable
        const available = Math.random() > 0.3;
        slots.push({ time: timeString, available });
      }
    }
    
    return slots;
  };

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (editingAppointment) {
      const duration = Math.round((editingAppointment.end.getTime() - editingAppointment.start.getTime()) / (1000 * 60));
      setFormData({
        title: editingAppointment.title,
        appointment_type: editingAppointment.appointment_type,
        date: format(editingAppointment.start, 'yyyy-MM-dd'),
        time: format(editingAppointment.start, 'HH:mm'),
        duration: duration,
        doctor_id: editingAppointment.doctor_id || '',
        test_center_id: editingAppointment.test_center_id || '',
        notes: editingAppointment.notes || '',
        status: editingAppointment.status === 'cancelled' ? 'pending' : (editingAppointment.status as 'pending' | 'confirmed') || 'pending'
      });
    } else {
      setFormData({
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
    }
  }, [editingAppointment, selectedDate]);

  useEffect(() => {
    if (formData.appointment_type && formData.date) {
      setIsLoadingSlots(true);
      // Simulate API call
      setTimeout(() => {
        const slots = generateMockSlots(formData.appointment_type, formData.date);
        setAvailableSlots(slots);
        setIsLoadingSlots(false);
      }, 500);
    }
  }, [formData.appointment_type, formData.date]);

  const validateForm = useCallback(() => {
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
  }, [validateForm, onSchedule, onUpdate, formData, editingAppointment, onClose]);

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

  const availableSlotsForType = availableSlots.filter(slot => slot.available);

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
            ) : availableSlotsForType.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                {availableSlotsForType.map((slot) => (
                  <Button
                    key={slot.time}
                    type="button"
                    variant={formData.time === slot.time ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setFormData(prev => ({ ...prev, time: slot.time }))}
                  >
                    {slot.time}
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
      </DialogContent>
    </Dialog>
  );
});

PatientSchedulingModal.displayName = 'PatientSchedulingModal';

export default PatientSchedulingModal;
