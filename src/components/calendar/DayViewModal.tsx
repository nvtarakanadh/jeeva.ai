import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Plus, 
  User, 
  Stethoscope, 
  Briefcase, 
  Activity, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Shield,
  X,
  Calendar,
  Save
} from 'lucide-react';
import { format, addMinutes, isSameDay, startOfDay, endOfDay } from 'date-fns';

export interface DayViewEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  event_type: 'consultation' | 'blocked' | 'followup' | 'meeting' | 'reminder';
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  patient_name?: string;
  notes?: string;
  doctor_id: string;
  patient_id?: string;
  is_available: boolean;
}

interface TimeSlot {
  time: Date;
  display: string;
  events: DayViewEvent[];
}

interface DayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  events: DayViewEvent[];
  onScheduleEvent: (timeSlot: Date, duration: number, eventData?: {
    title: string;
    type: 'consultation' | 'meeting';
    notes?: string;
  }) => void;
  onEditEvent: (event: DayViewEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onMoveEvent: (eventId: string, newStart: Date, newEnd: Date) => void;
  onResizeEvent: (eventId: string, newEnd: Date) => void;
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  events,
  onScheduleEvent,
  onEditEvent,
  onDeleteEvent,
  onMoveEvent,
  onResizeEvent
}) => {
  const [draggedEvent, setDraggedEvent] = useState<DayViewEvent | null>(null);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'consultation' as 'consultation' | 'meeting',
    duration: 30,
    notes: ''
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate time slots from 8 AM to 8 PM (30-minute intervals)
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const slots: TimeSlot[] = [];
    // Create a new date object for the selected date to avoid timezone issues
    const baseDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const startTime = new Date(baseDate);
    startTime.setHours(8, 0, 0, 0); // 8:00 AM
    
    
    for (let i = 0; i < 24; i++) { // 24 slots of 30 minutes each
      const slotTime = new Date(startTime);
      slotTime.setMinutes(slotTime.getMinutes() + (i * 30));
      
      const slotEvents = events.filter(event => {
        const eventDate = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return eventDate.getTime() === selectedDateOnly.getTime() &&
               event.start <= slotTime &&
               event.end > slotTime;
      });
      
      slots.push({
        time: slotTime,
        display: format(slotTime, 'h:mm a'),
        events: slotEvents
      });
    }
    
    
    return slots;
  }, [selectedDate, events]);

  const getEventIcon = useCallback((eventType: string, status: string) => {
    if (eventType === 'consultation') {
      if (status === 'pending') return <Clock className="h-3 w-3" />;
      if (status === 'confirmed') return <CheckCircle className="h-3 w-3" />;
      if (status === 'cancelled') return <XCircle className="h-3 w-3" />;
      return <Stethoscope className="h-3 w-3" />;
    }
    
    switch (eventType) {
      case 'blocked': return <Shield className="h-3 w-3" />;
      case 'followup': return <Activity className="h-3 w-3" />;
      case 'meeting': return <Briefcase className="h-3 w-3" />;
      case 'reminder': return <Bell className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  }, []);

  const getEventColor = useCallback((eventType: string, status: string) => {
    if (eventType === 'consultation') {
      if (status === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (status === 'confirmed') return 'bg-green-100 text-green-800 border-green-200';
      if (status === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    switch (eventType) {
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'followup': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'meeting': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reminder': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  // Removed vertical calculation functions as we're using horizontal layout

  const handleSlotClick = useCallback((slotTime: Date) => {
    setSelectedSlot(slotTime);
    setShowEventForm(true);
  }, []);

  const handleEventFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !eventForm.title.trim()) return;

    const startTime = selectedSlot;
    const endTime = addMinutes(startTime, eventForm.duration);
    
    // Pass event data to the callback
    onScheduleEvent(startTime, eventForm.duration, {
      title: eventForm.title,
      type: eventForm.type,
      notes: eventForm.notes
    });
    
    // Reset form
    setEventForm({
      title: '',
      type: 'consultation',
      duration: 30,
      notes: ''
    });
    setShowEventForm(false);
    setSelectedSlot(null);
  }, [selectedSlot, eventForm, onScheduleEvent]);

  const handleEventFormCancel = useCallback(() => {
    setShowEventForm(false);
    setSelectedSlot(null);
    setEventForm({
      title: '',
      type: 'consultation',
      duration: 30,
      notes: ''
    });
  }, []);

  const handleEventClick = useCallback((event: DayViewEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditEvent(event);
  }, [onEditEvent]);

  const handleEventDelete = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteEvent(eventId);
  }, [onDeleteEvent]);

  const handleMouseDown = useCallback((event: DayViewEvent, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedEvent(event);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedEvent) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const slotWidth = 64; // 64px per 30-minute slot
    const slotIndex = Math.floor(x / slotWidth);
    const newStart = addMinutes(startOfDay(selectedDate), 480 + (slotIndex * 30));
    
    if (slotIndex !== dragStartSlot) {
      setDragStartSlot(slotIndex);
      onMoveEvent(draggedEvent.id, newStart, addMinutes(newStart, 30));
    }
  }, [isDragging, draggedEvent, dragStartSlot, selectedDate, onMoveEvent]);

  const handleMouseUp = useCallback(() => {
    setDraggedEvent(null);
    setDragStartSlot(null);
    setIsDragging(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden p-0 bg-white shadow-2xl">
        {/* Clean Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
              </h2>
              <p className="text-sm text-gray-600">Click on any time slot to schedule an event</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            /* Mobile: Vertical List */
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-3">
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-start bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 text-sm text-gray-700 font-bold flex-shrink-0 p-3 bg-gray-50 rounded-l-lg border-r border-gray-200">
                      {slot.display}
                    </div>
                    <div 
                      className="flex-1 min-h-[60px] p-3 hover:bg-blue-50 cursor-pointer relative group transition-colors"
                      onClick={() => handleSlotClick(slot.time)}
                    >
                      {slot.events.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            <span>Add event at {format(slot.time, 'h:mm a')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slot.events.map((event) => (
                            <div
                              key={event.id}
                              className={`
                                p-3 rounded-lg border cursor-pointer shadow-sm hover:shadow-md transition-all group
                                ${getEventColor(event.event_type, event.status)}
                              `}
                              onClick={(e) => handleEventClick(event, e)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getEventIcon(event.event_type, event.status)}
                                  <span className="text-sm font-semibold">
                                    {event.title}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                                  onClick={(e) => handleEventDelete(event.id, e)}
                                  title="Delete event"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              {event.patient_name && (
                                <div className="text-xs opacity-75 mt-1">
                                  {event.patient_name}
                                </div>
                              )}
                              <div className="text-xs opacity-75 mt-1 font-medium">
                                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Desktop: Horizontal Timeline */
            <div className="h-full flex flex-col">
              {/* Timeline Container - Scrollable with synchronized time labels */}
              <div 
                className="flex-1 overflow-x-auto overflow-y-hidden"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Time Labels Header - Scrolls with timeline */}
                <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-2 sticky top-0 z-20">
                  <div className="flex min-w-max">
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-20 text-center text-sm text-gray-700 font-semibold"
                      >
                        {slot.display}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Timeline Slots */}
                <div className="flex min-w-max h-32">
                  {timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-20 border-r border-gray-200 hover:bg-blue-50 cursor-pointer relative group transition-colors"
                      onClick={() => handleSlotClick(slot.time)}
                    >
                      {/* Empty Slot Indicator */}
                      {slot.events.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-5 w-5" />
                        </div>
                      )}
                      
                      {/* Events in this slot */}
                      {slot.events.map((event) => {
                        const eventStartMinutes = event.start.getHours() * 60 + event.start.getMinutes();
                        const slotStartMinutes = slot.time.getHours() * 60 + slot.time.getMinutes();
                        const eventDuration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                        const eventWidth = Math.max((eventDuration / 30) * 80, 80);
                        const leftOffset = ((eventStartMinutes - slotStartMinutes) / 30) * 80;
                        
                        return (
                          <div
                            key={event.id}
                            className={`
                              absolute top-2 bottom-2 rounded-lg border cursor-move z-10 shadow-sm hover:shadow-md transition-all
                              ${getEventColor(event.event_type, event.status)}
                              ${isDragging && draggedEvent?.id === event.id ? 'opacity-50' : ''}
                            `}
                            style={{
                              left: `${leftOffset}px`,
                              width: `${eventWidth}px`,
                              minWidth: '80px'
                            }}
                            onClick={(e) => handleEventClick(event, e)}
                            onMouseDown={(e) => handleMouseDown(event, e)}
                            title={`${event.title}${event.patient_name ? ` - ${event.patient_name}` : ''}${event.notes ? ` - ${event.notes}` : ''}`}
                          >
                            <div className="p-2 h-full flex flex-col justify-center group">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {getEventIcon(event.event_type, event.status)}
                                  <span className="text-xs font-semibold truncate">
                                    {event.title}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                                  onClick={(e) => handleEventDelete(event.id, e)}
                                  title="Delete event"
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </div>
                              
                              {event.patient_name && (
                                <div className="text-xs opacity-75 truncate mt-1">
                                  {event.patient_name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Event Form Modal */}
        {showEventForm && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Add New Event
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(selectedSlot, 'h:mm a')} on {format(selectedSlot, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleEventFormSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                      Event Title
                    </Label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter event title"
                      required
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                      Event Type
                    </Label>
                    <Select
                      value={eventForm.type}
                      onValueChange={(value: 'consultation' | 'meeting') => 
                        setEventForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                            <span>Consultation</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="meeting">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-purple-600" />
                            <span>Meeting</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration" className="text-sm font-semibold text-gray-700">
                      Duration
                    </Label>
                    <Select
                      value={eventForm.duration.toString()}
                      onValueChange={(value) => 
                        setEventForm(prev => ({ ...prev, duration: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={eventForm.notes}
                      onChange={(e) => setEventForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes or description..."
                      rows={3}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Event
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleEventFormCancel}
                      className="px-6 border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DayViewModal;
