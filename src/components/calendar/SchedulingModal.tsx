import React, { useState, useEffect, memo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Stethoscope, Activity, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  patients: Patient[];
  onSchedule: (scheduleData: ScheduleData) => void;
  isPatientView?: boolean;
  doctorName?: string;
  editingEvent?: CalendarEvent;
  onUpdate?: (eventId: string, scheduleData: ScheduleData) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'consultation' | 'operation' | 'meeting' | 'available';
  patientName?: string;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  doctorId?: string;
  patientId?: string;
}

export interface ScheduleData {
  title: string;
  type: 'consultation' | 'operation' | 'meeting' | 'available';
  date: string;
  time: string;
  duration: number;
  patientId?: string;
  notes: string;
  status: 'pending' | 'confirmed';
}

const SchedulingModal: React.FC<SchedulingModalProps> = memo(({
  isOpen,
  onClose,
  selectedDate,
  patients,
  onSchedule,
  isPatientView = false,
  doctorName,
  editingEvent,
  onUpdate
}) => {
  const [formData, setFormData] = useState<ScheduleData>({
    title: '',
    type: 'consultation',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: '',
    duration: 30,
    patientId: '',
    notes: '',
    status: 'pending'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

  // Populate form when editing an event
  useEffect(() => {
    if (editingEvent) {
      console.log('Populating form with editing event:', editingEvent);
      const duration = Math.round((editingEvent.end.getTime() - editingEvent.start.getTime()) / (1000 * 60));
      const formData = {
        title: editingEvent.title.replace(/^(Consultation|Operation|Meeting|Available Slot) - /, ''),
        type: editingEvent.type,
        date: format(editingEvent.start, 'yyyy-MM-dd'),
        time: format(editingEvent.start, 'HH:mm'),
        duration: duration,
        patientId: editingEvent.patientId || '',
        notes: editingEvent.notes || '',
        status: editingEvent.status === 'cancelled' ? 'pending' : (editingEvent.status as 'pending' | 'confirmed') || 'pending'
      };
      console.log('Setting form data:', formData);
      setFormData(formData);
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        type: 'consultation',
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        time: '',
        duration: 30,
        patientId: '',
        notes: '',
        status: 'pending'
      });
    }
  }, [editingEvent, selectedDate]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    console.log('Validating form with data:', formData);

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    if (formData.type === 'consultation' && !formData.patientId) {
      newErrors.patientId = 'Patient selection is required for consultations';
    }

    console.log('Validation errors:', newErrors);
    console.log('Form is valid:', Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    if (!formData.time) {
      alert('Please select a time');
      return;
    }

    // Create event data
    const eventData = {
      title: formData.title,
      type: formData.type,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      patientId: formData.patientId,
      notes: formData.notes,
      status: formData.status
    };

    if (editingEvent && onUpdate) {
      onUpdate(editingEvent.id, eventData);
    } else {
      onSchedule(eventData);
    }
    
    setFormData({
      title: '',
      type: 'consultation',
      date: '',
      time: '',
      duration: 30,
      patientId: '',
      notes: '',
      status: 'pending'
    });
    setErrors({});
    onClose();
  }, [validateForm, onSchedule, onUpdate, formData, editingEvent, onClose]);

  const getTypeIcon = (type: string) => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'operation':
        return 'bg-red-100 text-red-800';
      case 'meeting':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isPatientView ? 'Schedule Appointment' : 'Create Schedule'}
          </DialogTitle>
          <DialogDescription>
            {isPatientView 
              ? `Schedule an appointment with ${doctorName || 'your doctor'}`
              : 'Add a new event to your calendar'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder={isPatientView ? "Appointment with Dr. Smith" : "e.g., Consultation - John Doe"}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type" name="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Consultation
                    </div>
                  </SelectItem>
                  <SelectItem value="operation">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Operation
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Meeting
                    </div>
                  </SelectItem>
                  {!isPatientView && (
                    <SelectItem value="available">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Available Slot
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={errors.date ? 'border-red-500' : ''}
                />
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className={errors.time ? 'border-red-500' : ''}
                />
                {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select 
                  value={formData.duration.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger id="duration" name="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status" name="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'consultation' && (
              <div className="grid gap-2">
                <Label htmlFor="patient">Patient</Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger id="patient" name="patient" className={errors.patientId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {patient.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patientId && <p className="text-sm text-red-500">{errors.patientId}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional details..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingEvent 
                ? 'Update Event' 
                : isPatientView 
                  ? 'Request Appointment' 
                  : 'Create Schedule'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

SchedulingModal.displayName = 'SchedulingModal';

export default SchedulingModal;
