import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Stethoscope, Briefcase, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday 
} from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'consultation' | 'meeting' | 'operation' | 'other';
  patientName?: string;
  notes?: string;
  doctorId: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  view: 'month' | 'week';
  onViewChange: (view: 'month' | 'week') => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onDateClick,
  onEventClick,
  view,
  onViewChange,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-3 w-3" />;
      case 'meeting':
        return <Briefcase className="h-3 w-3" />;
      case 'operation':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'meeting':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'operation':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const monthDays = useMemo(() => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: startDate, end: endDate });
    } catch (error) {
      console.error('Error calculating month days:', error);
      return [];
    }
  }, [currentDate]);

  const weekDays = useMemo(() => {
    try {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } catch (error) {
      console.error('Error calculating week days:', error);
      return [];
    }
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    try {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    } catch (error) {
      console.error('Error navigating month:', error);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    try {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7));
        return newDate;
      });
    } catch (error) {
      console.error('Error navigating week:', error);
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const daysToShow = view === 'month' ? monthDays : weekDays;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('month')}
                className="rounded-r-none"
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('week')}
                className="rounded-l-none"
              >
                Week
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM dd, yyyy')}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysToShow.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border rounded-lg cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                    ${isTodayDate ? 'ring-2 ring-primary' : ''}
                    hover:bg-muted
                  `}
                  onClick={() => onDateClick(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, view === 'month' ? 2 : 3).map((event) => (
                      <div
                        key={event.id}
                        className={`
                          p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity
                          ${getEventColor(event.type)}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {getEventIcon(event.type)}
                          <span className="truncate hidden sm:inline">{event.title}</span>
                          <span className="truncate sm:hidden">{event.title.split(' ')[0]}</span>
                        </div>
                        <div className="text-xs opacity-75 hidden sm:block">{event.time}</div>
                      </div>
                    ))}
                    {dayEvents.length > (view === 'month' ? 2 : 3) && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - (view === 'month' ? 2 : 3)} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Calendar;