import { supabase } from '@/integrations/supabase/client';

export interface BookingRequest {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  title: string;
  type: 'consultation' | 'operation' | 'meeting';
  date: string;
  time: string;
  duration: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  patientId: string;
  doctorId: string;
  title: string;
  type: 'consultation' | 'operation' | 'meeting';
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

// Create a new booking request
export const createBookingRequest = async (bookingData: CreateBookingRequest): Promise<BookingRequest> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .insert([{
        ...bookingData,
        status: 'pending',
        requested_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create booking request: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating booking request:', error);
    throw error;
  }
};

// Get booking requests for a doctor
export const getDoctorBookingRequests = async (doctorId: string): Promise<BookingRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        patient:profiles!patient_id(full_name, email)
      `)
      .eq('doctor_id', doctorId)
      .order('requested_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch booking requests: ${error.message}`);
    }

    return data.map(booking => ({
      ...booking,
      patientName: booking.patient?.full_name || 'Unknown Patient',
      patientEmail: booking.patient?.email || ''
    }));
  } catch (error) {
    console.error('Error fetching doctor booking requests:', error);
    throw error;
  }
};

// Get booking requests for a patient
export const getPatientBookingRequests = async (patientId: string): Promise<BookingRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        doctor:profiles!doctor_id(full_name, email)
      `)
      .eq('patient_id', patientId)
      .order('requested_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch booking requests: ${error.message}`);
    }

    return data.map(booking => ({
      ...booking,
      patientName: booking.patient?.full_name || 'Unknown Patient',
      patientEmail: booking.patient?.email || ''
    }));
  } catch (error) {
    console.error('Error fetching patient booking requests:', error);
    throw error;
  }
};

// Update booking request status
export const updateBookingStatus = async (
  bookingId: string, 
  status: 'approved' | 'rejected'
): Promise<BookingRequest> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking status: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Create calendar event when booking is approved
export const createCalendarEvent = async (booking: BookingRequest): Promise<void> => {
  try {
    const startDateTime = new Date(`${booking.date}T${booking.time}`);
    const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60 * 1000);

    const { error } = await supabase
      .from('calendar_events')
      .insert([{
        doctor_id: booking.doctorId,
        patient_id: booking.patientId,
        title: booking.title,
        type: booking.type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: booking.notes,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Send notification (mock implementation)
export const sendBookingNotification = async (
  userId: string,
  type: 'booking_approved' | 'booking_rejected' | 'new_booking_request',
  message: string
): Promise<void> => {
  try {
    // In a real app, this would integrate with a notification service
    console.log(`Notification sent to user ${userId}: ${type} - ${message}`);
    
    // For now, we'll just log it
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        message,
        read: false,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error saving notification:', error);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Approve booking request
export const approveBookingRequest = async (bookingId: string): Promise<void> => {
  try {
    // Update booking status
    const booking = await updateBookingStatus(bookingId, 'approved');
    
    // Create calendar event
    await createCalendarEvent(booking);
    
    // Send notifications
    await sendBookingNotification(
      booking.patientId,
      'booking_approved',
      `Your appointment "${booking.title}" has been approved for ${booking.date} at ${booking.time}`
    );
    
    await sendBookingNotification(
      booking.doctorId,
      'new_booking_request',
      `New approved appointment: ${booking.title} with ${booking.patientName}`
    );
  } catch (error) {
    console.error('Error approving booking request:', error);
    throw error;
  }
};

// Reject booking request
export const rejectBookingRequest = async (bookingId: string): Promise<void> => {
  try {
    // Update booking status
    const booking = await updateBookingStatus(bookingId, 'rejected');
    
    // Send notification to patient
    await sendBookingNotification(
      booking.patientId,
      'booking_rejected',
      `Your appointment request "${booking.title}" for ${booking.date} at ${booking.time} was not approved. Please contact the doctor's office for more information.`
    );
  } catch (error) {
    console.error('Error rejecting booking request:', error);
    throw error;
  }
};
