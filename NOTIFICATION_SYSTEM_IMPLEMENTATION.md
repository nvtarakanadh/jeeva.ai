# Real-Time Notification System Implementation

## Overview
A comprehensive real-time notification system has been implemented for both Doctor and Patient modules, replacing mock data with real database-driven notifications.

## Features Implemented

### 1. Database Schema
- **Table**: `notifications`
- **RLS Policies**: User-specific access control
- **Functions**: Helper functions for CRUD operations
- **Triggers**: Automatic timestamp updates

### 2. Notification Types
- `consent_request` - New consent request from doctor
- `consent_approved` - Consent request approved by patient
- `consent_denied` - Consent request denied by patient
- `prescription_created` - New prescription created
- `prescription_updated` - Prescription updated
- `consultation_note_created` - New consultation note created
- `consultation_note_updated` - Consultation note updated
- `record_access_granted` - Record access granted
- `record_access_denied` - Record access denied
- `consultation_booked` - New consultation booked
- `consultation_updated` - Consultation updated
- `ai_analysis_complete` - AI analysis completed
- `health_alert` - Health alert generated
- `system` - System notifications

### 3. Core Components

#### NotificationService (`src/services/notificationService.ts`)
- `getUserNotifications()` - Fetch user notifications
- `markNotificationAsRead()` - Mark single notification as read
- `markAllNotificationsAsRead()` - Mark all notifications as read
- `createNotification()` - Create new notification
- `deleteNotification()` - Delete notification
- `getUnreadCount()` - Get unread count
- Helper functions for specific notification types

#### NotificationContext (`src/contexts/NotificationContext.tsx`)
- Real-time subscription to notification changes
- Automatic loading of notifications on user change
- State management for notifications, unread count, and loading
- Functions for marking as read, deleting, and refreshing

#### NotificationDropdown (`src/components/layout/NotificationDropdown.tsx`)
- Enhanced UI with loading states
- Individual notification actions (mark as read, delete)
- Click-to-navigate functionality
- "Mark all as read" button
- Real-time updates

### 4. Integration Points

#### Consent Service Integration
- **Consent Request Created**: Notifies patient
- **Consent Approved**: Notifies doctor + creates record access notification
- **Consent Denied**: Notifies doctor

#### Prescription Service Integration
- **Prescription Created**: Notifies patient with prescription details

#### Consultation Service Integration
- **Consultation Booked**: Notifies doctor with patient and date info

### 5. Navigation Mapping
- `consent_request` → `/consent-management`
- `consent_approved/denied` → `/consent-management`
- `prescription_created/updated` → `/prescriptions`
- `consultation_note_created/updated` → `/consultation-notes`
- `record_access_granted/denied` → `/patient-records`
- `consultation_booked/updated` → `/consultations`
- `ai_analysis_complete` → `/ai-insights`
- `health_alert/system` → `/dashboard`

### 6. Real-Time Features
- **Supabase Realtime**: Automatic updates when notifications change
- **User-Specific**: Only shows notifications for current user
- **Live Updates**: No page refresh needed for new notifications

### 7. User Experience
- **Loading States**: Spinner while fetching notifications
- **Empty States**: Friendly message when no notifications
- **Visual Indicators**: Unread dot, icons for different types
- **Quick Actions**: Mark as read, delete, navigate
- **Responsive Design**: Works on all screen sizes

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the notifications table:
```sql
-- Run create-notifications-table.sql in Supabase SQL Editor
```

### 2. Environment Variables
Ensure your Supabase environment variables are properly configured:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Testing
Use the test script to verify functionality:
```bash
node test-notification-system.js
```

## Usage Examples

### Creating a Notification
```typescript
import { createNotification } from '@/services/notificationService';

await createNotification({
  userId: 'user-id',
  profileId: 'profile-id',
  type: 'consent_request',
  title: 'New Consent Request',
  message: 'Dr. Smith has requested access to your records',
  actionUrl: '/consent-management'
});
```

### Using in Components
```typescript
import { useNotifications } from '@/contexts/NotificationContext';

const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
```

## Security Features
- **RLS Policies**: Users can only see their own notifications
- **Profile ID Validation**: Notifications linked to user profiles
- **Secure Functions**: Database functions with proper permissions
- **Input Validation**: All inputs validated before database operations

## Performance Optimizations
- **Indexes**: Optimized database queries with proper indexes
- **Pagination**: Limit notifications to prevent large data loads
- **Real-time Efficiency**: Only subscribed to user-specific changes
- **Caching**: Context-level caching of notification state

## Future Enhancements
- Push notifications for mobile
- Email notifications for important events
- Notification preferences/settings
- Bulk operations (mark multiple as read)
- Notification categories and filtering
- Rich notification content (images, attachments)

## Troubleshooting

### Common Issues
1. **Notifications not showing**: Check RLS policies and user authentication
2. **Real-time not working**: Verify Supabase realtime is enabled
3. **Permission errors**: Ensure user has proper profile setup
4. **Navigation not working**: Check actionUrl and route configuration

### Debug Steps
1. Check browser console for errors
2. Verify database connection
3. Test notification creation manually
4. Check user profile and authentication status
5. Verify RLS policies are correctly configured

## Files Modified/Created
- `create-notifications-table.sql` - Database schema
- `src/services/notificationService.ts` - Service layer
- `src/contexts/NotificationContext.tsx` - Context provider
- `src/components/layout/NotificationDropdown.tsx` - UI component
- `src/types/index.ts` - Type definitions
- `src/services/consentService.ts` - Integration
- `src/services/prescriptionService.ts` - Integration
- `src/services/consultationService.ts` - Integration
- `test-notification-system.js` - Test script
