import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Stethoscope, Briefcase, Activity, AlertCircle, Shield, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleData {
  title: string;
  event_type: 'consultation' | 'blocked' | 'followup' | 'meeting' | 'reminder';
  date: string;
  time: string;
  duration: number;
  patientId: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
}

interface EnhancedSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  patients: any[];
  onSchedule: (data: ScheduleData) => void;
  onUpdate?: (eventId: string, data: ScheduleData) => void;
  editingEvent?: any;
  isPatientView?: boolean;
  doctorName?: string;
}

const EnhancedSchedulingModal: React.FC<EnhancedSchedulingModalProps> = React.memo(({
  isOpen,
  onClose,
  selectedDate,
  patients,
  onSchedule,
  onUpdate,
  editingEvent,
  isPatientView = false,
  doctorName
}) => {
  const [formData, setFormData] = useState<ScheduleData>({
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

  // Populate form when editing an event
  useEffect(() => {
    if (editingEvent) {
      console.log('Populating form with editing event:', editingEvent);
      console.log('Event type from editing event:', editingEvent.event_type || editingEvent.type);
      
      setFormData({
        title: editingEvent.title,
        event_type: editingEvent.event_type || editingEvent.type || 'consultation',
        date: format(editingEvent.start, 'yyyy-MM-dd'),
        time: format(editingEvent.start, 'HH:mm'),
        duration: Math.round((editingEvent.end.getTime() - editingEvent.start.getTime()) / (1000 * 60)),
        patientId: editingEvent.patient_id || editingEvent.patientId || '',
        notes: editingEvent.notes || '',
        status: editingEvent.status || 'confirmed'
      });
      
      console.log('Form data set to:', {
        title: editingEvent.title,
        event_type: editingEvent.event_type || editingEvent.type || 'consultation',
        date: format(editingEvent.start, 'yyyy-MM-dd'),
        time: format(editingEvent.start, 'HH:mm'),
        duration: Math.round((editingEvent.end.getTime() - editingEvent.start.getTime()) / (1000 * 60)),
        patientId: editingEvent.patient_id || editingEvent.patientId || '',
        notes: editingEvent.notes || '',
        status: editingEvent.status || 'confirmed'
      });
    } else {
      setFormData({
        title: '',
        event_type: 'consultation',
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
      newErrors.patientId = 'Patient selection is required for consultations';
    }

    if (formData.event_type === 'followup' && !formData.patientId) {
      newErrors.patientId = 'Patient selection is required for follow-ups';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (editingEvent && onUpdate) {
      onUpdate(editingEvent.id, formData);
    } else {
      onSchedule(formData);
    }
    
    setFormData({
      title: '',
      event_type: 'consultation',
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

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-4 w-4" />;
      case 'blocked':
        return <Shield className="h-4 w-4" />;
      case 'followup':
        return <Bell className="h-4 w-4" />;
      case 'meeting':
        return <Briefcase className="h-4 w-4" />;
      case 'reminder':
        return <Activity className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeDescription = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Patient consultation appointment';
      case 'blocked':
        return 'Mark time as unavailable';
      case 'followup':
        return 'Follow-up reminder for patient';
      case 'meeting':
        return 'Administrative or clinic meeting';
      case 'reminder':
        return 'General reminder or task';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {editingEvent ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
          <DialogDescription>
            {editingEvent 
              ? 'Update the event details'
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
                placeholder="Enter event title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select 
                value={formData.event_type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, event_type: value }))}
              >
                <SelectTrigger id="event_type" name="event_type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      <div>
                        <div>Consultation</div>
                        <div className="text-xs text-gray-500">Patient appointment</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div>Blocked Time</div>
                        <div className="text-xs text-gray-500">Mark as unavailable</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="followup">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <div>
                        <div>Follow-up</div>
                        <div className="text-xs text-gray-500">Patient reminder</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <div>
                        <div>Meeting</div>
                        <div className="text-xs text-gray-500">Administrative meeting</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="reminder">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <div>
                        <div>Reminder</div>
                        <div className="text-xs text-gray-500">General reminder</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {getEventTypeDescription(formData.event_type)}
              </p>
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
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.event_type === 'consultation' || formData.event_type === 'followup') && (
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
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EnhancedSchedulingModal.displayName = 'EnhancedSchedulingModal';

export default EnhancedSchedulingModal;
