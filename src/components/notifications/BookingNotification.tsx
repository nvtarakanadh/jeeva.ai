import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface BookingRequest {
  id: string;
  patientName: string;
  patientEmail: string;
  title: string;
  type: 'consultation' | 'operation' | 'meeting';
  date: Date;
  time: string;
  duration: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
}

interface BookingNotificationProps {
  booking: BookingRequest;
  onApprove: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
  isDoctor?: boolean;
}

const BookingNotification: React.FC<BookingNotificationProps> = ({
  booking,
  onApprove,
  onReject,
  isDoctor = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <User className="h-4 w-4" />;
      case 'operation':
        return <Clock className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'text-blue-600';
      case 'operation':
        return 'text-red-600';
      case 'meeting':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isDoctor ? 'New Booking Request' : 'Booking Status Update'}
          </CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getTypeColor(booking.type)}`}>
              {getTypeIcon(booking.type)}
            </div>
            <div>
              <h3 className="font-semibold">{booking.title}</h3>
              <p className="text-sm text-muted-foreground">
                {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Patient:</span>
              <p className="text-muted-foreground">{booking.patientName}</p>
            </div>
            <div>
              <span className="font-medium">Date & Time:</span>
              <p className="text-muted-foreground">
                {format(booking.date, 'MMM dd, yyyy')} at {booking.time}
              </p>
            </div>
            <div>
              <span className="font-medium">Duration:</span>
              <p className="text-muted-foreground">{booking.duration} minutes</p>
            </div>
            <div>
              <span className="font-medium">Requested:</span>
              <p className="text-muted-foreground">
                {format(booking.requestedAt, 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>

          {booking.notes && (
            <div>
              <span className="font-medium text-sm">Notes:</span>
              <p className="text-sm text-muted-foreground mt-1">{booking.notes}</p>
            </div>
          )}

          {isDoctor && booking.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => onApprove(booking.id)}
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onReject(booking.id)}
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {!isDoctor && booking.status === 'approved' && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Your appointment has been approved!</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You will receive a confirmation email shortly.
              </p>
            </div>
          )}

          {!isDoctor && booking.status === 'rejected' && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Your appointment request was not approved.</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Please contact the doctor's office for more information.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingNotification;
