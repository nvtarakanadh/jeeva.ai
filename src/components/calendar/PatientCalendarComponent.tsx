import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Calendar,
  Clock, 
  User, 
  Stethoscope, 
  Briefcase, 
  Activity, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Shield,
  TestTube,
  Scan,
  FileText
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export interface PatientAppointment {
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

interface PatientCalendarComponentProps {
  appointments: PatientAppointment[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: PatientAppointment) => void;
  onAddAppointment: (date: Date) => void;
  onEditAppointment?: (appointment: PatientAppointment) => void;
  onCancelAppointment?: (appointmentId: string) => void;
  onRescheduleAppointment?: (appointmentId: string) => void;
  onDayViewClick?: (date: Date) => void;
  view?: 'month' | 'week';
  onViewChange?: (view: 'month' | 'week') => void;
  showNavigation?: boolean;
  showAddButton?: boolean;
}

const PatientCalendarComponent: React.FC<PatientCalendarComponentProps> = memo(({
  appointments,
  onDateClick,
  onAppointmentClick,
  onAddAppointment,
  onEditAppointment,
  onCancelAppointment,
  onRescheduleAppointment,
  onDayViewClick,
  view = 'month',
  onViewChange,
  showNavigation = true,
  showAddButton = true
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-3 w-3" />;
      case 'lab_test':
        return <TestTube className="h-3 w-3" />;
      case 'scanning':
        return <Scan className="h-3 w-3" />;
      case 'other':
        return <FileText className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

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
      const dayAppointments = appointments.filter(appointment => 
        isSameDay(appointment.start, day)
      );

      days.push(
        <div
          key={day.toString()}
          className={`min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            !isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : 'bg-white'
          }`}
          onClick={() => onDateClick(day)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${
              isSameDay(day, new Date()) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
            }`}>
              {format(day, dateFormat)}
            </span>
            {onDayViewClick && isSameMonth(day, monthStart) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-100 hover:bg-blue-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDayViewClick(day);
                }}
                title="Open day view"
              >
                <Calendar className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="space-y-1">
            {dayAppointments.slice(0, 3).map((appointment) => (
              <div
                key={appointment.id}
                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getAppointmentTypeColor(appointment.appointment_type)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(appointment);
                }}
              >
                <div className="flex items-center gap-1">
                  {getAppointmentTypeIcon(appointment.appointment_type)}
                  <span className="truncate">{appointment.title}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {getStatusIcon(appointment.status)}
                  <span className="text-xs">{format(appointment.start, 'HH:mm')}</span>
                </div>
              </div>
            ))}
            {dayAppointments.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayAppointments.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Appointments
          </CardTitle>
          <div className="flex items-center gap-2">
            {onViewChange && (
              <div className="flex rounded-lg border">
                <Button
                  size="sm"
                  variant={view === 'month' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('month')}
                  className="rounded-r-none"
                >
                  Month
                </Button>
                <Button
                  size="sm"
                  variant={view === 'week' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('week')}
                  className="rounded-l-none"
                >
                  Week
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {showNavigation && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border-t">
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {weekDays.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>
          <div className="min-h-[400px]">
            {rows}
          </div>
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Consultations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Lab Tests</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span>Scanning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span>Other</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PatientCalendarComponent.displayName = 'PatientCalendarComponent';

export default PatientCalendarComponent;
