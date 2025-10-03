import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/services/scheduleService';
import { Calendar, Clock, User, Stethoscope, Briefcase, Activity, X } from 'lucide-react';
import { format } from 'date-fns';

interface MeetingDetailsModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!event) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-5 w-5" />;
      case 'operation':
        return <Activity className="h-5 w-5" />;
      case 'meeting':
        return <Briefcase className="h-5 w-5" />;
      case 'available':
        return <Clock className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: string, status?: string) => {
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
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Consultation';
      case 'operation':
        return 'Operation';
      case 'meeting':
        return 'Meeting';
      case 'available':
        return 'Available Slot';
      default:
        return 'Event';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getEventIcon(event.type)}
            <span>{event.title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Event Type and Status */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getTypeText(event.type)}
            </Badge>
            <Badge 
              className={`text-xs ${getEventColor(event.type, event.status)}`}
            >
              {getStatusText(event.status)}
            </Badge>
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Date:</span>
              <span>{format(event.start, 'EEEE, MMMM do, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Time:</span>
              <span>
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
              </span>
            </div>
          </div>

          {/* Patient Information */}
          {event.patientName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Patient:</span>
              <span className="font-medium text-blue-600">{event.patientName}</span>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Notes:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {event.notes}
              </p>
            </div>
          )}

          {/* Duration */}
          <div className="text-sm text-gray-500">
            Duration: {Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60))} minutes
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {onEdit && event.type !== 'available' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(event)}
                className="flex-1"
              >
                Edit
              </Button>
            )}
            {onDelete && event.type !== 'available' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDelete(event)}
                className="flex-1"
              >
                Delete
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingDetailsModal;
