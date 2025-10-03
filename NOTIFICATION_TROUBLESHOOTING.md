# Notification System Troubleshooting Guide

## Issue: Notifications Not Showing Up

### Step 1: Run Database Setup
First, ensure the notifications table is properly set up:

1. **Run the database setup script:**
   ```sql
   -- Run create-notifications-table.sql in Supabase SQL Editor
   ```

2. **Create test notifications:**
   ```sql
   -- Run create-test-notifications.sql in Supabase SQL Editor
   ```

3. **Debug the database:**
   ```sql
   -- Run debug-notifications.sql in Supabase SQL Editor
   ```

### Step 2: Check Browser Console
Open your browser's developer tools and check for errors:

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Look for error messages** related to:
   - Supabase connection
   - Notification loading
   - Authentication issues

### Step 3: Test the Notification System
Navigate to the test page: `/notification-test`

This page will show:
- Current user ID
- Loading status
- Total notifications count
- Unread count
- List of all notifications
- Button to create test notifications

### Step 4: Common Issues and Solutions

#### Issue 1: "No user ID available"
**Problem:** User is not authenticated
**Solution:** 
- Check if user is logged in
- Verify authentication is working
- Check AuthContext implementation

#### Issue 2: "No profile found for user"
**Problem:** User doesn't have a profile in the profiles table
**Solution:**
- Check if user has a profile record
- Verify profile creation process
- Check RLS policies on profiles table

#### Issue 3: "Error loading notifications"
**Problem:** Database permission or connection issue
**Solution:**
- Check RLS policies on notifications table
- Verify user has permission to read notifications
- Check Supabase connection

#### Issue 4: "Notifications table doesn't exist"
**Problem:** Database setup not completed
**Solution:**
- Run `create-notifications-table.sql`
- Verify table was created successfully
- Check table permissions

#### Issue 5: "RLS policy violation"
**Problem:** Row Level Security blocking access
**Solution:**
- Check RLS policies on notifications table
- Verify policies allow user to read their own notifications
- Test with RLS temporarily disabled

### Step 5: Manual Testing

#### Test 1: Create Notification Manually
```sql
-- Replace 'your-user-id' with actual user ID
INSERT INTO notifications (
    user_id, 
    profile_id, 
    type, 
    title, 
    message, 
    action_url
) VALUES (
    'your-user-id',
    'your-profile-id',
    'system',
    'Manual Test',
    'This is a manual test notification',
    '/dashboard'
);
```

#### Test 2: Check if Notification Exists
```sql
-- Check if notifications exist for your user
SELECT * FROM notifications WHERE user_id = 'your-user-id';
```

#### Test 3: Test RLS Policies
```sql
-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications';
```

### Step 6: Environment Variables
Verify your environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 7: Check Network Requests
1. **Open Developer Tools** → **Network tab**
2. **Refresh the page**
3. **Look for requests to Supabase**
4. **Check if requests are successful (200 status)**
5. **Check response data**

### Step 8: Debug Mode
Enable debug logging by adding this to your browser console:

```javascript
// Enable Supabase debug mode
localStorage.setItem('supabase.debug', 'true');
```

### Step 9: Test Real-time Updates
1. **Open two browser tabs** with the same user
2. **Create a notification in one tab**
3. **Check if it appears in the other tab**
4. **If not, check realtime subscription**

### Step 10: Common Error Messages

#### "Failed to fetch"
- Check Supabase URL and key
- Check network connection
- Check CORS settings

#### "Permission denied"
- Check RLS policies
- Check user authentication
- Check table permissions

#### "Table doesn't exist"
- Run database setup script
- Check table name spelling
- Check schema permissions

#### "Invalid user ID"
- Check user authentication
- Check user ID format
- Check profile creation

### Step 11: Reset and Retry
If all else fails:

1. **Clear browser cache and cookies**
2. **Log out and log back in**
3. **Re-run database setup scripts**
4. **Check Supabase dashboard for errors**

### Step 12: Contact Support
If the issue persists:

1. **Collect error messages from console**
2. **Screenshot the notification test page**
3. **Provide user ID and profile ID**
4. **Check Supabase logs for errors**

## Quick Fix Checklist

- [ ] Database table created
- [ ] RLS policies set up
- [ ] User authenticated
- [ ] Profile exists
- [ ] Environment variables set
- [ ] No console errors
- [ ] Network requests successful
- [ ] Test notifications created
- [ ] Real-time subscription working

## Test URLs

- **Notification Test Page:** `/notification-test`
- **Patient Dashboard:** `/dashboard` (should show notification bell)
- **Doctor Dashboard:** `/doctor/dashboard` (should show notification bell)

## Debug Commands

```javascript
// Check current user
console.log('Current user:', user);

// Check notifications
console.log('Notifications:', notifications);

// Check loading state
console.log('Loading:', loading);

// Check unread count
console.log('Unread count:', unreadCount);
```
