import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Stethoscope, Briefcase, Activity } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'consultation' | 'operation' | 'meeting' | 'available';
  patientName?: string;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

interface CalendarComponentProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  view?: 'month' | 'week';
  onViewChange?: (view: 'month' | 'week') => void;
  showNavigation?: boolean;
  showAddButton?: boolean;
}

const CalendarComponent: React.FC<CalendarComponentProps> = memo(({
  events,
  onDateClick,
  onEventClick,
  onAddEvent,
  view = 'month',
  onViewChange,
  showNavigation = true,
  showAddButton = true
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());


  const getEventIcon = useCallback((type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-3 w-3" />;
      case 'operation':
        return <Activity className="h-3 w-3" />;
      case 'meeting':
        return <Briefcase className="h-3 w-3" />;
      case 'available':
        return <Clock className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  }, []);

  const getEventColor = useCallback((type: string, status?: string) => {
    if (type === 'available') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return type === 'consultation' 
          ? 'bg-blue-100 text-blue-800 border-blue-200'
          : type === 'operation'
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return type === 'consultation' 
          ? 'bg-blue-100 text-blue-800 border-blue-200'
          : type === 'operation'
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-green-100 text-green-800 border-green-200';
    }
  }, []);

  const getEventsForDate = useCallback((date: Date) => {
    const dayEvents = events.filter(event => 
      isSameDay(event.start, date) || 
      (event.start <= date && event.end >= date)
    );
    console.log(`Events for ${date.toDateString()}:`, dayEvents);
    return dayEvents;
  }, [events]);

  const renderMonthView = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] p-2 border border-gray-200 ${
              isCurrentMonth ? 'bg-white' : 'bg-gray-50'
            } ${isToday ? 'bg-blue-50' : ''} cursor-pointer hover:bg-gray-50 transition-colors`}
            onClick={() => onDateClick?.(day)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday ? 'text-blue-600' : ''}`}>
                {format(day, dateFormat)}
              </span>
              {showAddButton && isCurrentMonth && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddEvent?.(day);
                  }}
                >
                  +
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded border ${getEventColor(event.type, event.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  <div className="flex items-center gap-1">
                    {getEventIcon(event.type)}
                    <span className="truncate">{event.title}</span>
                  </div>
                  <div className="text-xs opacity-75">
                    {format(event.start, 'HH:mm')}
                  </div>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  }, [currentDate, events, getEventsForDate, getEventIcon, getEventColor, onDateClick, onEventClick, onAddEvent, showAddButton]);

  const renderWeekView = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(weekStart);
    const days = [];
    let day = weekStart;

    for (let i = 0; i < 7; i++) {
      const dayEvents = getEventsForDate(day);
      const isToday = isSameDay(day, new Date());
      
      days.push(
        <div
          key={day.toString()}
          className={`min-h-[200px] p-3 border border-gray-200 ${
            isToday ? 'bg-blue-50' : 'bg-white'
          } cursor-pointer hover:bg-gray-50 transition-colors`}
          onClick={() => onDateClick?.(day)}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'EEEE')}
              </div>
              <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </div>
            </div>
            {showAddButton && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddEvent?.(day);
                }}
              >
                +
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`text-sm p-2 rounded border ${getEventColor(event.type, event.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
              >
                <div className="flex items-center gap-2">
                  {getEventIcon(event.type)}
                  <span className="font-medium truncate">{event.title}</span>
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </div>
                {event.patientName && (
                  <div className="text-xs opacity-75 flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    {event.patientName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0">
        {days}
      </div>
    );
  }, [currentDate, events, getEventsForDate, getEventIcon, getEventColor, onDateClick, onEventClick, onAddEvent, showAddButton]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            {onViewChange && (
              <div className="flex gap-1">
                <Button
                  variant={view === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewChange('month')}
                >
                  Month
                </Button>
                <Button
                  variant={view === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewChange('week')}
                >
                  Week
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showNavigation && (
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {view === 'month' ? (
          <div>
            <div className="grid grid-cols-7 gap-0 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-sm text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            {renderMonthView}
          </div>
        ) : (
          renderWeekView
        )}
      </CardContent>
    </Card>
  );
});

CalendarComponent.displayName = 'CalendarComponent';

export default CalendarComponent;